import {IncomingMessage, ServerResponse} from "node:http";
import fs from "node:fs/promises"
import path from "node:path";
import {fileURLToPath} from "node:url";
import * as db from "./db.js";
import {User, Car} from "./types.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const FRONTEND_DIR = path.join(__dirname, '..', 'frontend');

// Main server API router handler
export async function router(req: IncomingMessage, res: ServerResponse) {
    const method = req.method;
    const url = new URL(req.url!, `http://${req.headers.host}`)
    const [reqPath, reqId ] = url.pathname.split("/").filter(Boolean);
    let data = '';

    try {
        // static files implementation
        if(reqPath === undefined || reqPath === 'index.html' || reqPath === 'style.css' || reqPath === 'main.js') {
            const filePath = path.join(FRONTEND_DIR, url.pathname === '/' ? '/index.html' : url.pathname);
            if (!filePath.startsWith(FRONTEND_DIR)) {
                return;
            }
            try {
                const stats = await fs.stat(filePath);
                if (stats.isFile()) {
                    const fileStream = await fs.readFile(filePath);
                    //res.writeHead(200, { 'Content-Type': getMimeType(filePath) }).end(fileStream);
                    res.writeHead(200).end(fileStream);
                    return true;
                }
            } catch (e) {
                //res.writeHead(404, { 'Content-Type': getMimeType(filePath) }).end("File Not Found");
                res.writeHead(404).end("File Not Found");
                return;
            }
            return;
        }

        // /users /cars Api implementation
        if(reqPath === 'users' || reqPath === 'cars') {
            if(method === 'GET') {
                data = JSON.stringify(await db.Read(reqPath, reqId));
                res.writeHead(200).end(data);
                return;
            }
            if(method === 'POST') {
                req.on('data', (chunk) => {
                 data += chunk;
                })
                req.on('end', async () => {
                    await db.Create(reqPath, JSON.parse(data.toString()));
                    res.writeHead(201).end(data);
                })
                return;
            }
            if(method === 'DELETE') {
                data = JSON.stringify(await db.Delete(reqPath, reqId));
                res.writeHead(202).end(data);
                return;
            }
            if(method === 'PUT') {
                req.on('data', (chunk) => {
                    data += chunk;
                })
                req.on('end', async () => {
                    await db.Update(reqPath, reqId, JSON.parse(data.toString()));
                    res.writeHead(204).end(data);
                })
                return;
            }
        }

        //  /login Api implementation
        if(reqPath === 'login' && method === 'POST') {
            req.on('data', (chunk) => {
                data += chunk;
            })
            req.on('end', async () => {
                try{
                    const {username, password} = JSON.parse(data.toString());
                    if(!username || !password) {
                        res.writeHead(400).end(JSON.stringify('Login Failed'));
                        return;
                    }
                    const users : User[] = await db.Read('users') as User[];
                    const user = users.find((u) => u.username === username && u.password === password);
                    if(user) {
                        res.writeHead(200).end(JSON.stringify('Login Ok'))
                    } else {
                        res.writeHead(400).end(JSON.stringify('Login Failed'))
                    }
                } catch (e) {
                    res.writeHead(400).end(JSON.stringify('Login Failed'))
                }
            })
            return;
        }

        //  /register Api implementation
        if(reqPath === 'register' && method === 'POST') {
            req.on('data', (chunk) => {
                data += chunk;
            })
            req.on('end', async () => {
                try {
                    const {username, password} = JSON.parse(data.toString());
                    if (!username || !password) {
                        res.writeHead(400).end(JSON.stringify('Incorrect username or password'));
                        return;
                    }
                    const users: User[] = await db.Read('users') as User[];
                    if (users.find((u) => u.username === username)) {
                        res.writeHead(400).end(JSON.stringify('Username exists'));
                        return;
                    }
                    const newUser : Omit<User, 'id'> = { username: username, password: password, role: 'user', balance: 0};
                    await db.Create('users', newUser);
                    res.writeHead(201).end(JSON.stringify('User created successfully'));
                } catch (e) {
                    res.writeHead(400).end(JSON.stringify('Register Failed'))
                }
            })
            return;
        }

        // TODO /sse Api implementation
        if(reqPath === 'sse') {
            const clients: ServerResponse[] = [];

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