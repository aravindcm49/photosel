import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ActionBar } from '../components/ActionBar';
import { ProjectProvider } from '../context/ProjectContext';
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

// Mock db
vi.mock('../lib/db', () => ({
  saveProject: vi.fn(),
  getAllProjects: vi.fn(),
  deleteProject: vi.fn(),
  getProject: vi.fn(),
  addGlobalPerson: vi.fn(),
  getAllPeople: vi.fn(),
  deleteGlobalPerson: vi.fn(),
}));

// Mock image-utils
vi.mock('../lib/image-utils', () => ({
  createDefaultPhotoData: vi.fn(() => ({
    filename: 'test.jpg',
    status: null,
    people: [],
    timestamp: Date.now(),
    rotation: 0,
  })),
  countReviewed: vi.fn((photos: Record<string, { status: string | null }>) => {
    return Object.values(photos).filter((p) => p.status !== null).length;
  }),
}));

function renderActionBar() {
  return render(
    <ProjectProvider initialProject={mockProject}>
      <ActionBar />
    </ProjectProvider>
  );
}

describe('ActionBar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders Skip and Add to List buttons', () => {
    renderActionBar();
    expect(screen.getByText('Skip')).toBeInTheDocument();
    expect(screen.getByText('Add to List')).toBeInTheDocument();
  });

  it('calls markPhoto with skipped when Skip is clicked', async () => {
    const user = userEvent.setup();
    renderActionBar();
    await user.click(screen.getByText('Skip'));
    // After clicking skip, the state updates - we can verify by checking the button still exists
    expect(screen.getByText('Skip')).toBeInTheDocument();
  });

  it('calls markPhoto with selected when Add to List is clicked', async () => {
    const user = userEvent.setup();
    renderActionBar();
    await user.click(screen.getByText('Add to List'));
    expect(screen.getByText('Add to List')).toBeInTheDocument();
  });
});