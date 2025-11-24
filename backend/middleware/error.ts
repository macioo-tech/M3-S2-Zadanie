import { Request, Response } from 'express';
import { apiError } from '../types.js';

function error( err: apiError, req: Request, res: Response, next: Function ) {
  if ( err.status ) {
    return res.status( err.status ).json( { message: err.message } )
  }
  return res.status( 500 ).send( 'Internal Server Error' );
}

export default error