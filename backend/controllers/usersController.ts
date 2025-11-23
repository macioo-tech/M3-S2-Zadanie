import { TypeMap, User } from '../types.js';
import { Request, Response } from 'express';
import { QueryResult } from 'pg';
import { checkAdmin, checkAuth, parseBody, sendJSON } from '../helpers.js';
import { pool } from '../db.js';
import { authUser, generateToken, setAuthCookie } from '../auth.js';

export async function getUsers( req: Request,
                                res: Response,
                                next: Function ): Promise<void> {
  try {
    if ( !await checkAuth( req, res ) ) return
    const query = `SELECT *
                       FROM users`;
    const result: QueryResult<User> = await pool.query( query );
    sendJSON( res, 200, { data: result.rows } )
  } catch ( error ) {
    sendJSON( res, 500, { message: `❌ Database error while finding at getUsers` } )
    next( error );
  }
}

export async function getUserById( req: Request,
                                   res: Response,
                                   next: Function ): Promise<void> {
  try {
    if ( !await checkAuth( req, res ) ) return
    const id = parseInt( req.params.id as string, 10 )
    const query = `SELECT *
                       FROM users
                       WHERE id = $1`;
    const result: QueryResult<User> = await pool.query( query, [ id ] );
    sendJSON( res, 200, { data: result.rows[ 0 ] } )
  } catch ( error ) {
    sendJSON( res, 500, { message: `❌ Database error while finding id at getUsersById` } )
  }
}

export async function loginUser( req: Request,
                                 res: Response ): Promise<void> {
  try {
    const body = await parseBody( req );
    const { username, password } = JSON.parse( body.toString() );
    if ( !username || !password ) {
      sendJSON( res, 400, { message: '❌ Invalid Username Or Password' } );
      return;
    }
    const query = `SELECT *
                       FROM users
                       WHERE username = $1
                         AND password = $2`;
    const result: QueryResult<User> = await pool.query( query, [ username, password ] );
    const user: User = result.rows[ 0 ];
    if ( user ) {
      const token: string = generateToken( user.id );
      setAuthCookie( res, token, 60 * 60 * 24 * 2 );
      sendJSON( res, 200, {
        message: `✅ Welcome ${ user.username }`
      } )
    } else {
      sendJSON( res, 401, { message: '❌ Authentication Failed' } );
    }
  } catch ( error ) {
    sendJSON( res, 500, { message: `❌ Database error at loginUser` } )
  }
}

export function logoutUser( res: Response ): void {
  res.setHeader(
    'Set-Cookie',
    'token=; HttpOnly; Secure; Path=/; Max-Age=0'
  );
  sendJSON( res, 200, { message: `✅ See you later` } )
}

export async function me( req: Request,
                          res: Response ): Promise<void> {
  try {
    const user = await authUser( req, res );
    if ( !user ) {
      sendJSON( res, 400, { message: '❌ User not authenticated' } );
      return;
    }
    sendJSON( res, 200, { data: user, message: `✅ Welcome back ${ user.username }` } )
  } catch ( error ) {
    sendJSON( res, 500, { message: `❌ Database error at me` } )
  }
}

export async function registerUser( req: Request,
                                    res: Response ): Promise<void> {
  try {
    const body = await parseBody( req );
    const { username, password } = JSON.parse( body.toString() );
    if ( !username || !password ) {
      sendJSON( res, 400, { message: '❌ Invalid Username Or Password' } );
      return;
    }
    const query = `INSERT INTO users (username, password)
                       VALUES ($1, $2)
                       RETURNING id, username, password, role, balance`;
    const values: string[] = [ username, password ];
    const result: QueryResult<User> = await pool.query( query, values );
    const user: User = result.rows[ 0 ];
    sendJSON( res, 201, {
      message: `✅ Welcome on board ${ user.username }`
    } )
    return;
  } catch ( error ) {
    sendJSON( res, 500, { message: `❌ Database error while creating at registerUser` } )
  }
}

export async function hackUser( req: Request,
                                res: Response ): Promise<void> {
  try {
    const id = parseInt( req.params.id as string, 10 )
    const cash = parseInt( req.params.cash as string, 10 )
    if ( isNaN( cash ) ) {
      sendJSON( res, 400, { message: `Cash ${ cash } is not a number` } )
      return;
    }
    const query = `UPDATE users
                   SET balance = balance - $1
                       WHERE id = $2`;
    const values: string[] = [ cash.toString(), id.toString() ];
    await pool.query( query, values );
    sendJSON( res, 200, {
      message: `user ${ id } hacked for ${ cash }`
    } )
  } catch ( error ) {
    sendJSON( res, 500, { message: `❌ Database error while updating at hackUser` } )
  }
}

export async function deleteUser( req: Request,
                                  res: Response ): Promise<void> {
  try {
    if ( !await checkAuth( req, res ) ) return
    if ( !await checkAdmin( req, res ) ) return
    const id = parseInt( req.params.id as string, 10 )
    const query = `DELETE
                       FROM users
                       WHERE id = $1`;
    await pool.query( query, [ id ] );
    sendJSON( res, 200, {
      message: `User ${ id } deleted successfully`
    } )
  } catch ( error ) {
    sendJSON( res, 500, { message: `❌ Database error while deleting at deleteUser` } )
  }
}

export async function updateUser( req: Request,
                                  res: Response ): Promise<void> {
  try {
    if ( !await checkAuth( req, res ) ) return
    const body = await parseBody( req );
    const { username, password } = JSON.parse( body.toString() );
    if ( !username || !password ) {
      sendJSON( res, 400, { message: '❌ Invalid Username Or Password' } );
      return;
    }
    const id = parseInt( req.params.id as string, 10 )
    const query = `UPDATE users
                   SET username = $1,
                       password = $2
                       WHERE id = $3
                       RETURNING id, username, password, role, balance`;
    const values: string[] = [ username, password, id.toString() ];
    await pool.query( query, values );
    sendJSON( res, 200, { message: `✅ Changes username and password` } )
  } catch ( error ) {
    sendJSON( res, 500, { message: `❌ Database error while updating at users` } )
  }
}



