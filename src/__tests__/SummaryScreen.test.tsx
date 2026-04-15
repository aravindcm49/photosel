import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SummaryScreen } from '../screens/SummaryScreen';
import type { Project } from '../types';

vi.mock('../lib/export', () => ({
  exportProject: vi.fn(),
  generateSelectedContent: vi.fn(() => 'selected-content'),
  generateSelectedWithTagsContent: vi.fn(() => 'selected-with-tags-content'),
  generateSkippedContent: vi.fn(() => 'skipped-content'),
  downloadFile: vi.fn(),
}));

vi.mock('../lib/image-utils', () => ({
  countReviewed: vi.fn(),
}));

import { downloadFile } from '../lib/export';
const mockDownloadFile = vi.mocked(downloadFile);

const projectWithBoth: Project = {
  folderName: 'Wedding2023',
  totalPhotos: 5,
  reviewedCount: 5,
  createdAt: Date.now(),
  updatedAt: Date.now(),
  photos: {
    'a.jpg': { filename: 'a.jpg', status: 'selected', people: ['Alice'], timestamp: Date.now(), rotation: 0 },
    'b.jpg': { filename: 'b.jpg', status: 'skipped', people: [], timestamp: Date.now(), rotation: 0 },
    'c.jpg': { filename: 'c.jpg', status: 'selected', people: ['Bob', 'Charlie'], timestamp: Date.now(), rotation: 0 },
    'd.jpg': { filename: 'd.jpg', status: 'skipped', people: [], timestamp: Date.now(), rotation: 0 },
    'e.jpg': { filename: 'e.jpg', status: 'selected', people: [], timestamp: Date.now(), rotation: 0 },
  },
};

const projectAllSkipped: Project = {
  folderName: 'AllSkipped',
  totalPhotos: 3,
  reviewedCount: 3,
  createdAt: Date.now(),
  updatedAt: Date.now(),
  photos: {
    'a.jpg': { filename: 'a.jpg', status: 'skipped', people: [], timestamp: Date.now(), rotation: 0 },
    'b.jpg': { filename: 'b.jpg', status: 'skipped', people: [], timestamp: Date.now(), rotation: 0 },
    'c.jpg': { filename: 'c.jpg', status: 'skipped', people: [], timestamp: Date.now(), rotation: 0 },
  },
};

const projectAllSelected: Project = {
  folderName: 'AllSelected',
  totalPhotos: 2,
  reviewedCount: 2,
  createdAt: Date.now(),
  updatedAt: Date.now(),
  photos: {
    'a.jpg': { filename: 'a.jpg', status: 'selected', people: [], timestamp: Date.now(), rotation: 0 },
    'b.jpg': { filename: 'b.jpg', status: 'selected', people: [], timestamp: Date.now(), rotation: 0 },
  },
};

describe('SummaryScreen', () => {
  it('shows folder name and review counts', () => {
    render(<SummaryScreen project={projectWithBoth} onBackToHome={vi.fn()} />);
    expect(screen.getByText('Wedding2023')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument(); // selected
    expect(screen.getByText('2')).toBeInTheDocument(); // skipped
  });

  it('mutes selected count when zero', () => {
    render(<SummaryScreen project={projectAllSkipped} onBackToHome={vi.fn()} />);
    const zeroSelected = screen.getByText('0');
    expect(zeroSelected).toHaveClass('text-muted-foreground');
  });

  it('mutes skipped count when zero', () => {
    render(<SummaryScreen project={projectAllSelected} onBackToHome={vi.fn()} />);
    const zeroSkipped = screen.getByText('0');
    expect(zeroSkipped).toHaveClass('text-muted-foreground');
  });

  it('downloads selected file when Download Selected clicked', async () => {
    const user = userEvent.setup();
    render(<SummaryScreen project={projectWithBoth} onBackToHome={vi.fn()} />);
    await user.click(screen.getByText('Download Selected'));
    expect(mockDownloadFile).toHaveBeenCalledWith('selected-content', 'Selected.txt');
  });

  it('downloads selected with map when Download Selected with Map clicked', async () => {
    const user = userEvent.setup();
    render(<SummaryScreen project={projectWithBoth} onBackToHome={vi.fn()} />);
    await user.click(screen.getByText('Download with Tags'));
    expect(mockDownloadFile).toHaveBeenCalledWith('selected-with-tags-content', 'Selected-with-people.txt');
  });

  it('downloads skipped file when Download Skipped clicked', async () => {
    const user = userEvent.setup();
    render(<SummaryScreen project={projectWithBoth} onBackToHome={vi.fn()} />);
    await user.click(screen.getByText('Download Skipped'));
    expect(mockDownloadFile).toHaveBeenCalledWith('skipped-content', 'Skipped.txt');
  });

  it('downloads both files when Download Both clicked', async () => {
    mockDownloadFile.mockClear();
    const user = userEvent.setup();
    render(<SummaryScreen project={projectWithBoth} onBackToHome={vi.fn()} />);
    await user.click(screen.getByText('Download Both'));
    expect(mockDownloadFile).toHaveBeenCalledTimes(2);
    expect(mockDownloadFile).toHaveBeenCalledWith('selected-content', 'Selected.txt');
    expect(mockDownloadFile).toHaveBeenCalledWith('skipped-content', 'Skipped.txt');
  });

  it('calls onBackToHome when Back to Home clicked', async () => {
    const onBackToHome = vi.fn();
    const user = userEvent.setup();
    render(<SummaryScreen project={projectWithBoth} onBackToHome={onBackToHome} />);
    await user.click(screen.getByRole('button', { name: /back to home/i }));
    expect(onBackToHome).toHaveBeenCalled();
  });
});