import * as http from 'http'
import {router} from "./routes.js";
import {Pool} from "pg";

const PORT = process.env.PORT;

const pool = new Pool({
  user: process.env.POSTGRES_USER,
  host: process.env.POSTGRES_HOST,
  database: process.env.POSTGRES_DB,
  password: process.env.POSTGRES_PASSWORD,
  port: parseInt(process.env.POSTGRES_PORT as string, 10)
});

async function testConnection(): Promise<void> {
  try {
    const client = await pool.connect();
    console.log('✅ Successfully connected to postgresql database');

    await client.query(`
        CREATE TABLE IF NOT EXISTS users
        (
            id
            SERIAL
            PRIMARY
            KEY,
            username
            VARCHAR
        (
            255
        ) UNIQUE NOT NULL,
            password VARCHAR
        (
            255
        ) NOT NULL,
            role VARCHAR
        (
            255
        ) NOT NULL DEFAULT
        (
            'user'
        ),
            balance INTEGER NOT NULL DEFAULT
        (
            0
        )
            )
    `);

    console.log('✅ Sample table "users" is ready');
    client.release();

  } catch (error) {
    console.error('❌ Error connecting to the database:', error);
    console.log('💡 Make sure postgresql is running (docker-compose up)');
  }
}

const logger = (req: http.IncomingMessage, res: http.ServerResponse, next: Function): void => {
  console.log(`Server request ${req.method} ${req.url}`)
  next();
}

const server = http.createServer(async (req, res) => {
  logger(req, res, async () => {
    await router(req, res, pool)
  })
});

server.listen(PORT, async (): Promise<void> => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  await testConnection();
});
