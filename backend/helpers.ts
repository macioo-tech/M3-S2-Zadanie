import path from 'node:path';
import {IncomingMessage, ServerResponse} from 'node:http';
import {authUser} from './auth.js';

export function findHeader(reqPath: string): string {
  switch (path.extname(reqPath === undefined ? '/index.html' : reqPath).toLowerCase()) {
    case '.html':
      return 'text/html';
    case '.css':
      return 'text/css';
    case '.js':
      return 'application/javascript';
    default:
      return 'application/json';
  }
}

export async function parseBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve) => {
    let data = '';
    req.on('data', (chunk) => {
      data += chunk;
    });
    req.on('end', () => {
      resolve(data);
    });
  });
}

export async function checkAuth(req: IncomingMessage, res: ServerResponse): Promise<boolean> {
  const auth = await authUser(req)
  if (!auth) {
    sendJSON(res, 400, {
      error: '❌ User Not Authenticated',
    })
    return false;
  }
  return true;
}

export function sendJSON(res: ServerResponse, statusCode: number, data: Object) {
  res.writeHead(statusCode, {'Content-Type': 'application/json'});
  res.end(JSON.stringify(data));
}

export function sseEvent(event: string, data: object): void {
  const message = `data: ${JSON.stringify({event, ...data})}\n\n`;
  clients.forEach((client, index) => {
    try {
      if (!client.writableEnded && !client.destroyed) {
        client.write(message);
      } else {
        // Remove disconnected client
        clients.splice(index, 1);
      }
    } catch (error) {
      console.error('Error sending SSE:', error);
      clients.splice(index, 1);
    }
  });
}

