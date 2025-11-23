import { IncomingMessage } from "node:http";

function logger( req: IncomingMessage, next: Function ): void {
  console.log( `Server request ${ req.method } ${ req.url }` )
  next();
}

export default logger