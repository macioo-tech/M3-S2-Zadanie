import fs from "node:fs/promises"
import path from "node:path";
import {fileURLToPath} from "node:url";
import {TypeMap} from "./types.js";
import {Pool, QueryResult} from 'pg';
import {sendJSON} from './helpers.js';
import {ServerResponse} from 'node:http';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_DIR = path.join(__dirname, '..', 'db');

//CRUD implementation
//Create
export async function Create<T extends keyof TypeMap>(type: T, newItem: TypeMap[T]): Promise<void> {
  const fileDB: string = path.join(DB_DIR, `${type}.json`);
  let data: TypeMap[T][] = [];
  try {
    data = JSON.parse(await fs.readFile(fileDB, "utf8"));
    data.push(newItem);
    await fs.writeFile(fileDB, JSON.stringify(data, null, 2), "utf8");
    return;
  } catch (e) {
    throw new Error(`Create database error ${e}`);
  }
}

// Read
export async function Read<T extends keyof TypeMap>(type: T, pool: Pool, res: ServerResponse, id?: string): Promise<void> {
  try {
    const optionalQuery: string = id ? `WHERE id = ${id}` : '';
    const data: QueryResult = await pool.query(`SELECT *
                                                    FROM ${type} ${optionalQuery}`);
    sendJSON(res, 200, {
      success: true,
      data: data.rows,
      message: 'success'
    })
  } catch (error) {
    sendJSON(res, 500, {
      success: false,
      message: `database error while reading ${type} ${error}`,
    })
  }
}

// Update
export async function Update<T extends keyof TypeMap>(type: T, id: string, newItem: TypeMap[T]): Promise<void> {
  const fileDB: string = path.join(DB_DIR, `${type}.json`);
  let data: TypeMap[T][] = [];
  try {
    data = JSON.parse(await fs.readFile(fileDB, "utf8"));
    const index = data.findIndex(i => (i as any).id === id);
    if (index === -1) {
      return;
    }
    const updatedItem: TypeMap[T] = {...data[index], ...newItem};
    (updatedItem as any).id = id;
    data[index] = updatedItem;

    await fs.writeFile(fileDB, JSON.stringify(data, null, 2), "utf8");
    return;
  } catch (e) {
    throw new Error(`Update database error ${e}`);
  }
}

// Delete
export async function Delete<T extends keyof TypeMap>(type: T, id: string): Promise<void> {
  const fileDB: string = path.join(DB_DIR, `${type}.json`);
  let data: TypeMap[T][] = [];
  try {
    data = JSON.parse(await fs.readFile(fileDB, "utf8"));
    data = data.filter(i => (i as any).id !== id);
    await fs.writeFile(fileDB, JSON.stringify(data, null, 2), "utf8");
    return;
  } catch (e) {
    throw new Error(`Delete database error ${e}`);
  }
}