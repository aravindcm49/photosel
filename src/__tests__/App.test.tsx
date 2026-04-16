import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';

// Mock the modules before importing App
vi.mock('../lib/db', () => ({
  getAllProjects: vi.fn().mockResolvedValue([]),
  deleteProject: vi.fn(),
  saveProject: vi.fn(),
  getProject: vi.fn(),
}));

// Mock fetch for API calls
const mockFetch = vi.fn();
global.fetch = mockFetch;

import App from '../App';

describe('App', () => {
  it('renders the app title', async () => {
    render(<App />);
    await waitFor(() => {
      expect(screen.getByText('Photo Selector')).toBeInTheDocument();
    });
  });
});
