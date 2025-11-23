import { Request, Response } from 'express';
import { sendJSON } from '../helpers.js';

function notFound( req: Request, res: Response, next: Function ): void {
  sendJSON( res, 404, { message: '❌ Route Not Found' } );
  throw new Error( '404 Not Found' );
}

export default notFound