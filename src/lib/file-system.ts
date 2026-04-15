const SUPPORTED_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif']);

export function isSupportedImage(filename: string): boolean {
  const ext = filename.toLowerCase().slice(filename.lastIndexOf('.'));
  return SUPPORTED_EXTENSIONS.has(ext);
}

export function getSupportedExtensions(): string[] {
  return [...SUPPORTED_EXTENSIONS];
}

export async function getDirectoryHandle(): Promise<FileSystemDirectoryHandle | null> {
  if (typeof window.showDirectoryPicker !== 'function') {
    throw new Error(
      'Your browser does not support the File System Access API. Please use Chrome, Edge, or another Chromium-based browser.'
    );
  }
  try {
    const handle = await window.showDirectoryPicker({ mode: 'read' });
    return handle;
  } catch {
    return null;
  }
}

export async function getImageFilesFromDirectory(
  dirHandle: FileSystemDirectoryHandle
): Promise<FileSystemFileHandle[]> {
  const imageFiles: FileSystemFileHandle[] = [];

  for await (const entry of dirHandle.values()) {
    if (entry.kind === 'file' && isSupportedImage(entry.name)) {
      imageFiles.push(entry as FileSystemFileHandle);
    }
  }

  imageFiles.sort((a, b) => a.name.localeCompare(b.name));
  return imageFiles;
}

export async function analyzeAspectRatio(
  dirHandle: FileSystemDirectoryHandle
): Promise<number> {
  const imageFiles = await getImageFilesFromDirectory(dirHandle);
  const sampleSize = Math.min(20, imageFiles.length);
  const sampleFiles = imageFiles.slice(0, sampleSize);

  const ratios: number[] = [];
  for (const fileHandle of sampleFiles) {
    try {
      const file = await fileHandle.getFile();
      const bitmap = await createImageBitmap(file);
      ratios.push(bitmap.width / bitmap.height);
      bitmap.close();
    } catch {
      // Skip files that can't be loaded
    }
  }

  if (ratios.length === 0) return 3 / 4; // Default to portrait

  // Group into buckets: portrait (< 0.8), landscape (> 1.2), square (0.8-1.2)
  const portrait = ratios.filter((r) => r < 0.8).length;
  const landscape = ratios.filter((r) => r > 1.2).length;
  const square = ratios.filter((r) => r >= 0.8 && r <= 1.2).length;

  const buckets = [
    { type: 'portrait', count: portrait, ratio: 3 / 4 },
    { type: 'landscape', count: landscape, ratio: 4 / 3 },
    { type: 'square', count: square, ratio: 1 },
  ];

  buckets.sort((a, b) => b.count - a.count);
  return buckets[0].ratio;
}

export async function verifyPermission(
  dirHandle: FileSystemDirectoryHandle
): Promise<boolean> {
  try {
    const options = { mode: 'read' as const };
    const granted = await dirHandle.queryPermission(options);
    if (granted === 'granted') return true;
    const requested = await dirHandle.requestPermission(options);
    return requested === 'granted';
  } catch {
    return false;
  }
}