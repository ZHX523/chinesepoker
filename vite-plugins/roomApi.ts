import type { Connect, Plugin } from 'vite';

const rooms = new Map<string, string>();

function roomApiMiddleware(): Connect.NextHandleFunction {
  return (req, res, next) => {
    const url = req.url ?? '';
    const match = url.match(/^\/api\/rooms\/([^/?]+)/);
    if (!match) {
      next();
      return;
    }

    const roomId = decodeURIComponent(match[1]).toUpperCase();

    if (req.method === 'GET') {
      const body = rooms.get(roomId) ?? 'null';
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.end(body);
      return;
    }

    if (req.method === 'PUT') {
      const chunks: Buffer[] = [];
      req.on('data', (chunk) => chunks.push(chunk));
      req.on('end', () => {
        const body = Buffer.concat(chunks).toString('utf8');
        rooms.set(roomId, body);
        res.statusCode = 204;
        res.end();
      });
      return;
    }

    res.statusCode = 405;
    res.end();
  };
}

export function roomApiPlugin(): Plugin {
  return {
    name: 'bigtwo-room-api',
    configureServer(server) {
      server.middlewares.use(roomApiMiddleware());
    },
    configurePreviewServer(server) {
      server.middlewares.use(roomApiMiddleware());
    },
  };
}
