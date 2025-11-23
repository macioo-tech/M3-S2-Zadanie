import { TypeMap, User } from '../types.js';
import { ServerResponse } from 'node:http';
import { QueryResult } from 'pg';
import { sendJSON } from '../helpers.js';
import { pool } from '../db.js';


export async function getUsers<T extends keyof TypeMap>( res: ServerResponse,
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

export async function getUserById<T extends keyof TypeMap>( res: ServerResponse,
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