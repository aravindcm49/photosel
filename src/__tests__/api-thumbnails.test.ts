// @vitest-environment node

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createApp } from '../../server/app';
import * as folderRegistry from '../../server/folder-registry';
import request from 'supertest';
import { writeFile, mkdir, rm } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';

// Mock the image-metadata-reader module
vi.mock('../../server/image-metadata-reader', () => ({
  scanImageMetadata: vi.fn(),
}));

// Mock the thumbnail-cache module
vi.mock('../../server/thumbnail-cache', () => ({
  getOrCreateThumbnail: vi.fn(),
}));

// Mock fs existsSync
vi.mock('fs', async (importOriginal) => {
  const actual = await importOriginal<typeof import('fs')>();
  return {
    ...actual,
    existsSync: vi.fn(),
  };
});

import { getOrCreateThumbnail } from '../../server/thumbnail-cache';
import { existsSync } from 'fs';

const mockGetOrCreateThumbnail = vi.mocked(getOrCreateThumbnail);
const mockExistsSync = vi.mocked(existsSync);

describe('GET /api/folder/:folderName/photos/:photoName', () => {
  let registeredName: string;
  let testTmpDir: string;

  beforeEach(async () => {
    vi.clearAllMocks();
    folderRegistry.clear();
    registeredName = folderRegistry.register('/home/user/photos');

    // Create a temp directory with fake thumbnail files for sendFile
    testTmpDir = join(tmpdir(), `thumbnail-test-${Date.now()}`);
    await mkdir(testTmpDir, { recursive: true });
  });

  afterEach(async () => {
    await rm(testTmpDir, { recursive: true, force: true });
  });

  it('returns a thumbnail image with correct Content-Type for jpg', async () => {
    const thumbnailPath = join(testTmpDir, 'abc123.jpg');
    await writeFile(thumbnailPath, 'fake-jpeg-data');

    mockExistsSync.mockReturnValue(true);
    mockGetOrCreateThumbnail.mockResolvedValue(thumbnailPath);

    const app = createApp();
    const res = await request(app)
      .get(`/api/folder/${registeredName}/photos/photo.jpg`);

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/image\/jpeg/);
    expect(mockGetOrCreateThumbnail).toHaveBeenCalledWith(
      join('/home/user/photos', 'photo.jpg')
    );
  });

  it('returns a thumbnail with image/png Content-Type for png', async () => {
    const thumbnailPath = join(testTmpDir, 'def456.png');
    await writeFile(thumbnailPath, 'fake-png-data');

    mockExistsSync.mockReturnValue(true);
    mockGetOrCreateThumbnail.mockResolvedValue(thumbnailPath);

    const app = createApp();
    const res = await request(app)
      .get(`/api/folder/${registeredName}/photos/image.png`);

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/image\/png/);
  });

  it('returns 404 when folder is not in registry', async () => {
    const app = createApp();
    const res = await request(app)
      .get('/api/folder/unknown-folder/photos/photo.jpg');

    expect(res.status).toBe(404);
    expect(res.body.error).toContain('Folder not found');
  });

  it('returns 404 when photo file does not exist', async () => {
    mockExistsSync.mockImplementation((path: unknown) => {
      const p = String(path);
      return !p.includes('photo.jpg');
    });

    const app = createApp();
    const res = await request(app)
      .get(`/api/folder/${registeredName}/photos/photo.jpg`);

    expect(res.status).toBe(404);
    expect(res.body.error).toContain('Photo not found');
  });

  it('returns 500 when thumbnail generation fails', async () => {
    mockExistsSync.mockReturnValue(true);
    mockGetOrCreateThumbnail.mockRejectedValue(new Error('Unsupported image format'));

    const app = createApp();
    const res = await request(app)
      .get(`/api/folder/${registeredName}/photos/photo.bmp`);

    expect(res.status).toBe(500);
    expect(res.body.error).toContain('Unsupported image format');
  });
});

describe('GET /api/folder/:folderName/photos/:photoName/original', () => {
  let registeredName: string;
  let testTmpDir: string;

  beforeEach(async () => {
    vi.clearAllMocks();
    folderRegistry.clear();

    testTmpDir = join(tmpdir(), `original-test-${Date.now()}`);
    await mkdir(testTmpDir, { recursive: true });
    registeredName = folderRegistry.register(testTmpDir);
  });

  afterEach(async () => {
    await rm(testTmpDir, { recursive: true, force: true });
  });

  it('serves the original jpg with correct Content-Type', async () => {
    await writeFile(join(testTmpDir, 'photo.jpg'), 'fake-original-jpeg-data');
    mockExistsSync.mockReturnValue(true);

    const app = createApp();
    const res = await request(app)
      .get(`/api/folder/${registeredName}/photos/photo.jpg/original`);

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/image\/jpeg/);
  });

  it('serves the original png with image/png Content-Type', async () => {
    await writeFile(join(testTmpDir, 'image.png'), 'fake-original-png-data');
    mockExistsSync.mockReturnValue(true);

    const app = createApp();
    const res = await request(app)
      .get(`/api/folder/${registeredName}/photos/image.png/original`);

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/image\/png/);
  });

  it('returns 404 when folder is not in registry', async () => {
    const app = createApp();
    const res = await request(app)
      .get('/api/folder/unknown-folder/photos/photo.jpg/original');

    expect(res.status).toBe(404);
    expect(res.body.error).toContain('Folder not found');
  });

  it('returns 404 when photo file does not exist on disk', async () => {
    mockExistsSync.mockImplementation((p: unknown) => {
      const str = String(p);
      return !str.endsWith('missing.jpg');
    });

    const app = createApp();
    const res = await request(app)
      .get(`/api/folder/${registeredName}/photos/missing.jpg/original`);

    expect(res.status).toBe(404);
    expect(res.body.error).toContain('Photo not found');
  });
});
