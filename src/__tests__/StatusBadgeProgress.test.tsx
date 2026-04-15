import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StatusBadge } from '../components/StatusBadge';
import { ProgressIndicator } from '../components/ProgressIndicator';
import { ProjectProvider, useProject } from '../context/ProjectContext';
import type { Project } from '../types';

vi.mock('../lib/db', () => ({
  saveProject: vi.fn(),
}));

vi.mock('../lib/image-utils', () => ({
  countReviewed: vi.fn((photos: Record<string, { status: string | null }>) => {
    return Object.values(photos).filter((p) => p.status !== null).length;
  }),
}));

const selectedProject: Project = {
  folderName: 'Test',
  totalPhotos: 1,
  reviewedCount: 1,
  createdAt: Date.now(),
  updatedAt: Date.now(),
  photos: {
    'a.jpg': { filename: 'a.jpg', status: 'selected', people: [], timestamp: Date.now(), rotation: 0 },
  },
};

const skippedProject: Project = {
  folderName: 'Test',
  totalPhotos: 1,
  reviewedCount: 1,
  createdAt: Date.now(),
  updatedAt: Date.now(),
  photos: {
    'a.jpg': { filename: 'a.jpg', status: 'skipped', people: [], timestamp: Date.now(), rotation: 0 },
  },
};

const undecidedProject: Project = {
  folderName: 'Test',
  totalPhotos: 1,
  reviewedCount: 0,
  createdAt: Date.now(),
  updatedAt: Date.now(),
  photos: {
    'a.jpg': { filename: 'a.jpg', status: null, people: [], timestamp: Date.now(), rotation: 0 },
  },
};

describe('StatusBadge', () => {
  beforeEach(() => vi.clearAllMocks());

  it('shows green check for selected photos', () => {
    render(
      <ProjectProvider initialProject={selectedProject} dirHandle={null}>
        <StatusBadge />
      </ProjectProvider>
    );
    expect(screen.getByText('Selected')).toBeInTheDocument();
  });

  it('shows red X for skipped photos', () => {
    render(
      <ProjectProvider initialProject={skippedProject} dirHandle={null}>
        <StatusBadge />
      </ProjectProvider>
    );
    expect(screen.getByText('Skipped')).toBeInTheDocument();
  });

  it('renders nothing for undecided photos', () => {
    const { container } = render(
      <ProjectProvider initialProject={undecidedProject} dirHandle={null}>
        <StatusBadge />
      </ProjectProvider>
    );
    expect(container.innerHTML).toBe('');
  });
});

describe('ProgressIndicator', () => {
  beforeEach(() => vi.clearAllMocks());

  it('shows reviewed count out of total', () => {
    render(
      <ProjectProvider initialProject={selectedProject} dirHandle={null}>
        <ProgressIndicator />
      </ProjectProvider>
    );
    expect(screen.getByText('1/1 reviewed')).toBeInTheDocument();
  });
});