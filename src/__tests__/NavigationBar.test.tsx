import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { NavigationBar } from '../components/NavigationBar';
import { ProjectProvider, useProject } from '../context/ProjectContext';
import type { Project } from '../types';
import { useEffect } from 'react';

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

function IndexSetter({ index }: { index: number }) {
  const { setCurrentIndex } = useProject();
  useEffect(() => {
    setCurrentIndex(index);
  }, [index, setCurrentIndex]);
  return <NavigationBar />;
}

function renderNavigationBar(initialIndex = 0) {
  return render(
    <ProjectProvider initialProject={mockProject} dirHandle={null}>
      <IndexSetter index={initialIndex} />
    </ProjectProvider>
  );
}

describe('NavigationBar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders previous and next buttons', () => {
    renderNavigationBar();
    expect(screen.getByLabelText('Previous photo')).toBeInTheDocument();
    expect(screen.getByLabelText('Next photo')).toBeInTheDocument();
  });

  it('shows current position as 1 / totalPhotos', () => {
    renderNavigationBar();
    expect(screen.getByText('1 / 3')).toBeInTheDocument();
  });

  it('disables previous button at first photo', () => {
    renderNavigationBar(0);
    expect(screen.getByLabelText('Previous photo')).toBeDisabled();
  });

  it('disables next button at last photo', () => {
    renderNavigationBar(2);
    expect(screen.getByLabelText('Next photo')).toBeDisabled();
  });
});