import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { PhotoViewer } from '../components/PhotoViewer';
import { imageCache } from '../lib/image-cache';

vi.mock('../lib/image-cache', async () => {
  const actual = await vi.importActual<typeof import('../lib/image-cache')>('../lib/image-cache');
  return {
    ...actual,
    loadImageAsBlobUrl: vi.fn(),
    preloadImages: vi.fn(),
  };
});

import { loadImageAsBlobUrl, preloadImages } from '../lib/image-cache';

const mockLoadImage = vi.mocked(loadImageAsBlobUrl);

describe('PhotoViewer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    imageCache.clear();
  });

  it('shows loading spinner initially', () => {
    mockLoadImage.mockReturnValue(new Promise(() => {})); // Never resolves

    render(
      <PhotoViewer
        fileName="test.jpg"
        fileHandle={{ name: 'test.jpg' } as FileSystemFileHandle}
        aspectRatio={0.75}
        rotation={0}
        allFileHandles={[]}
        currentIndex={0}
      />
    );

    // Should have the spinner (animated spin element)
    const spinner = document.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
  });

  it('displays image when loaded', async () => {
    const blobUrl = 'blob:test';
    mockLoadImage.mockResolvedValue(blobUrl);

    render(
      <PhotoViewer
        fileName="photo.jpg"
        fileHandle={{ name: 'photo.jpg' } as FileSystemFileHandle}
        aspectRatio={0.75}
        rotation={0}
        allFileHandles={[]}
        currentIndex={0}
      />
    );

    await waitFor(() => {
      const img = screen.getByRole('img');
      expect(img).toBeInTheDocument();
      expect(img).toHaveAttribute('src', blobUrl);
    });
  });

  it('shows error placeholder when file handle is null', async () => {
    render(
      <PhotoViewer
        fileName="missing.jpg"
        fileHandle={null}
        aspectRatio={0.75}
        rotation={0}
        allFileHandles={[]}
        currentIndex={0}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Failed to load image')).toBeInTheDocument();
      expect(screen.getByText('missing.jpg')).toBeInTheDocument();
    });
  });

  it('shows error when image fails to load', async () => {
    mockLoadImage.mockRejectedValue(new Error('Failed'));

    render(
      <PhotoViewer
        fileName="broken.jpg"
        fileHandle={{ name: 'broken.jpg' } as FileSystemFileHandle}
        aspectRatio={0.75}
        rotation={0}
        allFileHandles={[]}
        currentIndex={0}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Failed to load image')).toBeInTheDocument();
      expect(screen.getByText('broken.jpg')).toBeInTheDocument();
    });
  });

  it('uses cached image when available', async () => {
    imageCache.set('cached.jpg', 'blob:cached');

    render(
      <PhotoViewer
        fileName="cached.jpg"
        fileHandle={{ name: 'cached.jpg' } as FileSystemFileHandle}
        aspectRatio={0.75}
        rotation={0}
        allFileHandles={[]}
        currentIndex={0}
      />
    );

    await waitFor(() => {
      const img = screen.getByRole('img');
      expect(img).toBeInTheDocument();
      expect(img).toHaveAttribute('src', 'blob:cached');
    });

    expect(mockLoadImage).not.toHaveBeenCalled();
  });

  it('applies rotation transform', async () => {
    mockLoadImage.mockResolvedValue('blob:rotated');

    render(
      <PhotoViewer
        fileName="rotated.jpg"
        fileHandle={{ name: 'rotated.jpg' } as FileSystemFileHandle}
        aspectRatio={0.75}
        rotation={90}
        allFileHandles={[]}
        currentIndex={0}
      />
    );

    await waitFor(() => {
      const img = screen.getByRole('img');
      expect(img).toBeInTheDocument();
      expect(img).toHaveStyle({ transform: 'rotate(90deg)' });
    });
  });

  it('calls preloadImages for next 3 photos', async () => {
    mockLoadImage.mockResolvedValue('blob:preload');
    const handles = [
      { name: 'a.jpg' },
      { name: 'b.jpg' },
      { name: 'c.jpg' },
      { name: 'd.jpg' },
    ] as unknown as FileSystemFileHandle[];

    render(
      <PhotoViewer
        fileName="a.jpg"
        fileHandle={handles[0]}
        aspectRatio={0.75}
        rotation={0}
        allFileHandles={handles}
        currentIndex={0}
      />
    );

    await waitFor(() => {
      expect(preloadImages).toHaveBeenCalledWith(handles, 1, 3);
    });
  });
});