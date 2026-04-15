import { useState, useEffect } from 'react';
import { imageCache, loadImageAsBlobUrl, preloadImages } from '@/lib/image-cache';

interface PhotoViewerProps {
  fileName: string;
  fileHandle: FileSystemFileHandle | null;
  aspectRatio: number;
  rotation: 0 | 90 | 180 | 270;
  allFileHandles: FileSystemFileHandle[];
  currentIndex: number;
}

export function PhotoViewer({
  fileName,
  fileHandle,
  aspectRatio,
  rotation,
  allFileHandles,
  currentIndex,
}: PhotoViewerProps) {
  const [imgUrl, setImgUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadImage() {
      if (!fileHandle) {
        setLoading(false);
        setError(true);
        return;
      }

      setLoading(true);
      setError(false);

      // Check cache first
      const cached = imageCache.get(fileHandle.name);
      if (cached) {
        if (!cancelled) {
          setImgUrl(cached);
          setLoading(false);
          setError(false);
        }
        return;
      }

      try {
        const url = await loadImageAsBlobUrl(fileHandle);
        if (!cancelled) {
          imageCache.set(fileHandle.name, url);
          setImgUrl(url);
          setLoading(false);
          setError(false);
        }
      } catch {
        if (!cancelled) {
          setLoading(false);
          setError(true);
        }
      }
    }

    loadImage();

    return () => {
      cancelled = true;
    };
  }, [fileHandle]);

  // Preload next 3 images
  useEffect(() => {
    if (allFileHandles.length > 0) {
      preloadImages(allFileHandles, currentIndex + 1, 3);
    }
  }, [allFileHandles, currentIndex]);

  const rotationTransform = getRotationTransform(rotation);

  if (error) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-muted">
        <div className="text-center">
          <p className="text-lg font-medium text-muted-foreground">Failed to load image</p>
          <p className="text-sm text-muted-foreground">{fileName}</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-muted">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-muted-foreground border-t-transparent" />
      </div>
    );
  }

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
        {imgUrl && (
          <img
            src={imgUrl}
            alt={fileName}
            className="h-full w-full object-contain"
            style={{ transform: rotationTransform }}
          />
        )}
      </div>
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