export type PhotoStatus = 'selected' | 'skipped' | null;

export interface PhotoData {
  filename: string;
  status: PhotoStatus;
  people: string[];
  timestamp: number;
  rotation: 0 | 90 | 180 | 270;
}

export interface Project {
  folderName: string;
  totalPhotos: number;
  reviewedCount: number;
  createdAt: number;
  updatedAt: number;
  photos: Record<string, PhotoData>;
}

export interface GlobalPerson {
  id?: number;
  name: string;
  createdAt: number;
}