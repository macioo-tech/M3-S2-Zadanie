import { Request, Response } from 'express';
import { apiError } from '../types.js';

function notFound( req: Request, res: Response, next: Function ): void {
  const error: apiError = new Error( `Not Found -${ req.originalUrl } ` );
  error.status = 404;
  next( error );
}

export default notFound