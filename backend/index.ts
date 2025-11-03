import * as http from 'http'
import {router} from "./routes.js";
import path from "node:path";

const PORT = process.env.PORT || 3000;

const logger = (req : http.IncomingMessage, res : http.ServerResponse, next : Function) : void => {
    console.log(`Server request ${req.method} ${req.url}`)
    next();
}

const server = http.createServer(async (req, res) => {
    logger(req, res, async () => {
        await router(req, res)
    })
});

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
