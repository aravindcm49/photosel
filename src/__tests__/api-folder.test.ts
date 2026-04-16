// @vitest-environment node

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createApp } from '../../server/app';
import * as folderRegistry from '../../server/folder-registry';
import request from 'supertest';

// Mock the image-metadata-reader module
vi.mock('../../server/image-metadata-reader', () => ({
  scanImageMetadata: vi.fn(),
}));

// Mock fs existsSync
vi.mock('fs', async (importOriginal) => {
  const actual = await importOriginal<typeof import('fs')>();
  return {
    ...actual,
    existsSync: vi.fn(),
  };
});

import { scanImageMetadata } from '../../server/image-metadata-reader';
import { existsSync } from 'fs';

const mockScanImageMetadata = vi.mocked(scanImageMetadata);
const mockExistsSync = vi.mocked(existsSync);

describe('POST /api/folder', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    folderRegistry.clear();
  });

  it('returns folderName, images, and aspectRatio for valid path', async () => {
    mockExistsSync.mockReturnValue(true);
    mockScanImageMetadata.mockResolvedValue({
      images: [
        { name: 'photo1.jpg', width: 4000, height: 3000, size: 5000000 },
        { name: 'photo2.jpg', width: 3000, height: 4000, size: 4000000 },
      ],
      aspectRatio: 4 / 3,
    });

    const app = createApp();
    const res = await request(app)
      .post('/api/folder')
      .send({ path: '/home/user/photos' });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('folderName');
    expect(res.body.images).toHaveLength(2);
    expect(res.body.images[0]).toEqual({
      name: 'photo1.jpg',
      width: 4000,
      height: 3000,
      size: 5000000,
    });
    expect(res.body.aspectRatio).toBe(4 / 3);
  });

  it('returns 400 when path is missing', async () => {
    const app = createApp();
    const res = await request(app)
      .post('/api/folder')
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Path is required');
  });

  it('returns 400 when path does not exist', async () => {
    mockExistsSync.mockReturnValue(false);

    const app = createApp();
    const res = await request(app)
      .post('/api/folder')
      .send({ path: '/nonexistent/path' });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('Path does not exist');
  });

  it('returns 404 when folder has no supported images', async () => {
    mockExistsSync.mockReturnValue(true);
    mockScanImageMetadata.mockResolvedValue({
      images: [],
      aspectRatio: 3 / 4,
    });

    const app = createApp();
    const res = await request(app)
      .post('/api/folder')
      .send({ path: '/home/user/empty-folder' });

    expect(res.status).toBe(404);
    expect(res.body.error).toContain('No supported images found');
  });

  it('registers folder in Folder Registry on success', async () => {
    mockExistsSync.mockReturnValue(true);
    mockScanImageMetadata.mockResolvedValue({
      images: [{ name: 'photo.jpg', width: 100, height: 100, size: 1000 }],
      aspectRatio: 1,
    });

    const app = createApp();
    const res = await request(app)
      .post('/api/folder')
      .send({ path: '/home/user/photos' });

    expect(res.status).toBe(200);
    const resolved = folderRegistry.resolve(res.body.folderName);
    expect(resolved).toBeDefined();
  });
});
