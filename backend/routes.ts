import {IncomingMessage, ServerResponse} from "node:http";
import fs from "node:fs/promises"
import path from "node:path";
import {fileURLToPath} from "node:url";
import * as db from "./db.js";
import {User, Car} from "./types.js";
import crypto from "node:crypto";
import {debuglog} from "node:util";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const FRONTEND_DIR = path.join(__dirname, '..', 'frontend');

function findHeader (reqPath : string) : string {
    switch (path.extname(reqPath === undefined ? '/index.html' : reqPath).toLowerCase()) {
        case '.html': return 'text/html';
        case '.css': return 'text/css';
        case '.js': return 'application/javascript';
        default: return 'application/json';
    }
}

async function parseRequestBody(req: IncomingMessage): Promise<string> {
    return new Promise((resolve) => {
        let data = '';
        req.on('data', (chunk) => {
            data += chunk;
        });
        req.on('end', () => {
            resolve(data);
        });
    });
}

// Main server API router handler
export async function router(req: IncomingMessage, res: ServerResponse) {
    const method = req.method;
    const url = new URL(req.url!, `http://${req.headers.host}`)
    const [reqPath, reqId, optional ] = url.pathname.split("/").filter(Boolean);
 //   let data = '';

    try {
        // serve static files
        if(reqPath === undefined ||
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
            if(reqPath === 'users' || reqPath === 'cars') {
                let data : string = JSON.stringify(await db.Read(reqPath, reqId));
                res.writeHead(200, findHeader(reqPath)).end(data);
                return;
            }
        }

        // PUT
        if (method === 'PUT') {
            // /users/id /cars/{id} // id is required
            if (reqId) {
                if(reqPath === 'users' || reqPath === 'cars') {
                    const body = await parseRequestBody(req);
                    await db.Update(reqPath, reqId, JSON.parse(body.toString()));
                    res.writeHead(200, findHeader(reqPath)).end(body);
                    return;
                }
            }
        }

        // POST
        if (method === 'POST') {
            // /cars
            if (reqPath === 'cars' && !reqId && !optional) {
                const body = await parseRequestBody(req);
                const newData : Car = JSON.parse(body.toString());
                newData.id = `car${crypto.randomBytes(4).toString('hex')}`;
                newData.ownerId = '';
                console.log(newData);
                await db.Create(reqPath, newData);
                res.writeHead(201, findHeader(reqPath)).end(JSON.stringify(newData));
                return;
            }

            // /cars/{id}/buy // id is required
            if (reqPath === 'cars' && reqId && optional === 'buy') {
                const body = await parseRequestBody(req);
                const { buyerId } = JSON.parse(body.toString());
                console.log(body);
                if(!buyerId) {
                    res.writeHead(400).end(JSON.stringify('Incorrect Username'));
                    return;
                }
                const car : Car[] = await db.Read('cars', reqId)
                if(!Array.isArray(car)) {
                    res.writeHead(400).end(JSON.stringify('Car Not Found'));
                    return;
                }
                if (car[0].ownerId !== '') {
                    res.writeHead(400).end(JSON.stringify('Car Is Owned'));
                    return;
                }
                const buyer : User[] = await db.Read('users', buyerId)
                if(!Array.isArray(buyer)) {
                    res.writeHead(400).end(JSON.stringify('User Not Found'));
                    return;
                }
                if (buyer[0].balance < car[0].price) {
                    res.writeHead(400).end(JSON.stringify('Balance Not Enough'));
                    return;
                }
                buyer[0].balance -= car[0].price;
                await db.Update('users', buyer[0].id, buyer[0]);
                car[0].ownerId = buyer[0].id;
                await db.Update('cars', car[0].id, car[0]);
                res.writeHead(200, findHeader(reqPath)).end(JSON.stringify('Car Bought'))
                return;
            }

            // /login
            if(reqPath === 'login') {
                const body = await parseRequestBody(req);
                const { username, password } = JSON.parse(body.toString());
                if(!username || !password) {
                    res.writeHead(400, findHeader(reqPath)).end(JSON.stringify('Invalid Username Or Password'));
                    return;
                }
                const users : User[] = await db.Read('users');
                const user = users.find((u) => u.username === username && u.password === password);
                if(user) {
                    res.writeHead(200, findHeader(reqPath)).end(JSON.stringify('Login Ok'))
                } else {
                    res.writeHead(400, findHeader(reqPath)).end(JSON.stringify('Invalid Username Or Password'))
                }
                return;
            }

            //  /register
            if(reqPath === 'register') {
                const body = await parseRequestBody(req);
                const { username, password } = JSON.parse(body.toString());
                if (!username || !password) {
                    res.writeHead(400).end(JSON.stringify('Invalid Username Or Password'));
                    return;
                }
                const users: User[] = await db.Read('users');
                if (users.find((u) => u.username === username)) {
                    res.writeHead(400, findHeader(reqPath)).end(JSON.stringify('Username Already Registered'));
                    return;
                }
                const newData : User = JSON.parse(body.toString());
                newData.id = `$user${crypto.randomBytes(4).toString('hex')}`;
                newData.role = 'user';
                newData.balance = 0;
                console.log(newData);
                await db.Create('users', newData);
                res.writeHead(201, findHeader(reqPath)).end(JSON.stringify('Register Ok'));
                return;
            }

            // /hack/{id}/{cash}
            if(reqPath === 'hack' && reqId && optional) {
                const user : User[] = await db.Read('users', reqId);
                if(!Array.isArray(user)) {
                    res.writeHead(400).end(JSON.stringify('User Not Found'));
                    return;
                }
                const cash = parseInt(optional);
                if(isNaN(cash)) {
                    res.writeHead(400).end(JSON.stringify('Cash Is Not A Number'));
                    return;
                }
                user[0].balance += cash;
                await db.Update('users', user[0].id, user[0]);
                res.writeHead(200, findHeader(reqPath)).end(JSON.stringify('User Hacked Successfully'));
                return;
            }
        }

        // /sse
        if(reqPath === 'sse') {
            const clients: ServerResponse[] = [];

            res.writeHead(200, {
                "Content-Type": "text/event-stream",
                "Cache-Control": "no-cache",
                "Connection": "keep-alive"
            });
            clients.push(res);
            console.log('SSE Client Connected')
            req.on("close", () => {
                const index = clients.indexOf(res);
                console.log('SSE Client Disconnected');
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