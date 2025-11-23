import { User } from '../types.js';
import { Request, Response } from 'express';
import { checkAdmin, checkAuth, parseBody, sendJSON } from '../helpers.js';
import {
  deleteById,
  findAll,
  findById,
  findUserPass,
  insertUser,
  updateUser,
  updateUserBalance
} from '../db/db.js';
import { authUser, generateToken, setAuthCookie } from '../auth.js';

export async function getUsers( req: Request,
                                res: Response,
                                next: Function ): Promise<void> {
  try {
    if ( !await checkAuth( req, res ) ) return

    const users: User[] = await findAll( 'users' )
    sendJSON( res, 200, { data: users } )
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
    const user: User = await findById( 'users', id )
    sendJSON( res, 200, { data: user } )
  } catch ( error ) {
    sendJSON( res, 500, { message: `❌ Database error while finding id at getUsersById` } )
    next( error );
  }
}

export async function loginUser( req: Request,
                                 res: Response,
                                 next: Function ): Promise<void> {
  try {
    const body = await parseBody( req );
    const { username, password } = JSON.parse( body.toString() );
    if ( !username || !password ) {
      sendJSON( res, 400, { message: '❌ Invalid Username Or Password' } );
      return;
    }
    const user: User = await findUserPass( username, password );
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
    next( error );
  }
}

export function logoutUser( req: Request,
                            res: Response,
                            next: Function ): void {
  res.setHeader(
    'Set-Cookie',
    'token=; HttpOnly; Secure; Path=/; Max-Age=0'
  );
  sendJSON( res, 200, { message: `✅ See you later` } )
  next();
}

export async function me( req: Request,
                          res: Response,
                          next: Function ): Promise<void> {
  try {
    const user = await authUser( req, res );
    if ( !user ) {
      sendJSON( res, 400, { message: '❌ User not authenticated' } );
      return;
    }
    sendJSON( res, 200, { data: user, message: `✅ Welcome back ${ user.username }` } )
  } catch ( error ) {
    sendJSON( res, 500, { message: `❌ Database error at me` } )
    next( error );
  }
}

export async function registerUser( req: Request,
                                    res: Response,
                                    next: Function ): Promise<void> {
  try {
    const body = await parseBody( req );
    const { username, password } = JSON.parse( body.toString() );
    if ( !username || !password ) {
      sendJSON( res, 400, { message: '❌ Invalid Username Or Password' } );
      return;
    }
    const user: User = await insertUser( username, password );
    sendJSON( res, 201, {
      message: `✅ Welcome on board ${ user.username }`
    } )
    return;
  } catch ( error ) {
    sendJSON( res, 500, { message: `❌ Database error while creating at registerUser` } )
    next( error );
  }
}

export async function hackUser( req: Request,
                                res: Response,
                                next: Function ): Promise<void> {
  try {
    const id = parseInt( req.params.id as string, 10 )
    const cash = parseInt( req.params.cash as string, 10 )
    if ( isNaN( cash ) ) {
      sendJSON( res, 400, { message: `Cash ${ cash } is not a number` } )
      return;
    }
    await updateUserBalance( id, cash )
    sendJSON( res, 200, {
      message: `✅ User ${ id } hacked additional cash of ${ cash }`
    } )
  } catch ( error ) {
    sendJSON( res, 500, { message: `❌ Database error while updating at hackUser` } )
    next( error );
  }
}

export async function deleteUser( req: Request,
                                  res: Response ): Promise<void> {
  try {
    if ( !await checkAuth( req, res ) ) return
    if ( !await checkAdmin( req, res ) ) return
    const id = parseInt( req.params.id as string, 10 )
    await deleteById( 'users', id );
    sendJSON( res, 200, {
      message: `✅ User ${ id } deleted successfully`
    } )
  } catch ( error ) {
    sendJSON( res, 500, { message: `❌ Database error while deleting at deleteUser` } )
  }
}

export async function putUser( req: Request,
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
    await updateUser( id, username, password );
    sendJSON( res, 200, { message: `✅ Changes username and password` } )
  } catch ( error ) {
    sendJSON( res, 500, { message: `❌ Database error while updating at users` } )
  }
}



