import {IncomingMessage, ServerResponse} from "node:http";
import fs from "fs/promises"
import {User} from "./types.js";

const USERS_DB = "./db/users.json"
const CARS_DB = "./db/cars.json"

async function loadData<T> (file: string) : Promise<T[]>  {
    try {
        const data : string = await fs.readFile(file, "utf8");
        return JSON.parse(data);
    } catch (e) {
        return [];
    }
}

async function saveData (file: string, data: []) : Promise<void>  {
    try {
        const jasonData : string = JSON.stringify(data, null, 2);
        await fs.writeFile(file, jasonData, "utf8")
    } catch (e) {
        return
    }
}

// TODO CRUD for USER and CAR
async function c(type : 'user' | 'car', id? : string) : Promise<void>  {

}

async function r(type : 'user' | 'car', id? : string) : Promise<void>  {

}

async function u(type : 'user' | 'car', id? : string) : Promise<void>  {

}

async function d(type : 'user' | 'car', id? : string) : Promise<void>  {

}