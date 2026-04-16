// @vitest-environment node

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mkdir, writeFile, rm, utimes } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';

// Mock sharp - the toFile mock will actually write a file to disk
// so that existsSync in the cache module works correctly
vi.mock('sharp', () => ({
  default: vi.fn(() => {
    const chain = {
      resize: vi.fn().mockReturnThis(),
      jpeg: vi.fn().mockReturnThis(),
      toFile: vi.fn().mockImplementation(async (path: string) => {
        await writeFile(path, 'fake-thumbnail-data');
      }),
    };
    return chain;
  }),
}));

import sharp from 'sharp';
import { getOrCreateThumbnail } from '../../server/thumbnail-cache';

const mockSharp = vi.mocked(sharp);

describe('Thumbnail Cache', () => {
  let testDir: string;

  beforeEach(async () => {
    testDir = join(tmpdir(), `photo-selector-source-${Date.now()}`);
    await mkdir(testDir, { recursive: true });
    vi.clearAllMocks();
  });

  afterEach(async () => {
    await rm(testDir, { recursive: true, force: true });
  });

  it('generates a thumbnail on first request', async () => {
    const sourcePath = join(testDir, 'photo.jpg');
    await writeFile(sourcePath, 'fake-image-data');

    const result = await getOrCreateThumbnail(sourcePath, 1200);

    expect(result).toBeDefined();
    expect(typeof result).toBe('string');
    expect(mockSharp).toHaveBeenCalledWith(sourcePath);
  });

  it('serves cached thumbnail on second request without regeneration', async () => {
    const sourcePath = join(testDir, 'photo.jpg');
    await writeFile(sourcePath, 'fake-image-data');

    const result1 = await getOrCreateThumbnail(sourcePath, 1200);
    const result2 = await getOrCreateThumbnail(sourcePath, 1200);

    expect(result1).toBe(result2);
    // Sharp should only be called once (for the first generation)
    expect(mockSharp).toHaveBeenCalledTimes(1);
  });

  it('regenerates thumbnail when source file mtime changes', async () => {
    const sourcePath = join(testDir, 'photo.jpg');
    await writeFile(sourcePath, 'fake-image-data');

    const result1 = await getOrCreateThumbnail(sourcePath, 1200);

    // Change mtime
    const newTime = new Date(Date.now() + 10000);
    await utimes(sourcePath, newTime, newTime);

    const result2 = await getOrCreateThumbnail(sourcePath, 1200);

    // Different cache file because mtime changed
    expect(result2).not.toBe(result1);
    // Sharp called twice (original + regeneration)
    expect(mockSharp).toHaveBeenCalledTimes(2);
  });

  it('throws error when source file does not exist', async () => {
    const sourcePath = join(testDir, 'nonexistent.jpg');

    await expect(getOrCreateThumbnail(sourcePath)).rejects.toThrow('Source file does not exist');
  });

  it('throws error for unsupported image format', async () => {
    const sourcePath = join(testDir, 'document.pdf');
    await writeFile(sourcePath, 'not-an-image');

    await expect(getOrCreateThumbnail(sourcePath)).rejects.toThrow('Unsupported image format');
  });

  it('creates cache directory if missing', async () => {
    const { homedir } = await import('os');
    const { existsSync } = await import('fs');
    const { join } = await import('path');
    const cacheDir = join(homedir(), '.photo-selector', 'thumbnails');

    // Remove cache directory if it exists
    const { rm } = await import('fs/promises');
    await rm(cacheDir, { recursive: true, force: true });
    expect(existsSync(cacheDir)).toBe(false);

    // Generate a thumbnail - this should create the cache directory
    const sourcePath = join(testDir, 'photo.jpg');
    await writeFile(sourcePath, 'fake-image-data');

    await getOrCreateThumbnail(sourcePath, 1200);

    expect(existsSync(cacheDir)).toBe(true);
  });
});
