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
  const thumbnailUrl = `/api/folder/${encodeURIComponent(folderName)}/photos/${encodeURIComponent(photoName)}`;
  const rotationTransform = getRotationTransform(rotation);

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
          className="h-full w-full object-contain"
          style={{ transform: rotationTransform }}
        />
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
