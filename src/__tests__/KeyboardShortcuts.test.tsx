import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { ProjectProvider, useProject } from '../context/ProjectContext';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
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

describe('useKeyboardShortcuts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('navigates to next photo on ArrowRight', () => {
    const { result } = renderHook(
      () => {
        useKeyboardShortcuts({ isInputFocused: false });
        return useProject();
      },
      { wrapper }
    );

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }));
    });

    expect(result.current.currentIndex).toBe(1);
  });

  it('navigates to previous photo on ArrowLeft', () => {
    const { result } = renderHook(
      () => {
        useKeyboardShortcuts({ isInputFocused: false });
        return useProject();
      },
      { wrapper }
    );

    // Go to index 1 first
    act(() => {
      result.current.goToNext();
    });

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft' }));
    });

    expect(result.current.currentIndex).toBe(0);
  });

  it('marks photo as skipped on S key and advances', () => {
    const { result } = renderHook(
      () => {
        useKeyboardShortcuts({ isInputFocused: false });
        return useProject();
      },
      { wrapper }
    );

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 's' }));
    });

    // Should have advanced to index 1
    expect(result.current.currentIndex).toBe(1);
    // First photo should be marked as skipped
    expect(result.current.project.photos['a.jpg'].status).toBe('skipped');
  });

  it('marks photo as selected on A key and advances', () => {
    const { result } = renderHook(
      () => {
        useKeyboardShortcuts({ isInputFocused: false });
        return useProject();
      },
      { wrapper }
    );

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'a' }));
    });

    // Should have advanced to index 1
    expect(result.current.currentIndex).toBe(1);
    // First photo should be marked as selected
    expect(result.current.project.photos['a.jpg'].status).toBe('selected');
  });

  it('rotates photo right on Ctrl+K', () => {
    const { result } = renderHook(
      () => {
        useKeyboardShortcuts({ isInputFocused: false });
        return useProject();
      },
      { wrapper }
    );

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true }));
    });

    expect(result.current.currentPhoto?.rotation).toBe(90);
  });

  it('does not rotate on K without Ctrl', () => {
    const { result } = renderHook(
      () => {
        useKeyboardShortcuts({ isInputFocused: false });
        return useProject();
      },
      { wrapper }
    );

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k' }));
    });

    expect(result.current.currentPhoto?.rotation).toBe(0);
  });

  it('rotates photo left on Ctrl+J', () => {
    const { result } = renderHook(
      () => {
        useKeyboardShortcuts({ isInputFocused: false });
        return useProject();
      },
      { wrapper }
    );

    // Set rotation to 90 first
    act(() => {
      result.current.rotateRight();
    });

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'j', ctrlKey: true }));
    });

    expect(result.current.currentPhoto?.rotation).toBe(0);
  });

  it('does not rotate on J without Ctrl', () => {
    const { result } = renderHook(
      () => {
        useKeyboardShortcuts({ isInputFocused: false });
        return useProject();
      },
      { wrapper }
    );

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'j' }));
    });

    expect(result.current.currentPhoto?.rotation).toBe(0);
  });

  it('navigates to next photo on L key', () => {
    const { result } = renderHook(
      () => {
        useKeyboardShortcuts({ isInputFocused: false });
        return useProject();
      },
      { wrapper }
    );

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'l' }));
    });

    expect(result.current.currentIndex).toBe(1);
  });

  it('navigates to previous photo on H key', () => {
    const { result } = renderHook(
      () => {
        useKeyboardShortcuts({ isInputFocused: false });
        return useProject();
      },
      { wrapper }
    );

    // Go to index 1 first
    act(() => {
      result.current.goToNext();
    });

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'h' }));
    });

    expect(result.current.currentIndex).toBe(0);
  });

  it('ignores all shortcuts when input is focused', () => {
    const { result } = renderHook(
      () => {
        useKeyboardShortcuts({ isInputFocused: true });
        return useProject();
      },
      { wrapper }
    );

    // S should be ignored
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 's' }));
    });
    expect(result.current.currentIndex).toBe(0);
    expect(result.current.project.photos['a.jpg'].status).toBeNull();

    // H/L should be ignored
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'l' }));
    });
    expect(result.current.currentIndex).toBe(0);

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'h' }));
    });
    expect(result.current.currentIndex).toBe(0);

    // Ctrl+K rotation should be ignored
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true }));
    });
    expect(result.current.currentPhoto?.rotation).toBe(0);

    // Arrow keys should be ignored
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }));
    });
    expect(result.current.currentIndex).toBe(0);
  });
});