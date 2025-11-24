import path from 'node:path';
import { Request, Response } from 'express';
import { authUser } from './auth.js';
import { apiError, JSONResponse, TypeMap } from './types.js';

export const clients: Response[] = [];

function getMimeType( reqPath: string ): string {
  switch ( path.extname( reqPath === undefined ? '/index.html' : reqPath ).toLowerCase() ) {
    case '.html':
      return 'text/html';
    case '.css':
      return 'text/css';
    case '.js':
      return 'application/javascript';
    default:
      return 'text/html';
  }
}

export async function parseBody( req: Request ): Promise<string> {
  return new Promise( ( resolve ) => {
    let data = '';
    req.on( 'data', ( chunk ) => {
      data += chunk;
    } );
    req.on( 'end', () => {
      resolve( data );
    } );
  } );
}

export async function checkAuth( req: Request,
                                 res: Response ): Promise<boolean> {
  const auth = await authUser( req, res )
  if ( !auth ) {
    const error: apiError = new Error( 'Authentication Failed' );
    error.status = 400;
    return false;
  }
  return true;
}

export async function checkAdmin( req: Request,
                                  res: Response ): Promise<boolean> {
  const auth = await authUser( req, res )
  if ( !auth || auth.role !== 'admin' ) {
    const error: apiError = new Error( 'Forbidden' );
    error.status = 400;
    return false;
  }
  return true;
}

export function sendJSON<T extends keyof TypeMap>( res: Response,
                                                   statusCode: number,
                                                   data: JSONResponse<T> ): void {
  res.writeHead( statusCode, { 'Content-Type': 'application/json' } );
  res.end( JSON.stringify( data ) );
}

export function sendFileStream( res: Response,
                                reqPath: string,
                                statusCode: number,
                                fileStream: NonSharedBuffer | string ): void {
  res.writeHead( statusCode, { 'Content-Type': getMimeType( reqPath ) } );
  res.end( fileStream );
}

export function sseEvent( event: string,
                          data: object ): void {
  const message = `data: ${ JSON.stringify( { event, ...data } ) }\n\n`;
  clients.forEach( ( client, index ) => {
    try {
      if ( !client.writableEnded && !client.destroyed ) {
        client.write( message );
      } else {
        // Remove disconnected client
        clients.splice( index, 1 );
      }
    } catch ( error ) {
      console.error( 'Error sending SSE:', error );
      clients.splice( index, 1 );
    }
  } );
}

