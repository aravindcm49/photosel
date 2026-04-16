import express from 'express';
import { existsSync } from 'fs';
import { resolve, join, extname } from 'path';
import { scanImageMetadata } from './image-metadata-reader.js';
import { getOrCreateThumbnail } from './thumbnail-cache.js';
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

  app.get('/api/folder/:folderName/photos/:photoName', async (req, res) => {
    const { folderName, photoName } = req.params;

    const folderPath = folderRegistry.resolve(folderName);
    if (!folderPath) {
      res.status(404).json({ error: 'Folder not found. Please re-submit the folder path.' });
      return;
    }

    const sourcePath = join(folderPath, photoName);

    if (!existsSync(sourcePath)) {
      res.status(404).json({ error: 'Photo not found' });
      return;
    }

    try {
      const cachedPath = await getOrCreateThumbnail(sourcePath);

      const ext = extname(photoName).toLowerCase();
      const contentType = ext === '.png' ? 'image/png' : 'image/jpeg';

      res.setHeader('Content-Type', contentType);
      res.sendFile(cachedPath);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to generate thumbnail';
      res.status(500).json({ error: message });
    }
  });

  app.get('/api/folder/:folderName/photos/:photoName/original', (req, res) => {
    const { folderName, photoName } = req.params;

    const folderPath = folderRegistry.resolve(folderName);
    if (!folderPath) {
      res.status(404).json({ error: 'Folder not found. Please re-submit the folder path.' });
      return;
    }

    const sourcePath = join(folderPath, photoName);

    if (!existsSync(sourcePath)) {
      res.status(404).json({ error: 'Photo not found' });
      return;
    }

    const ext = extname(photoName).toLowerCase();
    const contentType = ext === '.png' ? 'image/png' : 'image/jpeg';

    res.setHeader('Content-Type', contentType);
    res.sendFile(sourcePath);
  });

  return app;
}
