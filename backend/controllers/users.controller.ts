import { apiError, User } from '../types.js';
import { Request, Response } from 'express';
import { checkAdmin, checkAuth } from '../helpers.js';
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
    res.status( 200 ).json( { data: users } );
  } catch ( error ) {
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
    res.status( 200 ).json( { data: user } );
  } catch ( error ) {
    next( error );
  }
}

export async function loginUser( req: Request,
                                 res: Response,
                                 next: Function ): Promise<void> {
  try {
    const { username, password } = req.body;
    if ( !username || !password ) {
      const error: apiError = new Error( 'Invalid username or password' );
      error.status = 400;
      return next( error );
    }
    const user: User = await findUserPass( username, password );
    if ( user ) {
      const token: string = generateToken( user.id );
      setAuthCookie( res, token, 60 * 60 * 24 * 2 );
      res.status( 200 ).json( { message: `Welcome user ${ user.username } ` } );
    } else {
      const error: apiError = new Error( 'Authentication Failed' );
      error.status = 401;
      return next( error );
    }
  } catch ( error ) {
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
  res.status( 200 ).json( { message: 'Logged out successfully' } );
  next();
}

export async function me( req: Request,
                          res: Response,
                          next: Function ): Promise<void> {
  try {
    const user = await authUser( req, res );
    if ( !user ) {
      const error: apiError = new Error( 'Authentication Failed' );
      error.status = 401;
      return next( error );
    }
    res.status( 200 ).json( { data: user, message: `Welcome back ${ user.username }` } );
  } catch ( error ) {
    next( error );
  }
}

export async function registerUser( req: Request,
                                    res: Response,
                                    next: Function ): Promise<void> {
  try {
    const { username, password } = req.body;
    if ( !username || !password ) {
      const error: apiError = new Error( 'Invalid username or password' );
      error.status = 400;
      return next( error );
    }
    const user: User = await insertUser( username, password );
    res.status( 201 ).json( { message: `Welcome on board ${ user.username }` } );
    return;
  } catch ( error ) {
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
      const error: apiError = new Error( `Cash ${ cash } is not a number` );
      error.status = 400;
      return next( error );
    }
    await updateUserBalance( id, cash )
    res.status( 200 ).json( { message: `User ${ id } hacked additional cash of ${ cash }` } )
  } catch ( error ) {
    next( error );
  }
}

export async function deleteUser( req: Request,
                                  res: Response,
                                  next: Function ): Promise<void> {
  try {
    if ( !await checkAuth( req, res ) ) return
    if ( !await checkAdmin( req, res ) ) return
    const id = parseInt( req.params.id as string, 10 )
    await deleteById( 'users', id );
    res.status( 200 ).json( { message: `User ${ id } deleted successfully` } )
  } catch ( error ) {
    next( error )
  }
}

export async function putUser( req: Request,
                               res: Response,
                               next: Function ): Promise<void> {
  try {
    if ( !await checkAuth( req, res ) ) return
    const { username, password } = req.body;
    if ( !username || !password ) {
      const error: apiError = new Error( 'Invalid Username Or Password' );
      error.status = 400;
      return next( error );
    }
    const id = parseInt( req.params.id as string, 10 )
    await updateUser( id, username, password );
    res.status( 200 ).json( { message: `Changes username and password` } )
  } catch ( error ) {
    next( error );
  }
}



