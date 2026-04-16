import { useState, useCallback } from 'react';
import { X } from 'lucide-react';

interface PhotoViewerProps {
  folderName: string;
  photoName: string;
  aspectRatio: number;
  rotation: 0 | 90 | 180 | 270;
}

export function PhotoViewer({
  folderName,
  photoName,
  aspectRatio,
  rotation,
}: PhotoViewerProps) {
  const [showOriginal, setShowOriginal] = useState(false);

  const thumbnailUrl = `/api/folder/${encodeURIComponent(folderName)}/photos/${encodeURIComponent(photoName)}`;
  const originalUrl = `/api/folder/${encodeURIComponent(folderName)}/photos/${encodeURIComponent(photoName)}/original`;
  const rotationTransform = getRotationTransform(rotation);

  const handleThumbnailClick = useCallback(() => {
    setShowOriginal(true);
  }, []);

  const handleCloseOverlay = useCallback(() => {
    setShowOriginal(false);
  }, []);

  return (
    <div className="flex h-full w-full items-center justify-center overflow-hidden">
      <div
        className="relative"
        style={{
          aspectRatio: String(aspectRatio),
          maxHeight: '100%',
          maxWidth: '100%',
        }}
      >
        <img
          src={thumbnailUrl}
          alt={photoName}
          className="h-full w-full cursor-pointer object-contain"
          style={{ transform: rotationTransform }}
          onClick={handleThumbnailClick}
        />
      </div>

      {showOriginal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90"
          onClick={handleCloseOverlay}
          role="dialog"
          aria-label="Full resolution image viewer"
        >
          <button
            onClick={handleCloseOverlay}
            className="absolute right-4 top-4 z-10 rounded-full bg-black/50 p-2 text-white hover:bg-black/70"
            aria-label="Close full resolution view"
          >
            <X className="h-6 w-6" />
          </button>
          <img
            src={originalUrl}
            alt={photoName}
            className="max-h-full max-w-full object-contain"
            style={{ transform: rotationTransform }}
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}

function getRotationTransform(rotation: 0 | 90 | 180 | 270): string {
  switch (rotation) {
    case 90:
      return 'rotate(90deg)';
    case 180:
      return 'rotate(180deg)';
    case 270:
      return 'rotate(270deg)';
    default:
      return 'rotate(0deg)';
  }
}
