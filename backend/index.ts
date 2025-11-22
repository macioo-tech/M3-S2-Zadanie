import * as http from 'http'
import { router } from "./routes.js";
import { connectDB } from './db.js';

const PORT = process.env.PORT;

const logger = ( req: http.IncomingMessage, res: http.ServerResponse, next: Function ): void => {
  console.log( `Server request ${ req.method } ${ req.url }` )
  next();
}

const server = http.createServer( async ( req, res ) => {
  logger( req, res, async () => {
    await router( req, res )
  } )
} );

server.listen( PORT, async (): Promise<void> => {
  console.log( `🚀 Server running on http://localhost:${ PORT }` );
  await connectDB();
} );
