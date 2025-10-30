import fs from "node:fs/promises"
import path from "node:path";
import {fileURLToPath} from "node:url";
import {ApiError, Car, User} from "./types.js";
import crypto from "node:crypto";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_DIR = path.join(__dirname, '..', 'db');

// Generate unique id in the data base file
function genID<T>(type : 'users' | 'cars', users: T[]): string {
    const id: string = `${type}${crypto.randomBytes(2).toString('hex')}`
    console.log(id)
    if(users.find(u => (u as any).id === id)) {
        return genID(type, users);
    }
    return id;
}

//CRUD implementation
//Create
export async function Create<T> (type : 'users' | 'cars', newItem: T) : Promise<T[]  | ApiError> {
    const fileDB : string = path.join(DB_DIR, `${type}.json`);
    let data: T[] = [];
    //console.log(fileDB);
    try {
        data =  JSON.parse(await fs.readFile(fileDB, "utf8"));
        newItem = { id :  genID(type,data), ...newItem} ;
        console.log(newItem);
        data.push(newItem);
        await fs.writeFile(fileDB, JSON.stringify(data, null, 2), "utf8");
        return data;
    } catch(e) {
        return { code: 500, error: `${type} database error` };
    }
}

// Read TODO - better types control
export async function Read<T> (type : 'users' | 'cars', id? : string) : Promise<T[] | ApiError> {
    const fileDB : string = path.join(DB_DIR, `${type}.json`);
    let data: T[] = [];
    try {
        data =  JSON.parse(await fs.readFile(fileDB, "utf8"))
        if (!id) {
            return data;
        } else {
            const item = data.find(i => (i as any).id === id);
            if (item) {
                return [item];
            } else {
                return { code: 404, error: `${id} not found in database` };
            }
        }
    } catch (e) {
        return { code: 500, error: `${type} database error` };
    }
}

// Update
export async function Update<T>(type : 'users' | 'cars', id: string, updatedItem : T) : Promise<T[] | ApiError> {
    const fileDB : string = path.join(DB_DIR, `${type}.json`);
    let data: T[] = [];
    try {
        data =  JSON.parse(await fs.readFile(fileDB, "utf8"));
        const index = data.findIndex(i => (i as any).id === id);
        if (index === -1) {
            return { code: 404, error: `${id} not found in database` };
        }

        const currentItem : T = data[index];
        const updatedItem1 : T = { ...currentItem, ...updatedItem };
        (updatedItem1 as any).id = id;
        data[index] = updatedItem1;

        await fs.writeFile(fileDB, JSON.stringify(data, null, 2), "utf8");
        return data;
    } catch(e) {
        return { code: 500, error: `${type} database error` };
    }
}

// Delete
export async function Delete<T>(type : 'users' | 'cars', id: string) : Promise<T[] | ApiError> {
    const fileDB : string = path.join(DB_DIR, `${type}.json`);
    let data: T[] = [];
    try {
        data =  JSON.parse(await fs.readFile(fileDB, "utf8"));
        data = data.filter(i => (i as any).id !== id);
        await fs.writeFile(fileDB, JSON.stringify(data, null, 2), "utf8");
        return data;
    } catch(e) {
        return { code: 500, error: `${type} database error` };
    }
}