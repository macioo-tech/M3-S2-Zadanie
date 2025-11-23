import { Request, Response } from 'express';

function logger( req: Request, res: Response, next: Function ): void {
  console.log( `Server request ${ req.method } ${ req.url }` )
  next();
}

export default logger