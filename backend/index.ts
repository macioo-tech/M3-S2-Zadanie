import express from 'express'
import { connectDB } from './db.js';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import notFound from './middleware/notFound.js';
import errorHandler from './middleware/errorHandler.js';

const app = express();
const PORT = process.env.PORT;

const __filename = fileURLToPath( import.meta.url );
const __dirname = path.dirname( __filename );

app.use( express.static( path.join( __dirname, '..', 'frontend' ) ) )
app.use( express.json() )
app.use( express.urlencoded( { extended: false } ) )

app.use( '/users', usersRouter );
app.use( notFound )
app.use( errorHandler )

app.listen( PORT, async (): Promise<void> => {
  console.log( `🚀 Server running on http://localhost:${ PORT }` );
  await connectDB();
} );
ś