import { Request, Response } from 'express';
import { sendJSON } from '../helpers.js';

function errorHandler( req: Request, res: Response, next: Function ): void {
  sendJSON( res, 500, { message: '❌ Server Error' } )
}

export default errorHandler