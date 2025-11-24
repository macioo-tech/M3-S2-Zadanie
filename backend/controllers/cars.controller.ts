import { apiError, Car, User } from '../types.js';
import { Request, Response } from 'express';
import { checkAdmin, checkAuth, sseEvent } from '../helpers.js';
import { deleteById, findAll, findById, insertCar } from '../db/db.js';
import * as db from '../db/db.js';

export async function getCars( req: Request,
                               res: Response,
                               next: Function ): Promise<void> {
  try {
    if ( !await checkAuth( req, res ) ) return
    const cars: Car[] = await findAll( 'cars' );
    res.status( 200 ).json( { data: cars } );
  } catch ( error ) {
    next( error );
  }
}

export async function getCarById( req: Request,
                                  res: Response,
                                  next: Function ): Promise<void> {
  try {
    if ( !await checkAuth( req, res ) ) return
    const id = parseInt( req.params.id as string, 10 )
    const car: Car = await findById( 'cars', id )
    res.status( 200 ).json( { data: car } );
  } catch ( error ) {
    next( error );
  }
}

export async function registerCar( req: Request,
                                   res: Response,
                                   next: Function ): Promise<void> {
  try {
    if ( !await checkAuth( req, res ) ) return
    const { model, price } = req.body;
    await insertCar( model, price );
    res.status( 201 ).json( { message: ` Car ${ model } added` } )
  } catch ( error ) {
    next( error );
  }
}

export async function buyCar( req: Request,
                              res: Response,
                              next: Function ): Promise<void> {
  try {
    const { buyerId } = req.body;
    if ( !buyerId ) {
      return;
    }

    const id = parseInt( req.params.id as string, 10 )
    const car: Car = await findById( 'cars', id )
    if ( !car ) {
      const error: apiError = new Error( `Car Not Found` );
      error.status = 400;
      return next( error );
    }
    if ( car.ownerId ) {
      const error: apiError = new Error( `Car Already Bought` );
      error.status = 400;
      return next( error );
    }

    const buyer: User = await findById( 'users', buyerId )
    if ( !buyer ) {
      const error: apiError = new Error( `User Not Found` );
      error.status = 400;
      return next( error );
    }
    if ( buyer.balance < car.price ) {
      const error: apiError = new Error( `Insufficient Funds` );
      error.status = 400;
      return next( error );
    }

    await db.updateCar( car.id, buyer.id )
    await db.updateUserBalance( buyer.id, buyer.balance - car.price )
    res.status( 200 ).json( { message: `Car ${ car.id } Bought by ${ buyer.id }` } )
    sseEvent( 'car-bought', { id: car.id, buyerId: buyer.id } );
    return;

  } catch ( error ) {
    next( error );
  }
}

export async function deleteCar( req: Request,
                                 res: Response,
                                 next: Function ): Promise<void> {
  try {
    if ( !await checkAuth( req, res ) ) return
    if ( !await checkAdmin( req, res ) ) return
    const id = parseInt( req.params.id as string, 10 )
    await deleteById( 'cars', id )
    res.status( 200 ).json( { message: `Car ${ id } deleted successfully` } )
  } catch ( error ) {
    next( error );
  }
}