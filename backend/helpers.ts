import path from 'node:path';
import { IncomingMessage, ServerResponse } from 'node:http';
import { authUser } from './auth.js';
import { JSONResponse, TypeMap } from './types.js';

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

export async function parseBody( req: IncomingMessage ): Promise<string> {
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

export async function checkAuth( req: IncomingMessage,
                                 res: ServerResponse ): Promise<boolean> {
  const auth = await authUser( req, res )
  if ( !auth ) {
    sendJSON( res, 400, {
      message: '❌ User Not Authenticated',
    } )
    return false;
  }
  return true;
}

export async function checkAdmin( req: IncomingMessage,
                                  res: ServerResponse ): Promise<boolean> {
  const auth = await authUser( req, res )
  if ( !auth || auth.role !== 'admin' ) {
    sendJSON( res, 400, {
      message: '❌ Forbidden',
    } )
    return false;
  }
  return true;
}

export function sendJSON<T extends keyof TypeMap>( res: ServerResponse,
                                                   statusCode: number,
                                                   data: JSONResponse<T> ): void {
  res.writeHead( statusCode, { 'Content-Type': 'application/json' } );
  res.end( JSON.stringify( data ) );
}

export function sendFileStream( res: ServerResponse,
                                reqPath: string,
                                statusCode: number,
                                fileStream: NonSharedBuffer | string ): void {
  res.writeHead( statusCode, { 'Content-Type': getMimeType( reqPath ) } );
  res.end( fileStream );
}

export function sseEvent( event: string,
                          data: object ): void {
  let clients: ServerResponse[] = [];
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

