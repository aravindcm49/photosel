import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HomeScreen } from '../screens/HomeScreen';

// Mock the IndexedDB module
vi.mock('../lib/db', () => ({
  getAllProjects: vi.fn(),
  deleteProject: vi.fn(),
  saveProject: vi.fn(),
  getProject: vi.fn(),
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

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

import { getAllProjects, deleteProject, getProject, saveProject } from '../lib/db';
import { countReviewed } from '../lib/image-utils';
import { toast } from 'sonner';

const mockToastError = vi.mocked(toast.error);

const mockGetAllProjects = vi.mocked(getAllProjects);
const mockDeleteProject = vi.mocked(deleteProject);
const mockGetProject = vi.mocked(getProject);
const mockSaveProject = vi.mocked(saveProject);
const mockCountReviewed = vi.mocked(countReviewed);

describe('HomeScreen', () => {
  const mockOnOpenProject = vi.fn();
  const mockOnResumeProject = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockGetAllProjects.mockResolvedValue([]);
  });

  it('shows empty state with text input when no projects exist', async () => {
    render(
      <HomeScreen
        onOpenProject={mockOnOpenProject}
        onResumeProject={mockOnResumeProject}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('No projects yet')).toBeInTheDocument();
    });
    expect(screen.getByPlaceholderText('/path/to/photos')).toBeInTheDocument();
    expect(screen.getByText('Open')).toBeInTheDocument();
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

  it('calls onOpenProject when valid folder path is submitted', async () => {
    const user = userEvent.setup();
    mockSaveProject.mockResolvedValue(undefined);
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        folderName: 'TestFolder-abc12345',
        images: [
          { name: 'photo1.jpg', width: 4000, height: 3000, size: 5000000 },
        ],
        aspectRatio: 4 / 3,
      }),
    });

    render(
      <HomeScreen
        onOpenProject={mockOnOpenProject}
        onResumeProject={mockOnResumeProject}
      />
    );

    await waitFor(() => {
      expect(screen.getByPlaceholderText('/path/to/photos')).toBeInTheDocument();
    });

    const input = screen.getByPlaceholderText('/path/to/photos');
    await user.type(input, '/home/user/photos');
    await user.click(screen.getByText('Open'));

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/folder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: '/home/user/photos' }),
      });
    });
    expect(mockSaveProject).toHaveBeenCalled();
    expect(mockOnOpenProject).toHaveBeenCalledWith(
      expect.objectContaining({
        folderName: 'TestFolder-abc12345',
        totalPhotos: 1,
        aspectRatio: 4 / 3,
      })
    );
  });

  it('shows error when path does not exist', async () => {
    const user = userEvent.setup();
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: async () => ({ error: 'Path does not exist: /bad/path' }),
    });

    render(
      <HomeScreen
        onOpenProject={mockOnOpenProject}
        onResumeProject={mockOnResumeProject}
      />
    );

    await waitFor(() => {
      expect(screen.getByPlaceholderText('/path/to/photos')).toBeInTheDocument();
    });

    const input = screen.getByPlaceholderText('/path/to/photos');
    await user.type(input, '/bad/path');
    await user.click(screen.getByText('Open'));

    await waitFor(() => {
      expect(mockToastError).toHaveBeenCalledWith('Path does not exist: /bad/path');
    });
    expect(mockOnOpenProject).not.toHaveBeenCalled();
  });

  it('shows error when no supported images in folder', async () => {
    const user = userEvent.setup();
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
      json: async () => ({ error: 'No supported images found in the specified folder' }),
    });

    render(
      <HomeScreen
        onOpenProject={mockOnOpenProject}
        onResumeProject={mockOnResumeProject}
      />
    );

    await waitFor(() => {
      expect(screen.getByPlaceholderText('/path/to/photos')).toBeInTheDocument();
    });

    const input = screen.getByPlaceholderText('/path/to/photos');
    await user.type(input, '/home/user/empty');
    await user.click(screen.getByText('Open'));

    await waitFor(() => {
      expect(mockToastError).toHaveBeenCalledWith('No supported images found in the specified folder');
    });
    expect(mockOnOpenProject).not.toHaveBeenCalled();
  });

  it('shows error when resume fails due to invalid stored folderPath', async () => {
    const user = userEvent.setup();
    const project = {
      folderName: 'Wedding2023',
      folderPath: '/home/user/moved-folder',
      totalPhotos: 10,
      reviewedCount: 5,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      photos: {},
    };
    mockCountReviewed.mockReturnValue(5);
    mockGetAllProjects.mockResolvedValue([project]);
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: async () => ({ error: 'Path does not exist: /home/user/moved-folder' }),
    });

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

    await waitFor(() => {
      expect(mockToastError).toHaveBeenCalledWith('Path does not exist: /home/user/moved-folder');
    });
    expect(mockOnResumeProject).not.toHaveBeenCalled();
    expect(screen.getByPlaceholderText('/path/to/photos')).toBeInTheDocument();
  });

  it('shows error when resuming project without stored folderPath', async () => {
    const user = userEvent.setup();
    const project = {
      folderName: 'OldProject',
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
      expect(screen.getByText('OldProject')).toBeInTheDocument();
    });

    const resumeButton = screen.getByLabelText('Resume OldProject');
    await user.click(resumeButton);

    await waitFor(() => {
      expect(mockToastError).toHaveBeenCalledWith('No folder path stored for this project. Please enter the folder path below.');
    });
    expect(mockOnResumeProject).not.toHaveBeenCalled();
    expect(screen.getByPlaceholderText('/path/to/photos')).toBeInTheDocument();
  });

  it('saves folderPath in project when opening a new folder', async () => {
    const user = userEvent.setup();
    mockSaveProject.mockResolvedValue(undefined);
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        folderName: 'MyPhotos',
        images: [{ name: 'photo1.jpg', width: 4000, height: 3000, size: 5000000 }],
        aspectRatio: 4 / 3,
      }),
    });

    render(
      <HomeScreen
        onOpenProject={mockOnOpenProject}
        onResumeProject={mockOnResumeProject}
      />
    );

    await waitFor(() => {
      expect(screen.getByPlaceholderText('/path/to/photos')).toBeInTheDocument();
    });

    const input = screen.getByPlaceholderText('/path/to/photos');
    await user.type(input, '/home/user/myphotos');
    await user.click(screen.getByText('Open'));

    await waitFor(() => {
      expect(mockSaveProject).toHaveBeenCalledWith(
        expect.objectContaining({ folderPath: '/home/user/myphotos' })
      );
    });
  });

  it('calls onResumeProject when resume button is clicked', async () => {
    const user = userEvent.setup();
    const project = {
      folderName: 'Wedding2023',
      folderPath: '/home/user/wedding2023',
      totalPhotos: 10,
      reviewedCount: 5,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      photos: {},
    };
    mockCountReviewed.mockReturnValue(5);
    mockGetAllProjects.mockResolvedValue([project]);
    mockGetProject.mockResolvedValue(project);
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        folderName: 'Wedding2023',
        images: [{ name: 'photo1.jpg', width: 4000, height: 3000, size: 5000000 }],
        aspectRatio: 4 / 3,
      }),
    });

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

    await waitFor(() => {
      expect(mockOnResumeProject).toHaveBeenCalledWith(
        expect.objectContaining({ folderName: 'Wedding2023' })
      );
    });
  });
});
