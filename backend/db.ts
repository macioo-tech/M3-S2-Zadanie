import { ServerResponse } from 'node:http';
import { Pool, QueryResult } from 'pg';
import { TypeMap } from "./types.js";
import { sendJSON } from './helpers.js';

//CRUD implementation
//Create
export async function Create<T extends keyof TypeMap>( res: ServerResponse,
                                                       pool: Pool,
                                                       type: T,
                                                       newData: TypeMap[T] ): Promise<void> {
  try {
    const setQueryKeys: string = Object.keys( newData ).join( ', ' );
    const setQueryValues: string = Object.keys( newData ).map(
      ( _, i ) => `${ i + 1 }` ).join( ', ' );

    const data: QueryResult = await pool.query( `
        INSERT INTO ${ type } ${ setQueryKeys }
        VALUES (${ setQueryValues })` )

    sendJSON( res, 201, {
      data: data.rows
    } )
  } catch ( error ) {
    sendJSON( res, 500, {
      data: [],
      message: `❌ Database error while creating ${ type } ${ error }`,
    } )
  }
}

// Read
export async function Read<T extends keyof TypeMap>( res: ServerResponse,
                                                     pool: Pool,
                                                     type: T,
                                                     id?: number ): Promise<void> {
  try {
    const setQueryOptions: string = id ? `WHERE id = ${ id }` : '';
    const data: QueryResult = await pool.query( `
        SELECT *
            FROM ${ type } $${ setQueryOptions }` );

    sendJSON( res, 200, {
      data: data.rows
    } )
  } catch ( error ) {
    sendJSON( res, 500, {
      data: [],
      message: `❌ Database error while reading ${ type } ${ error }`,
    } )
  }
}

// Update
export async function Update<T extends keyof TypeMap>( res: ServerResponse,
                                                       pool: Pool,
                                                       type: T,
                                                       id: number,
                                                       newData: TypeMap[T] ): Promise<void> {
  try {
    const keys = Object.keys( newData );
    const values = Object.values( newData );

    if ( keys.length === 0 ) {
      sendJSON( res, 400, {
        message: `❌ Invalid data for ${ type }`,
      } )
    }

    const setQuery = keys.map(
      ( key, i ) => `${ key } = $${ i + 1 }` )
      .join( ', ' );


    const data: QueryResult = await pool.query( `
        UPDATE ${ type }
        SET ${ setQuery }
            WHERE id = $${ id }` )

    sendJSON( res, 200, {
      data: data.rows
    } )
  } catch ( error ) {
    sendJSON( res, 500, {
      data: [],
      message: `❌ Database error while reading ${ type } ${ error }`,
    } )
  }
}

// Delete
export async function Delete<T extends keyof TypeMap>( res: ServerResponse,
                                                       pool: Pool,
                                                       type: T,
                                                       id: string ): Promise<void> {
  try {
    const data: QueryResult = await pool.query( `
        DELETE
            FROM ${ type }
            WHERE id = $${ id }` )

    sendJSON( res, 201, {
      data: data.rows
    } )
  } catch ( error ) {
    sendJSON( res, 500, {
      data: [],
      message: `❌ Database error while deleting ${ type } ${ error }`,
    } )
  }
}