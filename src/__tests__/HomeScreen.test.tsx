import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HomeScreen } from '../screens/HomeScreen';

// Mock the IndexedDB module
vi.mock('../lib/db', () => ({
  getAllProjects: vi.fn(),
  deleteProject: vi.fn(),
  saveProject: vi.fn(),
}));

// Mock file-system module
vi.mock('../lib/file-system', () => ({
  getDirectoryHandle: vi.fn(),
  getImageFilesFromDirectory: vi.fn(),
  analyzeAspectRatio: vi.fn(),
  getSupportedExtensions: vi.fn(() => ['.jpg', '.jpeg', '.png', '.webp', '.gif']),
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
  countReviewed: vi.fn((photos: Record<string, unknown>) => {
    return Object.values(photos).filter((p: any) => p.status !== null).length;
  }),
}));

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

import { getAllProjects, deleteProject } from '../lib/db';
import { getDirectoryHandle, getImageFilesFromDirectory, analyzeAspectRatio } from '../lib/file-system';
import { countReviewed } from '../lib/image-utils';
import { toast } from 'sonner';

const mockToastError = vi.mocked(toast.error);

const mockGetAllProjects = vi.mocked(getAllProjects);
const mockDeleteProject = vi.mocked(deleteProject);
const mockGetDirectoryHandle = vi.mocked(getDirectoryHandle);
const mockGetImageFilesFromDirectory = vi.mocked(getImageFilesFromDirectory);
const mockAnalyzeAspectRatio = vi.mocked(analyzeAspectRatio);
const mockCountReviewed = vi.mocked(countReviewed);

describe('HomeScreen', () => {
  const mockOnOpenProject = vi.fn();
  const mockOnResumeProject = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockGetAllProjects.mockResolvedValue([]);
  });

  it('shows empty state when no projects exist', async () => {
    render(
      <HomeScreen
        onOpenProject={mockOnOpenProject}
        onResumeProject={mockOnResumeProject}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('No projects yet')).toBeInTheDocument();
    });
    expect(screen.getByText('Open Folder')).toBeInTheDocument();
  });

  it('renders project cards from IndexedDB', async () => {
    mockCountReviewed.mockReturnValue(42);
    mockGetAllProjects.mockResolvedValue([
      {
        folderName: 'Wedding2023',
        totalPhotos: 156,
        reviewedCount: 42,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        photos: {},
      },
    ]);

    render(
      <HomeScreen
        onOpenProject={mockOnOpenProject}
        onResumeProject={mockOnResumeProject}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Wedding2023')).toBeInTheDocument();
    });
    expect(screen.getByText('42/156 reviewed')).toBeInTheDocument();
  });

  it('calls deleteProject when delete button is clicked', async () => {
    const user = userEvent.setup();
    mockDeleteProject.mockResolvedValue(undefined);

    mockGetAllProjects
      .mockResolvedValueOnce([
        {
          folderName: 'Wedding2023',
          totalPhotos: 10,
          reviewedCount: 5,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          photos: {},
        },
      ])
      .mockResolvedValueOnce([]);

    render(
      <HomeScreen
        onOpenProject={mockOnOpenProject}
        onResumeProject={mockOnResumeProject}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Wedding2023')).toBeInTheDocument();
    });

    const deleteButton = screen.getByLabelText('Delete Wedding2023');
    await user.click(deleteButton);

    expect(mockDeleteProject).toHaveBeenCalledWith('Wedding2023');
  });

  it('calls onOpenProject when folder with images is selected', async () => {
    const user = userEvent.setup();
    const mockDirHandle = { name: 'TestFolder' } as FileSystemDirectoryHandle;
    mockGetDirectoryHandle.mockResolvedValue(mockDirHandle);
    mockGetImageFilesFromDirectory.mockResolvedValue([
      { name: 'photo1.jpg', kind: 'file' } as unknown as FileSystemFileHandle,
    ]);
    mockAnalyzeAspectRatio.mockResolvedValue(0.75);

    render(
      <HomeScreen
        onOpenProject={mockOnOpenProject}
        onResumeProject={mockOnResumeProject}
      />
    );

    // Wait for empty state to render
    await waitFor(() => {
      expect(screen.getByText('No projects yet')).toBeInTheDocument();
    });

    const openButton = screen.getByText('Open Folder');
    await user.click(openButton);

    await waitFor(() => {
      expect(mockOnOpenProject).toHaveBeenCalled();
    });
  });

  it('shows error when no supported images in folder', async () => {
    const user = userEvent.setup();
    const mockDirHandle = { name: 'EmptyFolder' } as FileSystemDirectoryHandle;
    mockGetDirectoryHandle.mockResolvedValue(mockDirHandle);
    mockGetImageFilesFromDirectory.mockResolvedValue([]);

    render(
      <HomeScreen
        onOpenProject={mockOnOpenProject}
        onResumeProject={mockOnResumeProject}
      />
    );

    // Wait for empty state to render
    await waitFor(() => {
      expect(screen.getByText('No projects yet')).toBeInTheDocument();
    });

    const openButton = screen.getByText('Open Folder');
    await user.click(openButton);

    await waitFor(() => {
      expect(mockToastError).toHaveBeenCalledWith(
        expect.stringContaining('No supported images found')
      );
    });
    expect(mockOnOpenProject).not.toHaveBeenCalled();
  });

  it('calls onResumeProject when resume button is clicked', async () => {
    const user = userEvent.setup();
    const project = {
      folderName: 'Wedding2023',
      totalPhotos: 10,
      reviewedCount: 5,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      photos: {},
    };
    mockCountReviewed.mockReturnValue(5);
    mockGetAllProjects.mockResolvedValue([project]);

    render(
      <HomeScreen
        onOpenProject={mockOnOpenProject}
        onResumeProject={mockOnResumeProject}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Wedding2023')).toBeInTheDocument();
    });

    const resumeButton = screen.getByLabelText('Resume Wedding2023');
    await user.click(resumeButton);

    expect(mockOnResumeProject).toHaveBeenCalledWith(
      expect.objectContaining({
        folderName: 'Wedding2023',
      })
    );
  });
});