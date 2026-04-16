import { stat } from 'fs/promises';
import { existsSync, mkdirSync } from 'fs';
import { join, extname } from 'path';
import { createHash } from 'crypto';
import { homedir } from 'os';
import sharp from 'sharp';

const CACHE_DIR = join(homedir(), '.photo-selector', 'thumbnails');
const MAX_SIZE = 1200;

const SUPPORTED_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif']);

function cacheKey(sourcePath: string, mtime: number): string {
  const hash = createHash('sha256')
    .update(`${sourcePath}:${mtime}`)
    .digest('hex');
  const ext = extname(sourcePath).toLowerCase();
  return `${hash}${ext === '.png' ? '.png' : '.jpg'}`;
}

function ensureCacheDir(): void {
  if (!existsSync(CACHE_DIR)) {
    mkdirSync(CACHE_DIR, { recursive: true });
  }
}

export async function getOrCreateThumbnail(sourcePath: string, maxSize: number = MAX_SIZE): Promise<string> {
  ensureCacheDir();

  if (!existsSync(sourcePath)) {
    throw new Error(`Source file does not exist: ${sourcePath}`);
  }

  const ext = extname(sourcePath).toLowerCase();
  if (!SUPPORTED_EXTENSIONS.has(ext)) {
    throw new Error(`Unsupported image format: ${ext}`);
  }

  const fileStat = await stat(sourcePath);
  const mtime = fileStat.mtimeMs;
  const key = cacheKey(sourcePath, mtime);
  const cachedPath = join(CACHE_DIR, key);

  if (existsSync(cachedPath)) {
    return cachedPath;
  }

  // Generate thumbnail
  await sharp(sourcePath)
    .resize(maxSize, maxSize, { fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: 85 })
    .toFile(cachedPath);

  return cachedPath;
}
