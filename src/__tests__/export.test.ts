import { describe, it, expect } from 'vitest';
import {
  generateSelectedContent,
  generateSkippedContent,
} from '../lib/export';
import type { Project } from '../types';

const mockProject: Project = {
  folderName: 'TestFolder',
  totalPhotos: 5,
  reviewedCount: 5,
  createdAt: Date.now(),
  updatedAt: Date.now(),
  photos: {
    'b.jpg': { filename: 'b.jpg', status: 'selected', people: [], timestamp: Date.now(), rotation: 0 },
    'a.jpg': { filename: 'a.jpg', status: 'selected', people: [], timestamp: Date.now(), rotation: 0 },
    'c.jpg': { filename: 'c.jpg', status: 'skipped', people: [], timestamp: Date.now(), rotation: 0 },
    'd.jpg': { filename: 'd.jpg', status: 'selected', people: [], timestamp: Date.now(), rotation: 0 },
    'e.jpg': { filename: 'e.jpg', status: 'skipped', people: [], timestamp: Date.now(), rotation: 0 },
  },
};

describe('export', () => {
  it('generates Selected.txt with alphabetically sorted selected filenames', () => {
    const content = generateSelectedContent(mockProject);
    expect(content).toBe('a.jpg\nb.jpg\nd.jpg');
  });

  it('generates Skipped.txt with alphabetically sorted skipped filenames', () => {
    const content = generateSkippedContent(mockProject);
    expect(content).toBe('c.jpg\ne.jpg');
  });

  it('generates empty content when no photos selected', () => {
    const emptyProject: Project = {
      ...mockProject,
      photos: {
        'a.jpg': { filename: 'a.jpg', status: 'skipped', people: [], timestamp: Date.now(), rotation: 0 },
      },
    };
    const content = generateSelectedContent(emptyProject);
    expect(content).toBe('');
  });

  it('generates correct content when all selected (none skipped)', () => {
    const allSelected: Project = {
      ...mockProject,
      photos: {
        'a.jpg': { filename: 'a.jpg', status: 'selected', people: [], timestamp: Date.now(), rotation: 0 },
        'b.jpg': { filename: 'b.jpg', status: 'selected', people: [], timestamp: Date.now(), rotation: 0 },
      },
    };
    expect(generateSkippedContent(allSelected)).toBe('');
    expect(generateSelectedContent(allSelected)).toBe('a.jpg\nb.jpg');
  });
});