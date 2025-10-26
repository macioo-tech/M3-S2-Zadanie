// import db from 'db'

// routes

// /login

// get user
// await db.get('user', id)


import {IncomingMessage, ServerResponse} from "node:http";

export function routesHandler (req: IncomingMessage, res: ServerResponse) : void {
    const {method, url} = req;

    if (url === undefined) {
        // TODO Error Handling
        return;
    }

    if (url.startsWith("/users")) {
        const parts = url.split("/");
        const id = parts[2]
        if (method === "GET") {
            // TODO Read Users
            // return readUsers(req, res, id)
            // await db.read('user', id)
            return;
        }
        if (method === "POST") {
            // TODO Create User
            // return createUsers(req,res)
            // await db.create('user')
            return;
        }
        if (method === "PUT") {
            // TODO Update User
            // return updateUser(req,res,id)
            // await db.update('user', id)
            return;
        }
        if (method === "DELETE") {
            // TODO Delete User
            // return deleteUser(req,res,id)
            // await db.delete('user', id)
            return;
        }

        if (url.startsWith("/cars")) {
            const parts = url.split("/");
            const id = parts[2]
            if (method === "GET") {
                // TODO Read Car
                // return readUsers(req, res, id)
                // await db.read('car', id)
                return;
            }
            if (method === "POST") {
                // TODO Create Car
                // return createUsers(req,res)
                // await db.create('car')
                return;
            }
            if (method === "PUT") {
                // TODO Update Car
                // return updateUser(req,res,id)
                // await db.update('car', id)
                return;
            }
            if (method === "DELETE") {
                // TODO Delete Car
                // return deleteUser(req,res,id)
                // await db.delete('car', id)
                return;
            }
        }
    }
}