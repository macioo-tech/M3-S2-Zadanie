import express from 'express'
import path from 'node:path';
import usersRouter from './routes/users.js';
import carsRouter from './routes/cars.js';
import sseRouter from './routes/sse.js';
import notFound from './middleware/notFound.js';
import errorHandler from './middleware/errorHandler.js';
import logger from './middleware/logger.js';
import { connectDB } from './db/db.js';
import { fileURLToPath } from 'node:url';


const app = express();
const PORT = process.env.PORT;

const __filename = fileURLToPath( import.meta.url );
const __dirname = path.dirname( __filename );

app.use( express.static( path.join( __dirname, '..', 'frontend' ) ) )
app.use( express.json() )
app.use( express.urlencoded( { extended: false } ) )

app.use( logger )
app.use( '/users', usersRouter );
app.use( '/cars', carsRouter )
app.use( '/sse', sseRouter )
app.use( notFound )
app.use( errorHandler )

app.listen( PORT, async (): Promise<void> => {
  console.log( `🚀 Server running on http://localhost:${ PORT }` );
  await connectDB();
} );
