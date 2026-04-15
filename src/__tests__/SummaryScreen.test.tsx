import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SummaryScreen } from '../screens/SummaryScreen';
import type { Project } from '../types';

vi.mock('../lib/export', () => ({
  exportProject: vi.fn(),
  generateSelectedContent: vi.fn(),
  generateSkippedContent: vi.fn(),
  downloadFile: vi.fn(),
}));

vi.mock('../lib/image-utils', () => ({
  countReviewed: vi.fn(),
}));

import { exportProject } from '../lib/export';

const mockExportProject = vi.mocked(exportProject);

const projectWithBoth: Project = {
  folderName: 'Wedding2023',
  totalPhotos: 5,
  reviewedCount: 5,
  createdAt: Date.now(),
  updatedAt: Date.now(),
  photos: {
    'a.jpg': { filename: 'a.jpg', status: 'selected', people: [], timestamp: Date.now(), rotation: 0 },
    'b.jpg': { filename: 'b.jpg', status: 'skipped', people: [], timestamp: Date.now(), rotation: 0 },
    'c.jpg': { filename: 'c.jpg', status: 'selected', people: [], timestamp: Date.now(), rotation: 0 },
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

  it('calls exportProject when export button clicked', async () => {
    const user = userEvent.setup();
    render(<SummaryScreen project={projectWithBoth} onBackToHome={vi.fn()} />);
    await user.click(screen.getByText('Export Selected.txt & Skipped.txt'));
    expect(mockExportProject).toHaveBeenCalledWith(projectWithBoth);
  });

  it('calls onBackToHome when Back to Home clicked', async () => {
    const onBackToHome = vi.fn();
    const user = userEvent.setup();
    render(<SummaryScreen project={projectWithBoth} onBackToHome={onBackToHome} />);
    await user.click(screen.getByText('Back to Home'));
    expect(onBackToHome).toHaveBeenCalled();
  });
});