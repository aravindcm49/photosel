// @vitest-environment node

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mkdir, writeFile, rm } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import { scanImageMetadata } from '../../server/image-metadata-reader';

// Mock sharp to avoid needing actual image processing
vi.mock('sharp', () => ({
  default: vi.fn(() => ({
    metadata: vi.fn(),
  })),
}));

import sharp from 'sharp';

const mockSharp = vi.mocked(sharp);

describe('Image Metadata Reader', () => {
  let testDir: string;

  beforeEach(async () => {
    testDir = join(tmpdir(), `photo-selector-test-${Date.now()}`);
    await mkdir(testDir, { recursive: true });
    vi.clearAllMocks();
  });

  afterEach(async () => {
    await rm(testDir, { recursive: true, force: true });
  });

  it('returns correct image metadata for supported images', async () => {
    await writeFile(join(testDir, 'photo1.jpg'), 'fake-image-data');
    await writeFile(join(testDir, 'photo2.png'), 'fake-image-data');

    let callCount = 0;
    mockSharp.mockImplementation((() => {
      callCount++;
      if (callCount === 1) {
        return { metadata: vi.fn().mockResolvedValue({ width: 4000, height: 3000 }) };
      }
      return { metadata: vi.fn().mockResolvedValue({ width: 2000, height: 1500 }) };
    }) as unknown as typeof sharp);

    const result = await scanImageMetadata(testDir);

    expect(result.images).toHaveLength(2);
    expect(result.images[0]).toEqual({
      name: 'photo1.jpg',
      width: 4000,
      height: 3000,
      size: expect.any(Number),
    });
    expect(result.images[1]).toEqual({
      name: 'photo2.png',
      width: 2000,
      height: 1500,
      size: expect.any(Number),
    });
  });

  it('returns empty image list for directory with no supported images', async () => {
    await writeFile(join(testDir, 'document.pdf'), 'not-an-image');
    await writeFile(join(testDir, 'notes.txt'), 'text-file');

    const result = await scanImageMetadata(testDir);

    expect(result.images).toHaveLength(0);
  });

  it('returns only supported images from mixed file types', async () => {
    await writeFile(join(testDir, 'photo.jpg'), 'image');
    await writeFile(join(testDir, 'document.pdf'), 'not-image');
    await writeFile(join(testDir, 'image.png'), 'image');

    mockSharp.mockImplementation((() => ({
      metadata: vi.fn().mockResolvedValue({ width: 100, height: 100 }),
    })) as unknown as typeof sharp);

    const result = await scanImageMetadata(testDir);

    expect(result.images).toHaveLength(2);
    expect(result.images.map((i) => i.name)).toEqual(['image.png', 'photo.jpg']);
  });

  it('computes portrait aspect ratio for portrait-majority folder', async () => {
    for (let i = 0; i < 5; i++) {
      await writeFile(join(testDir, `photo${i}.jpg`), 'image');
    }

    mockSharp.mockImplementation((() => ({
      metadata: vi.fn().mockResolvedValue({ width: 3000, height: 4000 }),
    })) as unknown as typeof sharp);

    const result = await scanImageMetadata(testDir);

    expect(result.aspectRatio).toBe(3 / 4);
  });

  it('computes landscape aspect ratio for landscape-majority folder', async () => {
    for (let i = 0; i < 5; i++) {
      await writeFile(join(testDir, `photo${i}.jpg`), 'image');
    }

    mockSharp.mockImplementation((() => ({
      metadata: vi.fn().mockResolvedValue({ width: 4000, height: 3000 }),
    })) as unknown as typeof sharp);

    const result = await scanImageMetadata(testDir);

    expect(result.aspectRatio).toBe(4 / 3);
  });

  it('computes square aspect ratio for square-majority folder', async () => {
    for (let i = 0; i < 5; i++) {
      await writeFile(join(testDir, `photo${i}.jpg`), 'image');
    }

    mockSharp.mockImplementation((() => ({
      metadata: vi.fn().mockResolvedValue({ width: 1000, height: 1000 }),
    })) as unknown as typeof sharp);

    const result = await scanImageMetadata(testDir);

    expect(result.aspectRatio).toBe(1);
  });

  it('sorts images alphabetically', async () => {
    await writeFile(join(testDir, 'zebra.jpg'), 'image');
    await writeFile(join(testDir, 'alpha.jpg'), 'image');
    await writeFile(join(testDir, 'mid.jpg'), 'image');

    mockSharp.mockImplementation((() => ({
      metadata: vi.fn().mockResolvedValue({ width: 100, height: 100 }),
    })) as unknown as typeof sharp);

    const result = await scanImageMetadata(testDir);

    expect(result.images.map((i) => i.name)).toEqual(['alpha.jpg', 'mid.jpg', 'zebra.jpg']);
  });
});
