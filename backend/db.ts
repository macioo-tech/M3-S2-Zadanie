import { Pool, QueryResult } from 'pg';
import { TypeMap, User } from './types.js';
import { ServerResponse } from 'node:http';
import { sendJSON } from './helpers.js';


export const pool = new Pool( {
  user: process.env.POSTGRES_USER,
  host: process.env.POSTGRES_HOST,
  database: process.env.POSTGRES_DB,
  password: process.env.POSTGRES_PASSWORD,
  port: parseInt( process.env.POSTGRES_PORT as string, 10 )
} );

export async function findAll<T extends keyof TypeMap>( res: ServerResponse,
                                                        type: T ): Promise<TypeMap[T][] | undefined> {
  try {
    const query = `SELECT *
                       FROM ${ type }`;
    const result: QueryResult<TypeMap[T]> = await pool.query( query );
    return result.rows;
  } catch ( error ) {
    sendJSON( res, 500, { message: `❌ Database error while finding at ${ type }` } )
  }
}

export async function findById<T extends keyof TypeMap>( res: ServerResponse,
                                                         type: T,
                                                         id: number ): Promise<TypeMap[T] | undefined> {
  try {
    const query = `SELECT *
                       FROM ${ type }
                       WHERE id = $1`;
    const result: QueryResult<TypeMap[T]> = await pool.query( query, [ id ] );
    return result.rows[ 0 ];
  } catch ( error ) {
    sendJSON( res, 500, { message: `❌ Database error while finding id at ${ type }` } )
  }
}

export async function loginUser( res: ServerResponse,
                                 username: string,
                                 password: string ): Promise<User | undefined> {
  try {
    const query = `SELECT *
                       FROM users
                       WHERE username = $1
                         AND password = $2`;
    const result: QueryResult<User> = await pool.query( query, [ username, password ] );
    return result.rows[ 0 ];
  } catch ( error ) {
    sendJSON( res, 500, { message: `❌ Database error while finding username` } )
  }
}

export async function registerUser( res: ServerResponse,
                                    username: string,
                                    password: string ): Promise<User | undefined> {
  try {
    const query = `INSERT INTO users (username, password)
                       VALUES ($1, $2)
                       RETURNING id, username, password, role, balance`;
    const values = [ username, password ];
    const result: QueryResult<User> = await pool.query( query, values );
    return result.rows[ 0 ];
  } catch ( error ) {
    sendJSON( res, 500, { message: `❌ Database error while creating at users` } )
  }
}

export async function updateUserBalance( res: ServerResponse,
                                         id: number,
                                         balance: number ): Promise<void> {
  try {
    const query = `UPDATE users
                   SET balance = balance + $1
                       WHERE id = $2
                       RETURNING id, username, password, role, balance`;
    const values = [ balance, id ];
    await pool.query( query, values );
  } catch ( error ) {
    sendJSON( res, 500, { message: `❌ Database error while updating at users` } )
  }
}

export async function deleteById<T extends keyof TypeMap>( res: ServerResponse,
                                                           type: T,
                                                           id: number ): Promise<void> {
  try {
    const query = `DELETE
                       FROM ${ type }
                       WHERE id = $1`;
    await pool.query( query, [ id ] );
  } catch ( error ) {
    sendJSON( res, 500, { message: `❌ Database error while deleting at ${ type }` } )
  }
}

export async function registerCar( res: ServerResponse,
                                   model: string,
                                   price: number ): Promise<void> {
  try {
    const query = `INSERT INTO cars (model, price)
                       VALUES ($1, $2)
                       RETURNING id, model, price, owner_id`;
    const values = [ model, price ];
    await pool.query( query, values );
  } catch ( error ) {
    sendJSON( res, 500, { message: `❌ Database error while creating at cars` } )
  }
}

export async function updateCar( res: ServerResponse,
                                 id: number,
                                 ownerId: number ): Promise<void> {
  try {
    const query = `UPDATE cars
                   SET owner_id = $1
                       WHERE id = $2
                       RETURNING id, model, price, owner_id`;
    const values = [ ownerId, id ];
    await pool.query( query, values );
  } catch ( error ) {
    sendJSON( res, 500, { message: `❌ Database error while updating at cars` } )
  }
}

export async function updateUser( res: ServerResponse,
                                  id: number,
                                  username: string,
                                  password: string ): Promise<void> {
  try {
    const query = `UPDATE users
                   SET username = $1,
                       password = $2
                       WHERE id = $3
                       RETURNING id, username, password, role, balance`;
    const values = [ username, password, id ];
    await pool.query( query, values );
  } catch ( error ) {
    sendJSON( res, 500, { message: `❌ Database error while updating at users` } )
  }
}

export async function connectDB(): Promise<void> {
  try {
    await pool.connect();
    console.log( '✅ Successfully connected to postgresql database' );
  } catch ( error ) {
    console.error( '❌ Error connecting to the database:', error );
    console.log( '💡 Make sure postgresql is running (docker-compose up)' );
  }
}
