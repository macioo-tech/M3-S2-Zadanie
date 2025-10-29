import {IncomingMessage, ServerResponse} from "node:http";
import fs from "node:fs/promises"
import path from "node:path";
import * as db from "./db.js";
import {fileURLToPath} from "node:url";
import {ApiError, User} from "./types.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const FRONTEND_DIR = path.join(__dirname, '..', 'frontend');


// function getMimeType(filePath: string): string {
//     const ext = path.extname(filePath).toLowerCase();
//     switch (ext) {
//         case '.html': return 'text/html';
//         case '.css': return 'text/css';
//         case '.js': return 'application/javascript';
//         case '.json': return 'application/json';
//         default: return 'text/plain';
//     }
// }

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

        // TODO /login Api implementation
        if(reqPath === 'login' && method === 'POST') {
            req.on('data', (chunk) => {
                data += chunk;
            })
            req.on('end', async () => {
                try{
                    const {username, password} = JSON.parse(data.toString());
                    if(!username || !password) {
                        res.writeHead(400).end({error: "Incorrect username or password"});
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

        // TODO /sse Api implementation
        if(reqPath === 'sse') {
            res.writeHead(200).end('ok')
            return
        }

        res.writeHead(404, `Method ${method} /${reqPath} does not exist`).end();

    } catch (e) {
        res.writeHead(500, `Server Error ${e}`).end();
    }
}