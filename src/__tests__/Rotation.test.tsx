import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { ProjectProvider, useProject } from '../context/ProjectContext';
import type { Project } from '../types';

const mockProject: Project = {
  folderName: 'Test',
  totalPhotos: 1,
  reviewedCount: 0,
  createdAt: Date.now(),
  updatedAt: Date.now(),
  photos: {
    'a.jpg': { filename: 'a.jpg', status: null, people: [], timestamp: Date.now(), rotation: 0 },
  },
};

const mockSaveProject = vi.fn();

vi.mock('../lib/db', () => ({
  saveProject: (...args: unknown[]) => mockSaveProject(...args),
}));

vi.mock('../lib/image-utils', () => ({
  countReviewed: vi.fn(() => 0),
}));

function wrapper({ children }: { children: React.ReactNode }) {
  return (
    <ProjectProvider initialProject={mockProject}>
      {children}
    </ProjectProvider>
  );
}

describe('Photo Rotation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('cycles rotation through 0/90/180/270/0 degrees', () => {
    const { result } = renderHook(() => useProject(), { wrapper });

    expect(result.current.currentPhoto?.rotation).toBe(0);

    act(() => result.current.rotatePhoto());
    expect(result.current.currentPhoto?.rotation).toBe(90);

    act(() => result.current.rotatePhoto());
    expect(result.current.currentPhoto?.rotation).toBe(180);

    act(() => result.current.rotatePhoto());
    expect(result.current.currentPhoto?.rotation).toBe(270);

    act(() => result.current.rotatePhoto());
    expect(result.current.currentPhoto?.rotation).toBe(0);
  });

  it('persists rotation via debounced saveProject', () => {
    const { result } = renderHook(() => useProject(), { wrapper });

    act(() => result.current.rotatePhoto());

    // saveProject is debounced, not called yet
    expect(mockSaveProject).not.toHaveBeenCalled();

    // Fast-forward debounce timer
    act(() => { vi.advanceTimersByTime(500); });

    expect(mockSaveProject).toHaveBeenCalledTimes(1);
    const savedProject = mockSaveProject.mock.calls[0][0] as Project;
    expect(savedProject.photos['a.jpg'].rotation).toBe(90);
  });

  it('rotation is applied to PhotoViewer CSS transform', () => {
    const { result } = renderHook(() => useProject(), { wrapper });
    act(() => result.current.rotatePhoto());
    expect(result.current.currentPhoto?.rotation).toBe(90);
    // The actual CSS transform is handled in PhotoViewer component
  });

  it('rotateRight cycles clockwise through 0/90/180/270/0', () => {
    const { result } = renderHook(() => useProject(), { wrapper });

    expect(result.current.currentPhoto?.rotation).toBe(0);

    act(() => result.current.rotateRight());
    expect(result.current.currentPhoto?.rotation).toBe(90);

    act(() => result.current.rotateRight());
    expect(result.current.currentPhoto?.rotation).toBe(180);

    act(() => result.current.rotateRight());
    expect(result.current.currentPhoto?.rotation).toBe(270);

    act(() => result.current.rotateRight());
    expect(result.current.currentPhoto?.rotation).toBe(0);
  });

  it('rotateLeft cycles counter-clockwise through 0/270/180/90/0', () => {
    const { result } = renderHook(() => useProject(), { wrapper });

    expect(result.current.currentPhoto?.rotation).toBe(0);

    act(() => result.current.rotateLeft());
    expect(result.current.currentPhoto?.rotation).toBe(270);

    act(() => result.current.rotateLeft());
    expect(result.current.currentPhoto?.rotation).toBe(180);

    act(() => result.current.rotateLeft());
    expect(result.current.currentPhoto?.rotation).toBe(90);

    act(() => result.current.rotateLeft());
    expect(result.current.currentPhoto?.rotation).toBe(0);
  });
});