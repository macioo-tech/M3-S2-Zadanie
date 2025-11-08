import {IncomingMessage, ServerResponse} from "node:http";
import fs from "node:fs/promises"
import path from "node:path";
import {fileURLToPath} from "node:url";
import * as db from "./db.js";
import {User, Car} from "./types.js";
import crypto from "node:crypto";
import {setAuthCookie, generateToken, authUser} from "./auth.js";
import {parseBody, findHeader, sendJSON, checkAuth} from './helpers.js';
import {Pool} from 'pg';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const FRONTEND_DIR = path.join(__dirname, '..', 'frontend');
const clients: ServerResponse[] = [];

// Main server API router handler
export async function router(req: IncomingMessage, res: ServerResponse, pool: Pool) {
  const method = req.method;
  const url = new URL(req.url!, `http://${req.headers.host}`)
  const [reqPath, reqId, optional] = url.pathname.split("/").filter(Boolean);

  try {
    // serve static files
    if (reqPath === undefined ||
      reqPath === 'index.html' ||
      reqPath === 'style.css' ||
      reqPath === 'main.js') {
      const filePath = path.join(FRONTEND_DIR, url.pathname === '/' ? '/index.html' : url.pathname);
      if (!filePath.startsWith(FRONTEND_DIR)) {
        return;
      }
      try {
        const stats = await fs.stat(filePath);
        if (stats.isFile()) {
          const fileStream = await fs.readFile(filePath);
          //res.writeHead(200, { 'Content-Type': getMimeType(filePath) }).end(fileStream);
          res.writeHead(200, findHeader(reqPath)).end(fileStream);
          return;
        }
      } catch (e) {
        res.writeHead(404, findHeader(reqPath)).end("File Not Found");
        return;
      }
      return;
    }

    // GET
    if (method === 'GET') {
      // /users/{id} /cars/{id} // id is optional
      // {id} is optional, if no id return all abjects

      // if (!await checkAuth(req, res)) return
      if (reqPath === 'users' || reqPath === 'cars') {
        await db.Read(reqPath, pool, res, reqId);
        return;
      }
    }

    // PUT
    if (method === 'PUT') {
      // /users/id /cars/{id} // id is required
      const auth = await authUser(req);
      if (!auth) {
        res.writeHead(400, findHeader(reqPath)).end(JSON.stringify('User Not Authenticated'));
        return;
      }
      if (reqId) {
        if (reqPath === 'users' || reqPath === 'cars') {
          const body = await parseBody(req);
          await db.Update(reqPath, reqId, JSON.parse(body.toString()));
          res.writeHead(200, findHeader(reqPath)).end(body);
          return;
        }
      }
    }

    // POST
    if (method === 'POST') {
      if (reqPath === 'cars') {
        if (!await checkAuth(req, res)) return
        // /cars
        if (!reqId && !optional) {
          const body = await parseBody(req);
          const newData: Car = JSON.parse(body.toString());
          await db.Create(reqPath, newData, pool, res);
          return;
        }
        // /cars/{id}/buy // id is required
        if (reqId && optional === 'buy') {
          const body = await parseBody(req);
          const {buyerId} = JSON.parse(body.toString());
          if (!buyerId) {
            res.writeHead(400).end(JSON.stringify('Incorrect Username'));
            return;
          }
          const car: Car = await db.Read('cars', reqId)
          if (!car) {
            res.writeHead(400).end(JSON.stringify('Car Not Found'));
            return;
          }
          if (car.ownerId !== '') {
            res.writeHead(400).end(JSON.stringify('Car Is Owned'));
            return;
          }
          const buyer: User = await db.Read('users', buyerId)
          if (!buyer) {
            res.writeHead(400).end(JSON.stringify('User Not Found'));
            return;
          }
          if (buyer.balance < car.price) {
            res.writeHead(400).end(JSON.stringify('Balance Not Enough'));
            return;
          }
          buyer.balance -= car.price;
          await db.Update('users', buyer.id, buyer);
          car.ownerId = buyer.id;
          await db.Update('cars', car.id, car);
          res.writeHead(200, findHeader(reqPath)).end(JSON.stringify('Car Bought'))
          sseEvent('car-bought', {id: car.id, buyerId: buyer.id});
          return;
        }
      }

      // /login
      if (reqPath === 'login') {
        const body = await parseBody(req);
        const {username, password} = JSON.parse(body.toString());
        if (!username || !password) {
          sendJSON(res, 400, {error: '❌Invalid Username Or Password'});
          return;
        }
        const data = db.Read('users', pool, res)
        const users: User[] = await db.Read('users');
        const user = users.find((u) => u.username === username && u.password === password);
        if (user) {
          const token: string = generateToken(user.id);
          setAuthCookie(res, token, 60 * 60 * 24 * 2);
          res.writeHead(200, findHeader(reqPath)).end(JSON.stringify(user))
        } else {
          res.writeHead(400, findHeader(reqPath)).end(JSON.stringify('Invalid Username Or Password'))
        }
        return;
      }

      // /logout
      if (reqPath === 'logout') {
        // Clear the authentication cookie
        res.setHeader(
          'Set-Cookie',
          'token=; HttpOnly; Secure; Path=/; Max-Age=0'
        );
        res.writeHead(200, {'Content-Type': 'application/json'}).end(JSON.stringify({message: 'Logged out successfully'}));
        return;
      }

      // /me -  (session refresh)
      if (reqPath === 'me') {
        const user = await authUser(req);
        if (!user) {
          res.writeHead(401, {'Content-Type': 'application/json'}).end(JSON.stringify({error: 'Not authenticated'}));
          return;
        }
        res.writeHead(200, {'Content-Type': 'application/json'}).end(JSON.stringify(user));
        return;
      }

      //  /register
      if (reqPath === 'register') {
        const body = await parseBody(req);
        const {username, password} = JSON.parse(body.toString());
        if (!username || !password) {
          res.writeHead(400).end(JSON.stringify('Invalid Username Or Password'));
          return;
        }
        const users: User[] = await db.Read('users');
        if (users.find((u) => u.username === username)) {
          res.writeHead(400, findHeader(reqPath)).end(JSON.stringify('Username Already Registered'));
          return;
        }
        const newData: User = JSON.parse(body.toString());
        newData.id = `user${crypto.randomBytes(4).toString('hex')}`;
        newData.role = 'user';
        newData.balance = 0;
        await db.Create('users', newData);
        res.writeHead(201, findHeader(reqPath)).end(JSON.stringify('Register Ok'));
        return;
      }

      // /hack/{id}/{cash}
      if (reqPath === 'hack' && reqId && optional) {
        const auth = await authUser(req)
        if (!auth) {
          res.writeHead(400, findHeader(reqPath)).end(JSON.stringify('User Not Authenticated'));
          return;
        }
        const user: User = await db.Read('users', reqId);
        if (!user) {
          res.writeHead(400).end(JSON.stringify('User Not Found'));
          return;
        }
        const cash = parseInt(optional);
        if (isNaN(cash)) {
          res.writeHead(400).end(JSON.stringify('Cash Is Not A Number'));
          return;
        }
        user.balance += cash;
        await db.Update('users', user.id, user);
        res.writeHead(200, findHeader(reqPath)).end(JSON.stringify('User Hacked Successfully'));
        return;
      }
    }

    // DELETE
    if (method === 'DELETE') {
      // /users/{id} /cars/{id} // id is required
      const auth = await authUser(req)
      if (!auth) {
        res.writeHead(400, findHeader(reqPath)).end(JSON.stringify('User Not Authenticated'));
        return;
      }
      if (auth.role !== 'admin') {
        res.writeHead(400, findHeader(reqPath)).end(JSON.stringify('Forbidden'));
        return;
      }
      if (reqId) {
        if (reqPath === 'users' || reqPath === 'cars') {
          let data: string = JSON.stringify(await db.Delete(reqPath, reqId));
          res.writeHead(200, findHeader(reqPath)).end(data);
          return;
        }
      }
    }

    // /sse
    if (reqPath === 'sse') {
      res.writeHead(200, {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive"
      });
      clients.push(res);
      req.on("close", () => {
        const index = clients.indexOf(res);
        if (index !== -1) {
          clients.splice(index, 1);
        }
      });
      return
    }

    res.writeHead(404, `Method ${method} /${reqPath} does not exist`).end();
  } catch (e) {
    res.writeHead(500, `Server Error ${e}`).end();
  }
}