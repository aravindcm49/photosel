import { readdir, stat } from 'fs/promises';
import { join, extname } from 'path';
import sharp from 'sharp';

const SUPPORTED_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif']);

export interface ImageMetadata {
  name: string;
  width: number;
  height: number;
  size: number;
}

export interface ScanResult {
  images: ImageMetadata[];
  aspectRatio: number;
}

function isSupportedImage(filename: string): boolean {
  const ext = extname(filename).toLowerCase();
  return SUPPORTED_EXTENSIONS.has(ext);
}

function computeAspectRatio(images: ImageMetadata[]): number {
  if (images.length === 0) return 3 / 4;

  const ratios = images.map((img) => img.width / img.height);

  const portrait = ratios.filter((r) => r < 0.8).length;
  const landscape = ratios.filter((r) => r > 1.2).length;
  const square = ratios.filter((r) => r >= 0.8 && r <= 1.2).length;

  const buckets = [
    { count: portrait, ratio: 3 / 4 },
    { count: landscape, ratio: 4 / 3 },
    { count: square, ratio: 1 },
  ];

  buckets.sort((a, b) => b.count - a.count);
  return buckets[0].ratio;
}

export async function scanImageMetadata(dirPath: string): Promise<ScanResult> {
  const entries = await readdir(dirPath);
  const imageFiles = entries
    .filter((entry) => isSupportedImage(entry))
    .sort((a, b) => a.localeCompare(b));

  const images: ImageMetadata[] = [];

  for (const file of imageFiles) {
    const filePath = join(dirPath, file);
    const fileStat = await stat(filePath);
    const metadata = await sharp(filePath).metadata();

    if (metadata.width && metadata.height) {
      images.push({
        name: file,
        width: metadata.width,
        height: metadata.height,
        size: fileStat.size,
      });
    }
  }

  const aspectRatio = computeAspectRatio(images);

  return { images, aspectRatio };
}
