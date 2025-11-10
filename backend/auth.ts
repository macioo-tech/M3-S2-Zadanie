import { IncomingMessage, ServerResponse } from "node:http";
import jwt from "jsonwebtoken"
import { TokenPayload, User } from "./types.js";
import * as db from "./db.js";

const SECRET_KEY = process.env.SECRET_KEY;

function decodeToken( token: string ): TokenPayload | null {
  const SecretKey: string = SECRET_KEY as string;
  try {
    return jwt.verify( token, SecretKey ) as TokenPayload;
  } catch ( error ) {
    return null;
  }
}

function parseCookies( req: IncomingMessage ): Record<string, string> {
  const cookieHeader = req.headers.cookie;
  if ( !cookieHeader ) {
    return {};
  }
  return cookieHeader.split( ";" ).reduce( ( acc, cookie ) => {
    const [ key, value ] = cookie.split( "=" );
    acc[ key.trim() ] = value;
    return acc;
  }, {} as Record<string, string> );
}

export function generateToken( username: string ): string {
  const SecretKey: string = SECRET_KEY as string;
  const payload: TokenPayload = { username };
  return jwt.sign( payload, SecretKey, { expiresIn: "48h" } );
}

export function setAuthCookie( res: ServerResponse, token: string, maxAge?: number ): void {
  res.setHeader(
    "Set-Cookie",
    `token=${ token }; HttpOnly; Secure; Path=/; ${ maxAge ? `Max-Age=${ maxAge }` : "" }`
  );
}

export async function authUser( req: IncomingMessage, res: ServerResponse ): Promise<User | null> {
  const cookies = parseCookies( req );
  const token = cookies[ "token" ];
  if ( !token ) {
    return null;
  }
  const tokenPayload = decodeToken( token );
  if ( !tokenPayload ) {
    return null;
  }
  const user = await db.findByUsername( res, tokenPayload.username );
  if ( !user ) {
    return null;
  }
  return user;
}
