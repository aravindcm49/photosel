import type { PhotoData } from '@/types';

export function createDefaultPhotoData(filename: string): PhotoData {
  return {
    filename,
    status: null,
    people: [],
    timestamp: Date.now(),
    rotation: 0,
  };
}

export function countReviewed(photos: Record<string, PhotoData>): number {
  return Object.values(photos).filter((p) => p.status !== null).length;
}