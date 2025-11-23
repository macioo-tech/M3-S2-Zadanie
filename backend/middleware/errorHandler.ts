import { IncomingMessage, ServerResponse } from "node:http";
import { sendJSON } from '../helpers.js';

function errorHandler( err: any, req: IncomingMessage, res: ServerResponse, next: Function ) {
  if ( err.status ) {
    sendJSON( res, 400, {
      message: '❌ Forbidden',
    } )
    return res.stat
  }
}

export default errorHandler