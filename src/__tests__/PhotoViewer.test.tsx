import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
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

  it('clicking thumbnail opens full-res overlay', () => {
    render(
      <PhotoViewer
        folderName="TestFolder-abc12345"
        photoName="photo.jpg"
        aspectRatio={0.75}
        rotation={0}
      />
    );

    // No overlay initially
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    // Click the thumbnail to open overlay
    const thumbnail = screen.getByAltText('photo.jpg');
    fireEvent.click(thumbnail);

    // Overlay should now be visible
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByRole('dialog')).toHaveAttribute(
      'aria-label',
      'Full resolution image viewer'
    );

    // The overlay should contain an img with the original URL
    const overlayImages = screen.getByRole('dialog').querySelectorAll('img');
    expect(overlayImages).toHaveLength(1);
    expect(overlayImages[0]).toHaveAttribute(
      'src',
      '/api/folder/TestFolder-abc12345/photos/photo.jpg/original'
    );
  });

  it('closing overlay unloads the full-res image', () => {
    render(
      <PhotoViewer
        folderName="TestFolder-abc12345"
        photoName="photo.jpg"
        aspectRatio={0.75}
        rotation={0}
      />
    );

    // Open the overlay
    const thumbnail = screen.getByAltText('photo.jpg');
    fireEvent.click(thumbnail);
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    // Close via the close button
    const closeButton = screen.getByLabelText('Close full resolution view');
    fireEvent.click(closeButton);

    // Overlay should be removed from DOM
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('clicking overlay backdrop closes the overlay', () => {
    render(
      <PhotoViewer
        folderName="TestFolder-abc12345"
        photoName="photo.jpg"
        aspectRatio={0.75}
        rotation={0}
      />
    );

    // Open the overlay
    const thumbnail = screen.getByAltText('photo.jpg');
    fireEvent.click(thumbnail);
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    // Click the backdrop (the dialog element itself)
    const dialog = screen.getByRole('dialog');
    fireEvent.click(dialog);

    // Overlay should be removed
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('applies rotation to the full-res overlay image', () => {
    render(
      <PhotoViewer
        folderName="TestFolder-abc12345"
        photoName="photo.jpg"
        aspectRatio={0.75}
        rotation={90}
      />
    );

    // Open the overlay
    const thumbnail = screen.getByAltText('photo.jpg');
    fireEvent.click(thumbnail);

    // The overlay image should have the rotation transform
    const overlayImage = screen.getByRole('dialog').querySelector('img')!;
    expect(overlayImage).toHaveStyle({ transform: 'rotate(90deg)' });
  });
});
