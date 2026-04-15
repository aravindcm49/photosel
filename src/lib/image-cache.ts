const MAX_CACHE_SIZE = 10;

class ImageCache {
  private cache = new Map<string, string>();
  private order: string[] = [];

  get(key: string): string | undefined {
    // Move to end (most recently used)
    if (this.cache.has(key)) {
      const idx = this.order.indexOf(key);
      this.order.splice(idx, 1);
      this.order.push(key);
      return this.cache.get(key);
    }
    return undefined;
  }

  set(key: string, url: string): void {
    if (this.cache.has(key)) {
      const idx = this.order.indexOf(key);
      this.order.splice(idx, 1);
    } else if (this.order.length >= MAX_CACHE_SIZE) {
      // Evict least recently used
      const lru = this.order.shift();
      if (lru) {
        const oldUrl = this.cache.get(lru);
        if (oldUrl) URL.revokeObjectURL(oldUrl);
        this.cache.delete(lru);
      }
    }
    this.cache.set(key, url);
    this.order.push(key);
  }

  has(key: string): boolean {
    return this.cache.has(key);
  }

  clear(): void {
    for (const url of this.cache.values()) {
      URL.revokeObjectURL(url);
    }
    this.cache.clear();
    this.order = [];
  }

  get size(): number {
    return this.cache.size;
  }
}

export const imageCache = new ImageCache();

export async function loadImageAsBlobUrl(fileHandle: FileSystemFileHandle): Promise<string> {
  const file = await fileHandle.getFile();
  const blobUrl = URL.createObjectURL(file);
  return blobUrl;
}

export function preloadImages(
  fileHandles: FileSystemFileHandle[],
  startIndex: number,
  count: number
): void {
  for (let i = startIndex; i < Math.min(startIndex + count, fileHandles.length); i++) {
    const handle = fileHandles[i];
    if (!imageCache.has(handle.name)) {
      loadImageAsBlobUrl(handle).then((url) => {
        imageCache.set(handle.name, url);
      });
    }
  }
}