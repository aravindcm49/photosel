import { resolve as resolvePath } from 'path';
import { fileURLToPath } from 'url';
import { createApp } from './app.js';

const __dirname = resolvePath(fileURLToPath(import.meta.url), '..');
const isDev = process.env.NODE_ENV !== 'production';
const port = parseInt(process.env.PORT || '3000', 10);

const app = createApp();

async function start() {
  if (isDev) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const sirv = (await import('sirv')).default;
    // In production, server runs from dist/server/index.js
    // Client files are in dist/client/
    const clientDist = resolvePath(__dirname, '..', 'client');
    app.use(sirv(clientDist, { dev: false }));
    app.get('*', (_req, res) => {
      res.sendFile(resolvePath(clientDist, 'index.html'));
    });
  }

  app.listen(port, () => {
    console.log(`Server running at http://localhost:${port} (${isDev ? 'development' : 'production'})`);
  });
}

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
