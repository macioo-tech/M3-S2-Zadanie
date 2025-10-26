import {IncomingMessage, ServerResponse} from "node:http";
import { createServer } from 'http';
import {routesHandler} from "./routes.js";

const PORT = process.env.PORT || 3000

const logger = (req : IncomingMessage, res : ServerResponse, next : Function) : void => {
    console.log(`${req.method} ${req.url}`)
    next();
}

const jsonMiddleware = (req : IncomingMessage, res : ServerResponse, next : Function) : void => {
    res.setHeader('Content-Type', 'application/json')
    next();
}

const server = createServer(async (req, res) => {
  jsonMiddleware(req, res,() => {
      logger(req, res, () => {
          routesHandler(req, res);
      })
  })
});

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
