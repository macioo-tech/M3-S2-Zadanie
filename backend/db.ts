import fs from "node:fs/promises"
import path from "node:path";
import {fileURLToPath} from "node:url";
import {TypeMap} from "./types.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_DIR = path.join(__dirname, '..', 'db');

//CRUD implementation
//Create
export async function Create<T extends keyof TypeMap> (type : T, newItem: TypeMap[T]) : Promise<void> {
    const fileDB : string = path.join(DB_DIR, `${type}.json`);
    let data: TypeMap[T][] = [];
    try {
        data =  JSON.parse(await fs.readFile(fileDB, "utf8"));
        data.push(newItem);
        await fs.writeFile(fileDB, JSON.stringify(data, null, 2), "utf8");
        return ;
    } catch(e) {
        throw new Error(`Create database error ${e}`);
    }
}

// Read
export async function Read<T extends keyof TypeMap> (type : T) : Promise<TypeMap[T][]>;
export async function Read<T extends keyof TypeMap> (type : T, id: string) : Promise<TypeMap[T]>;
export async function Read<T extends keyof TypeMap> (type : T, id? : string) : Promise<TypeMap[T][] | TypeMap[T]> {
    const fileDB : string = path.join(DB_DIR, `${type}.json`);
    let data: TypeMap[T][] = [];
    try {
        data =  JSON.parse(await fs.readFile(fileDB, "utf8"))
        if (!id) {
            return data;
        } else {
            const item = data.find(i => (i as any).id === id);
            if (item) {
                return item;
            } else {
               return [];
            }
        }
    } catch (e) {
        throw new Error(`Read database error ${e}`);
    }
}

// Update
export async function Update<T extends keyof TypeMap>(type : T, id: string, newItem : TypeMap[T]) : Promise<void> {
    const fileDB : string = path.join(DB_DIR, `${type}.json`);
    let data: TypeMap[T][] = [];
    try {
        data =  JSON.parse(await fs.readFile(fileDB, "utf8"));
        const index = data.findIndex(i => (i as any).id === id);
        if (index === -1) {
            return;
        }
        const updatedItem : TypeMap[T] = { ...data[index], ...newItem };
        (updatedItem as any).id = id;
        data[index] = updatedItem;

        await fs.writeFile(fileDB, JSON.stringify(data, null, 2), "utf8");
        return ;
    } catch(e) {
        throw new Error(`Update database error ${e}`);
    }
}

// Delete
export async function Delete<T extends keyof TypeMap>(type : T, id: string) : Promise<void> {
    const fileDB : string = path.join(DB_DIR, `${type}.json`);
    let data: TypeMap[T][] = [];
    try {
        data =  JSON.parse(await fs.readFile(fileDB, "utf8"));
        data = data.filter(i => (i as any).id !== id);
        await fs.writeFile(fileDB, JSON.stringify(data, null, 2), "utf8");
        return ;
    } catch(e) {
        throw new Error(`Delete database error ${e}`);
    }
}