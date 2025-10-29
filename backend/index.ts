import * as http from 'http'
import {router} from "./routes.js";
import path from "node:path";

const PORT = process.env.PORT || 3000;

const logger = (req : http.IncomingMessage, res : http.ServerResponse, next : Function) : void => {
    console.log(`Server request ${req.method} ${req.url}`)
    next();
}

const jsonMiddleware = (req : http.IncomingMessage, res : http.ServerResponse, next : Function) : void => {
    const url = new URL(req.url!, `http://${req.headers.host}`)
    const [reqPath] = url.pathname.split("/").filter(Boolean);
    let appType : string = 'application/json';
    switch (path.extname(reqPath === undefined ? '/index.html' : reqPath).toLowerCase()) {
        case '.html': appType = 'text/html'; break;
        case '.css': appType = 'text/css'; break;
        case '.js': appType = 'application/javascript'; break;
        case '.json': appType = 'application/json'; break;
        default: appType = 'text/event-stream';
    }
    res.setHeader('Content-Type', appType)
    next();
}

const server = http.createServer(async (req, res) => {
  jsonMiddleware(req, res, async () => {
      logger(req, res, async () => {
          await router(req, res)
      })
  })
});

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
