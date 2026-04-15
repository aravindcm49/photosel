import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PeopleBadges } from '../components/PeopleBadges';

describe('PeopleBadges', () => {
  it('renders nothing when no people', () => {
    const { container } = render(<PeopleBadges people={[]} />);
    expect(container.innerHTML).toBe('');
  });

  it('renders people names as badges', () => {
    render(<PeopleBadges people={['Alice', 'Bob']} />);
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
  });

  it('shows remove buttons when onRemove is provided', () => {
    render(<PeopleBadges people={['Alice', 'Bob']} onRemove={vi.fn()} />);
    expect(screen.getByLabelText('Remove Alice')).toBeInTheDocument();
    expect(screen.getByLabelText('Remove Bob')).toBeInTheDocument();
  });

  it('does not show remove buttons when onRemove is not provided', () => {
    render(<PeopleBadges people={['Alice', 'Bob']} />);
    expect(screen.queryByLabelText('Remove Alice')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Remove Bob')).not.toBeInTheDocument();
  });

  it('calls onRemove with correct index when remove button clicked', async () => {
    const onRemove = vi.fn();
    const user = userEvent.setup();
    render(<PeopleBadges people={['Alice', 'Bob', 'Charlie']} onRemove={onRemove} />);
    
    await user.click(screen.getByLabelText('Remove Bob'));
    expect(onRemove).toHaveBeenCalledWith(1);
  });
});