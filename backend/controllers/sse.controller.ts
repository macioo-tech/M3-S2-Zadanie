import { Request, Response } from 'express';
import { clients } from '../helpers.js';


export function sseHandler( req: Request, res: Response ) {
  res.writeHead( 200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    "Connection": "keep-alive"
  } );
  clients.push( res );
  req.on( "close", () => {
    const index = clients.indexOf( res );
    if ( index !== -1 ) {
      clients.splice( index, 1 );
    }
  } );
}