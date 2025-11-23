import { Pool, PoolClient, QueryResult } from 'pg';
import { TypeMap, User } from '../types.js';

export const pool = new Pool( {
  user: process.env.POSTGRES_USER,
  host: process.env.POSTGRES_HOST,
  database: process.env.POSTGRES_DB,
  password: process.env.POSTGRES_PASSWORD,
  port: parseInt( process.env.POSTGRES_PORT as string, 10 )
} );

export async function findAll<T extends keyof TypeMap>( type: T ): Promise<TypeMap[T][]> {
  const query = `SELECT *
                     FROM ${ type }`;
  const result: QueryResult<TypeMap[T]> = await pool.query( query );
  return result.rows;
}

export async function findById<T extends keyof TypeMap>( type: T,
                                                         id: number ): Promise<TypeMap[T]> {
  const query = `SELECT *
                     FROM ${ type }
                     WHERE id = $1`;
  const result: QueryResult<TypeMap[T]> = await pool.query( query, [ id ] );
  return result.rows[ 0 ];
}

export async function findUserPass( username: string,
                                    password: string ): Promise<User> {
  const query = `SELECT *
                     FROM users
                     WHERE username = $1
                       AND password = $2`;
  const result: QueryResult<User> = await pool.query( query, [ username, password ] );
  return result.rows[ 0 ];
}

export async function insertUser( username: string,
                                  password: string ): Promise<User> {
  const query = `INSERT INTO users (username, password)
                     VALUES ($1, $2)
                     RETURNING id, username, password, role, balance`;
  const values = [ username, password ];
  const result: QueryResult<User> = await pool.query( query, values );
  return result.rows[ 0 ];
}

export async function updateUserBalance( id: number,
                                         balance: number ): Promise<void> {
  const query = `UPDATE users
                 SET balance = balance + $1
                     WHERE id = $2
                     RETURNING id, username, password, role, balance`;
  const values = [ balance, id ];
  await pool.query( query, values );
}

export async function deleteById<T extends keyof TypeMap>( type: T,
                                                           id: number ): Promise<void> {
  const query = `DELETE
                     FROM ${ type }
                     WHERE id = $1`;
  await pool.query( query, [ id ] );
}

export async function insertCar( model: string,
                                 price: number ): Promise<void> {
  const query = `INSERT INTO cars (model, price)
                     VALUES ($1, $2)
                     RETURNING id, model, price, owner_id`;
  const values = [ model, price ];
  await pool.query( query, values );
}

export async function updateCar( id: number,
                                 ownerId: number ): Promise<void> {
  const query = `UPDATE cars
                 SET owner_id = $1
                     WHERE id = $2
                     RETURNING id, model, price, owner_id`;
  const values = [ ownerId, id ];
  await pool.query( query, values );
}

export async function updateUser( id: number,
                                  username: string,
                                  password: string ): Promise<void> {
  const query = `UPDATE users
                 SET username = $1,
                     password = $2
                     WHERE id = $3
                     RETURNING id, username, password, role, balance`;
  const values = [ username, password, id ];
  await pool.query( query, values );
}

export async function connectDB(): Promise<void> {
  try {
    const client = await pool.connect();
    await initTables( client );
    console.log( '✅ Successfully connected to postgresql database' );
  } catch ( error ) {
    console.error( '❌ Error connecting to the database:', error );
    console.log( '💡 Make sure postgresql is running (docker-compose up)' );
  }
}

// ONLY for assessment purpose
async function initTables( client: PoolClient ): Promise<void> {
  try {
    await client.query( `BEGIN` );
    await client.query( `CREATE TABLE IF NOT EXISTS users
                         (
                             id       SERIAL PRIMARY KEY,
                             username VARCHAR(255) NOT NULL,
                             password VARCHAR(255) NOT NULL,
                             role     VARCHAR(255) NOT NULL DEFAULT 'user',
                             balance  INT          NOT NULL DEFAULT 0
                         )` );
    await client.query( `CREATE TABLE IF NOT EXISTS cars
                         (
                             id       SERIAL PRIMARY KEY,
                             model    VARCHAR(255) NOT NULL,
                             price    INT default 0,
                             owner_id int references users (id)
                         )` );
    await client.query( `INSERT INTO users (username, password)
                             VALUES ('admin', 'admin123')
                         ON CONFLICT (username) DO NOTHING
                             RETURNING id, username, password, role, balance` );
    await client.query( `COMMIT` );
  } catch ( error ) {
    await client.query( 'ROLLBACK' );
    throw error;
  } finally {
    client.release();
  }
}