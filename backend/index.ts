import * as http from 'http'
import {router} from "./routes.js";

const PORT = process.env.PORT || 5050;

const logger = (req : http.IncomingMessage, res : http.ServerResponse, next : Function) : void => {
    console.log(`Server request ${req.method} ${req.url}`)
    next();
}

const jsonMiddleware = (req : http.IncomingMessage, res : http.ServerResponse, next : Function) : void => {
    res.setHeader('Content-Type', 'application/json')
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
