import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PhotoViewer } from '../components/PhotoViewer';

describe('PhotoViewer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders an img element with the correct thumbnail URL', () => {
    render(
      <PhotoViewer
        folderName="TestFolder-abc12345"
        photoName="photo.jpg"
        aspectRatio={0.75}
        rotation={0}
      />
    );

    const img = screen.getByRole('img');
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', '/api/folder/TestFolder-abc12345/photos/photo.jpg');
    expect(img).toHaveAttribute('alt', 'photo.jpg');
  });

  it('encodes special characters in folder and photo names', () => {
    render(
      <PhotoViewer
        folderName="My Folder"
        photoName="photo (1).jpg"
        aspectRatio={0.75}
        rotation={0}
      />
    );

    const img = screen.getByRole('img');
    expect(img).toHaveAttribute('src', '/api/folder/My%20Folder/photos/photo%20(1).jpg');
  });

  it('applies rotation transform', () => {
    render(
      <PhotoViewer
        folderName="TestFolder-abc12345"
        photoName="rotated.jpg"
        aspectRatio={0.75}
        rotation={90}
      />
    );

    const img = screen.getByRole('img');
    expect(img).toHaveStyle({ transform: 'rotate(90deg)' });
  });

  it('applies aspect ratio to the container', () => {
    render(
      <PhotoViewer
        folderName="TestFolder-abc12345"
        photoName="photo.jpg"
        aspectRatio={4 / 3}
        rotation={0}
      />
    );

    const container = screen.getByRole('img').closest('[style*="aspect-ratio"]');
    expect(container).toBeInTheDocument();
    expect(container).toHaveStyle({ aspectRatio: String(4 / 3) });
  });

  it('does not use blob URLs', () => {
    render(
      <PhotoViewer
        folderName="TestFolder-abc12345"
        photoName="photo.jpg"
        aspectRatio={0.75}
        rotation={0}
      />
    );

    const img = screen.getByRole('img');
    expect(img.getAttribute('src')).not.toContain('blob:');
  });

  it('uses no preload or prefetch mechanism', () => {
    const { container } = render(
      <PhotoViewer
        folderName="TestFolder-abc12345"
        photoName="photo.jpg"
        aspectRatio={0.75}
        rotation={0}
      />
    );

    // No link rel=preload or prefetch elements
    const links = container.querySelectorAll('link[rel="preload"], link[rel="prefetch"]');
    expect(links).toHaveLength(0);
  });
});
