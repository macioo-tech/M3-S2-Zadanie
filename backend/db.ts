import fs from "node:fs/promises"
import path from "node:path";
import {fileURLToPath} from "node:url";
import {ApiError, Car, User} from "./types.js";
import crypto from "node:crypto";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_DIR = path.join(__dirname, '..', 'db');

//CRUD implementation
//Create
export async function Create<T> (type : 'users' | 'cars', newItem: T) : Promise<T[]  | ApiError> {
    const fileDB : string = path.join(DB_DIR, `${type}.json`);
    let data: T[] = [];
    //console.log(fileDB);
    try {
        data =  JSON.parse(await fs.readFile(fileDB, "utf8"));
        newItem = { id :  `${type.substring(0, 3)}${crypto.randomBytes(4).toString('hex')}`, ...newItem} ;
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
export async function Update<T>(type : 'users' | 'cars', id: string, item : T) : Promise<T[] | ApiError> {
    const fileDB : string = path.join(DB_DIR, `${type}.json`);
    let data: T[] = [];
    try {
        data =  JSON.parse(await fs.readFile(fileDB, "utf8"));
        const index = data.findIndex(i => (i as any).id === id);
        if (index === -1) {
            return { code: 404, error: `${id} not found in database` };
        }

        const updatedItem : T = { ...data[index], ...item };
        (updatedItem as any).id = id;
        data[index] = updatedItem;

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