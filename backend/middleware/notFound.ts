import { IncomingMessage, ServerResponse } from "node:http";

function notFound( req: IncomingMessage, res: ServerResponse, next: Function ): void {
  const error: Error = new Error( `Not Found - ${ req.url }` )
  error. = '404';
  next( error )
}

export default notFound