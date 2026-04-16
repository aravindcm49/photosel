import express from 'express';
import { existsSync } from 'fs';
import { resolve } from 'path';
import { scanImageMetadata } from './image-metadata-reader.js';
import * as folderRegistry from './folder-registry.js';

export function createApp() {
  const app = express();
  app.use(express.json());

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  app.post('/api/folder', async (req, res) => {
    const { path } = req.body as { path?: string };

    if (!path || typeof path !== 'string') {
      res.status(400).json({ error: 'Path is required' });
      return;
    }

    const absolutePath = resolve(path);

    if (!existsSync(absolutePath)) {
      res.status(400).json({ error: `Path does not exist: ${path}` });
      return;
    }

    try {
      const result = await scanImageMetadata(absolutePath);

      if (result.images.length === 0) {
        res.status(404).json({ error: 'No supported images found in the specified folder' });
        return;
      }

      const folderName = folderRegistry.register(absolutePath);

      res.json({
        folderName,
        images: result.images,
        aspectRatio: result.aspectRatio,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to scan folder';
      res.status(500).json({ error: message });
    }
  });

  return app;
}
