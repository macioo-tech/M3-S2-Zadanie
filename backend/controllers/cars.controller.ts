import { Car, User } from '../types.js';
import { Request, Response } from 'express';
import { checkAdmin, checkAuth, parseBody, sendJSON, sseEvent } from '../helpers.js';
import { deleteById, findAll, findById, insertCar } from '../db/db.js';
import * as db from '../db/db.js';

export async function getCars( req: Request,
                               res: Response,
                               next: Function ): Promise<void> {
  try {
    if ( !await checkAuth( req, res ) ) return
    const cars: Car[] = await findAll( 'cars' );
    sendJSON( res, 200, { data: cars } )
  } catch ( error ) {
    sendJSON( res, 500, { message: `❌ Database error while finding id at getCars` } )
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
    sendJSON( res, 200, { data: car } )
  } catch ( error ) {
    sendJSON( res, 500, { message: `❌ Database error while finding id at getCarById` } )
    next( error );
  }
}

export async function registerCar( req: Request,
                                   res: Response,
                                   next: Function ): Promise<void> {
  try {
    if ( !await checkAuth( req, res ) ) return
    const body = await parseBody( req );
    const { model, price } = JSON.parse( body.toString() );
    await insertCar( model, price );
    sendJSON( res, 201, { message: `✅ Car ${ model } added` } )
  } catch ( error ) {
    sendJSON( res, 500, { message: `❌ Database error at registerCar` } )
    next( error );
  }
}

export async function buyCar( req: Request,
                              res: Response,
                              next: Function ): Promise<void> {
  try {
    const body = await parseBody( req );
    const { buyerId } = JSON.parse( body.toString() );
    if ( !buyerId ) {
      sendJSON( res, 400, { message: `❌ Missing ownerId in body` } )
      return;
    }

    const id = parseInt( req.params.id as string, 10 )
    const car: Car = await findById( 'cars', id )
    if ( !car ) {
      sendJSON( res, 400, { message: `❌ Car Not Found` } )
      return;
    }
    if ( car.ownerId ) {
      sendJSON( res, 400, { message: `❌ Car Already Bought` } )
      return;
    }

    const buyer: User = await findById( 'users', buyerId )
    if ( !buyer ) {
      sendJSON( res, 400, { message: `❌ User Not Found` } )
      return;
    }
    if ( buyer.balance < car.price ) {
      sendJSON( res, 400, { message: `❌ Insufficient Funds` } )
      return;
    }

    await db.updateCar( car.id, buyer.id )
    await db.updateUserBalance( buyer.id, buyer.balance - car.price )
    sendJSON( res, 200, { message: `✅ Car ${ car.id } Bought by ${ buyer.id }` } )
    sseEvent( 'car-bought', { id: car.id, buyerId: buyer.id } );
    return;

  } catch ( error ) {
    sendJSON( res, 500, { message: `❌ Database error while updating at buyCar` } )
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
    sendJSON( res, 200, {
      message: `✅ Car ${ id } deleted successfully`
    } )
  } catch ( error ) {
    sendJSON( res, 500, { message: `❌ Database error while deleting at deleteCar` } )
    next( error );
  }
}