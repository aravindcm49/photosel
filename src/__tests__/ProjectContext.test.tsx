import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { ProjectProvider, useProject } from '../context/ProjectContext';
import type { Project } from '../types';

const mockProject: Project = {
  folderName: 'TestFolder',
  totalPhotos: 3,
  reviewedCount: 0,
  createdAt: Date.now(),
  updatedAt: Date.now(),
  photos: {
    'a.jpg': { filename: 'a.jpg', status: null, people: [], timestamp: Date.now(), rotation: 0 },
    'b.jpg': { filename: 'b.jpg', status: null, people: [], timestamp: Date.now(), rotation: 0 },
    'c.jpg': { filename: 'c.jpg', status: null, people: [], timestamp: Date.now(), rotation: 0 },
  },
};

vi.mock('../lib/db', () => ({
  saveProject: vi.fn(),
}));

vi.mock('../lib/image-utils', () => ({
  countReviewed: vi.fn((photos: Record<string, { status: string | null }>) => {
    return Object.values(photos).filter((p) => p.status !== null).length;
  }),
}));

function wrapper({ children }: { children: React.ReactNode }) {
  return (
    <ProjectProvider initialProject={mockProject}>
      {children}
    </ProjectProvider>
  );
}

describe('ProjectContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('provides project state', () => {
    const { result } = renderHook(() => useProject(), { wrapper });
    expect(result.current.project.folderName).toBe('TestFolder');
    expect(result.current.totalPhotos).toBe(3);
    expect(result.current.currentIndex).toBe(0);
  });

  it('marks photo as selected', () => {
    const { result } = renderHook(() => useProject(), { wrapper });
    act(() => {
      result.current.markPhoto('selected');
    });
    expect(result.current.currentPhoto?.status).toBe('selected');
  });

  it('marks photo as skipped', () => {
    const { result } = renderHook(() => useProject(), { wrapper });
    act(() => {
      result.current.markPhoto('skipped');
    });
    expect(result.current.currentPhoto?.status).toBe('skipped');
  });

  it('navigates to next photo', () => {
    const { result } = renderHook(() => useProject(), { wrapper });
    expect(result.current.currentIndex).toBe(0);
    act(() => {
      result.current.goToNext();
    });
    expect(result.current.currentIndex).toBe(1);
  });

  it('navigates to previous photo', () => {
    const { result } = renderHook(() => useProject(), { wrapper });
    act(() => {
      result.current.goToNext();
    });
    expect(result.current.currentIndex).toBe(1);
    act(() => {
      result.current.goToPrevious();
    });
    expect(result.current.currentIndex).toBe(0);
  });

  it('does not navigate before first photo', () => {
    const { result } = renderHook(() => useProject(), { wrapper });
    act(() => {
      result.current.goToPrevious();
    });
    expect(result.current.currentIndex).toBe(0);
  });

  it('returns false when navigating past last photo', () => {
    const { result } = renderHook(() => useProject(), { wrapper });
    act(() => {
      result.current.goToNext();
    });
    expect(result.current.currentIndex).toBe(1);
    act(() => {
      result.current.goToNext();
    });
    expect(result.current.currentIndex).toBe(2);
    let moved: boolean;
    act(() => {
      moved = result.current.goToNext();
    });
    expect(moved!).toBe(false);
    expect(result.current.currentIndex).toBe(2);
  });

  it('rotates photo 90 degrees clockwise', () => {
    const { result } = renderHook(() => useProject(), { wrapper });
    expect(result.current.currentPhoto?.rotation).toBe(0);
    act(() => {
      result.current.rotatePhoto();
    });
    expect(result.current.currentPhoto?.rotation).toBe(90);
    act(() => {
      result.current.rotatePhoto();
    });
    expect(result.current.currentPhoto?.rotation).toBe(180);
    act(() => {
      result.current.rotatePhoto();
    });
    expect(result.current.currentPhoto?.rotation).toBe(270);
    act(() => {
      result.current.rotatePhoto();
    });
    expect(result.current.currentPhoto?.rotation).toBe(0);
  });

  it('tags people on current photo', () => {
    const { result } = renderHook(() => useProject(), { wrapper });
    act(() => {
      result.current.tagPeople(['John', 'Jane']);
    });
    expect(result.current.currentPhoto?.people).toEqual(['John', 'Jane']);
  });

  it('updates reviewedCount when marking photos', () => {
    const { result } = renderHook(() => useProject(), { wrapper });
    expect(result.current.project.reviewedCount).toBe(0);
    act(() => {
      result.current.markPhoto('selected');
    });
    expect(result.current.project.reviewedCount).toBe(1);
  });
});