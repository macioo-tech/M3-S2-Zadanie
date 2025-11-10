import { IncomingMessage, ServerResponse } from "node:http";
import { fileURLToPath } from "node:url";
import fs from "node:fs/promises"
import path from "node:path";
import * as db from "./db.js";
import { User, Car } from "./types.js";
import { setAuthCookie, generateToken, authUser } from "./auth.js";
import { parseBody, sendJSON, sendFileStream, checkAuth, checkAdmin, sseEvent } from './helpers.js';

const __filename = fileURLToPath( import.meta.url );
const __dirname = path.dirname( __filename );
const FRONTEND_DIR = path.join( __dirname, '..', 'frontend' );
const clients: ServerResponse[] = [];

// Main server API router handler
export async function router( req: IncomingMessage, res: ServerResponse ) {
  const method = req.method;
  const url = new URL( req.url!, `http://${ req.headers.host }` )
  const [ reqPath, reqId, optional ] = url.pathname.split( "/" ).filter( Boolean );

  try {
    // serve static files
    if ( reqPath === undefined ||
      reqPath === 'index.html' ||
      reqPath === 'style.css' ||
      reqPath === 'main.js' ) {
      const filePath = path.join( FRONTEND_DIR, url.pathname === '/' ? '/index.html' : url.pathname );
      if ( !filePath.startsWith( FRONTEND_DIR ) ) {
        return;
      }
      try {
        const stats = await fs.stat( filePath );
        if ( stats.isFile() ) {
          const fileStream = await fs.readFile( filePath );
          sendFileStream( res, reqPath, 200, fileStream )
          return;
        }
      } catch ( error ) {
        sendFileStream( res, reqPath, 404, "File not found" )
        return;
      }
      return;
    }

    // methods GET
    if ( method === 'GET' ) {
      // endpoints /users && /cars
      if ( !await checkAuth( req, res ) ) return
      if ( reqPath === 'users' || reqPath === 'cars' )
        if ( reqId === undefined ) {
          const data = await db.findAll( res, reqPath );
          sendJSON( res, 200, { data: data } )
          return;
        } else {
          const data = await db.findById( res, reqPath, parseInt( reqId ) );
          sendJSON( res, 200, { data: data } )
          return;
        }
    }

    // methods POST
    if ( method === 'POST' ) {
      if ( reqPath === 'cars' ) {
        if ( !await checkAuth( req, res ) ) return
        // endpoint /cars
        if ( !reqId && !optional ) {
          const body = await parseBody( req );
          const { model, price } = JSON.parse( body.toString() );
          await db.registerCar( res, model, price );
          sendJSON( res, 201, { message: `Car ${ model } added` } )
          return;
        }

        // endpoint /cars/{id}/buy
        if ( reqId && optional === 'buy' ) {
          const body = await parseBody( req );
          const { buyerId } = JSON.parse( body.toString() );
          if ( !buyerId ) {
            sendJSON( res, 400, { message: `Missing ownerId in body` } )
            return;
          }
          const car: Car | undefined = await db.findById( res, 'cars', parseInt( reqId ) )
          if ( !car ) {
            sendJSON( res, 400, { message: `Car Not Found` } )
            return;
          }
          if ( car.ownerId ) {
            sendJSON( res, 400, { message: `Car Already Bought` } )
            return;
          }
          const buyer: User | undefined = await db.findById( res, 'users', buyerId )
          if ( !buyer ) {
            sendJSON( res, 400, { message: `User Not Found` } )
            return;
          }
          if ( buyer.balance < car.price ) {
            sendJSON( res, 400, { message: `Insufficient Funds` } )
            return;
          }
          await db.updateCar( res, car.id, buyer.id )
          await db.updateUserBalance( res, buyer.id, buyer.balance - car.price )
          sendJSON( res, 200, { message: `Car ${ car.id } Bought by ${ buyer.id }` } )
          sseEvent( 'car-bought', { id: car.id, buyerId: buyer.id } );
          return;
        }
      }

      // endpoint /login
      if ( reqPath === 'login' ) {
        const body = await parseBody( req );
        const { username, password } = JSON.parse( body.toString() );
        if ( !username || !password ) {
          sendJSON( res, 400, { message: '❌ Invalid Username Or Password' } );
          return;
        }
        const user = await db.loginUser( res, username, password );
        if ( user ) {
          const token: string = generateToken( user.id );
          setAuthCookie( res, token, 60 * 60 * 24 * 2 );
          sendJSON( res, 200, {
            message: `✅ Welcome ${ user.username }`
          } )
        } else {
          sendJSON( res, 401, { message: '❌ Authentication Failed' } );
        }
        return;
      }

      // endpoint /logout
      if ( reqPath === 'logout' ) {
        // Clear the authentication cookie
        res.setHeader(
          'Set-Cookie',
          'token=; HttpOnly; Secure; Path=/; Max-Age=0'
        );
        sendJSON( res, 200, { message: `✅ See you later` } )
        return;
      }

      // endpoint /me -  (session refresh)
      if ( reqPath === 'me' ) {
        const user = await authUser( req, res );
        if ( !user ) {
          sendJSON( res, 400, { message: '❌ User not authenticated' } );
          return;
        }
        sendJSON( res, 200, { data: user, message: `✅ Welcome back ${ user.username }` } )
        return;
      }

      // endpoint /register
      if ( reqPath === 'register' ) {
        const body = await parseBody( req );
        const { username, password } = JSON.parse( body.toString() );
        if ( !username || !password ) {
          sendJSON( res, 400, { message: '❌ Invalid Username Or Password' } );
          return;
        }
        await db.registerUser( res, username, password );
        sendJSON( res, 201, {
          message: `✅ Welcome on board ${ username }`
        } )
        return;
      }

      // /hack/{id}/{cash}
      if ( reqPath === 'hack' && reqId && optional ) {
        const cash = parseInt( optional );
        if ( isNaN( cash ) ) {
          sendJSON( res, 400, { message: `Cash ${ optional } is not a number` } )
          return;
        }
        await db.updateUserBalance( res, parseInt( reqId ), cash )
        sendJSON( res, 200, {
          message: `user ${ reqId } hacked for ${ cash }`
        } )
        return;
      }
    }

    // method DELETE
    if ( method === 'DELETE' ) {
      // endpoints /users/{id} && /cars/{id}
      if ( !await checkAuth( req, res ) ) return
      if ( !await checkAdmin( req, res ) ) return
      if ( reqId ) {
        if ( reqPath === 'users' || reqPath === 'cars' ) {
          const data = await db.deleteById( res, reqPath, parseInt( reqId ) );
          sendJSON( res, 200, {
            message: `data deleted ${ data }`
          } )
          return;
        }
      }
    }

    // endpoint /sse
    if ( reqPath === 'sse' ) {
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
      return
    }

    sendJSON( res, 404, { message: `Method not found` } )
  } catch ( e ) {
    sendJSON( res, 500, { message: `Internal Server Error` } )
  }
}