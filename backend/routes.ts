import {IncomingMessage, ServerResponse} from "node:http";
import * as db from "./db.js";

// GET handler
async function handleGet(req: IncomingMessage, res: ServerResponse) {
    const url = new URL(req.url!, `http://${req.headers.host}`)
    const urlParts : string[] = url.pathname.split("/").filter(Boolean);
    let data = JSON.stringify({error: "Server Error"})
    if (urlParts.length === 1) {
        data = JSON.stringify(await db.read(urlParts[0]));
    } else if (urlParts.length === 2) {
        data = JSON.stringify(await db.read(urlParts[0], urlParts[1]));
    } else {
        res.writeHead(500)
    }
    res.end(data);
    console.log(data);
}

// TODO POST handler
async function handlePost(req: IncomingMessage, res: ServerResponse) {

}
// TODO Delete Handler
async function handleDelete(req: IncomingMessage, res: ServerResponse) {

}
// TODO Update Handler
async function handleUpdate(req: IncomingMessage, res: ServerResponse) {

}

// Main server router handler
export async function router(req: IncomingMessage, res: ServerResponse) {
    const method = req.method;

    if (method === 'GET') {
        await handleGet(req, res);
    } else if (method === 'POST') {
        await handlePost(req, res);
    } else if (method === 'DELETE') {
        await handleDelete(req, res);
    } else if (method === 'UPDATE') {
        await handleUpdate(req, res);
    } else {
        res.writeHead(500, {'Content-Type': 'application/json'});
        res.end(JSON.stringify({error: `Method ${method} does not exist`}));
    }
}