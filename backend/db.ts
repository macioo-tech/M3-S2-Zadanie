import {IncomingMessage, ServerResponse} from "node:http";
import fs from "fs/promises"
import path from "path";
import {User, Car} from "./types.js";

const DIR_DB = "./db/"

// TODO Write to DB

export async function write(type : 'users' | 'cars', data : User | Car, id?: string) : Promise<any>  {
    const DB : string = path.join(DIR_DB, `${type}.json`);

    try {
        const data : User[] | Car[] =  JSON.parse(await fs.readFile(DB, "utf8"))
        const item = data.find(i => i.id === id);
        if (item) {
            //TODO update data
            return;

        } else {
            await fs.appendFile(DB, data.toString())
            return
        }
    } catch(e) {
        //TODO error handling
        return { error: `${type} not found` }
    }
}

// // Test
// const newUser : User =     {
//     "id": "admin002",
//     "username": "admin",
//     "password": "admin123",
//     "role": "admin",
//     "balance": 20000
// }
// await write("users", newUser);
// console.log('Read in Users all users',await read('users'))

export async function read(type: 'users', id? : string) : Promise<User[]>;
export async function read(type: 'cars', id? : string) : Promise<Car[]>;
export async function read(type: 'users', id : string) : Promise<User>;
export async function read(type: 'users', id : string) : Promise<Car>;
export async function read(type : 'users' | 'cars', id? : string) : Promise<any>  {
    const DB : string = path.join(DIR_DB, `${type}.json`);
    try {
        const data : User[] | Car[] =  JSON.parse(await fs.readFile(DB, "utf8"))
        if (!id) {
            return data;
        } else {
            const item = data.find(i => i.id === id);
            if (item) {
                return item;
            } else {
                return { error: `${type} not found` }
            }
        }
    } catch (e) {
        //TODO error handling
        return { error: `${type} not found` }
    }
}

//Test read DB
// console.log('Read in Users not existing id',await read('users', "admin002"))
// console.log('Read in Users all users',await read('users'))
// console.log('Read in Users existing id',await read('users', "admin001"))
// console.log('Read in Cars not existing id',await read('cars', "car001"))
// console.log('Read in Cars all cars',await read('cars'))
// console.log('Read in Cars existing id',await read('cars', "audi1"))
