import {IncomingMessage, ServerResponse} from "node:http";
import jwt from "jsonwebtoken"
import {TokenPayload, User} from "./types.js";
import * as db from "./db.js";

function decodeToken(token: string): TokenPayload | null {
    const SecretKey: string = process.env.SECRET_KEY as string;
    try {
        return jwt.verify(token, SecretKey) as TokenPayload;
    } catch (error) {
        return null;
    }
}

function parseCookies(req: IncomingMessage): Record<string, string> {
    const cookieHeader = req.headers.cookie;
    if (!cookieHeader) {
        return {};
    }
    return cookieHeader.split(";").reduce((acc, cookie) => {
        const [key, value] = cookie.split("=");
        acc[key.trim()] = value;
        return acc;
    }, {} as Record<string, string>);
}

export function generateToken(userId: string): string {
    const SecretKey: string = process.env.SECRET_KEY as string;
    console.log(process.env.SECRET_KEY)
    const payload: TokenPayload = { userId };
    return jwt.sign(payload, SecretKey, { expiresIn: "1h" });
}

export function setAuthCookie(res: ServerResponse, token: string, maxAge?: number): void {
    res.setHeader(
        "set-cookie",
        `token=${token}; ${maxAge ? `max-age=${maxAge}` : ""};`
    );
}

export async function authUser (req : IncomingMessage ): Promise<User | null> {
    const cookies = parseCookies(req);
    const token = cookies["authToken"];
    if (!token) {
        return null;
    }
    const id = decodeToken(token);
    if (!id) {
        return null;
    }
    return await db.Read('users', id.userId);
}
