import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ChipInput } from '../components/ChipInput';
import type { ChipInputRef } from '../components/ChipInput';
import { ConfirmDialog } from '../components/ConfirmDialog';

describe('Uncommitted Input Warning', () => {
  const onChipsChange = vi.fn();
  const globalPeople = ['Alice', 'Bob', 'Charlie'];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('ChipInput ref API', () => {
    it('exposes hasUncommitted as false when input is empty and no chips', () => {
      const ref = { current: null as ChipInputRef | null };
      render(
        <ChipInput
          ref={ref}
          onChipsChange={onChipsChange}
          globalPeople={globalPeople}
        />
      );
      expect(ref.current?.hasUncommitted()).toBe(false);
    });

    it('exposes hasUncommitted as true when input has text', async () => {
      const user = userEvent.setup();
      const ref = { current: null as ChipInputRef | null };
      render(
        <ChipInput
          ref={ref}
          onChipsChange={onChipsChange}
          globalPeople={globalPeople}
        />
      );
      const input = screen.getByPlaceholderText('Type names (comma-separated)...');
      await user.type(input, 'Jo');

      expect(ref.current?.hasUncommitted()).toBe(true);
    });

    it('exposes hasUncommitted as false when chips exist but no text', async () => {
      const user = userEvent.setup();
      const ref = { current: null as ChipInputRef | null };
      render(
        <ChipInput
          ref={ref}
          onChipsChange={onChipsChange}
          globalPeople={globalPeople}
        />
      );
      const input = screen.getByPlaceholderText('Type names (comma-separated)...');
      await user.type(input, 'John{Enter}');

      // Chip exists but no uncommitted text - chips are committed
      expect(ref.current?.hasUncommitted()).toBe(false);
    });

    it('clear() resets input but keeps chips from initialChips', async () => {
      const user = userEvent.setup();
      const ref = { current: null as ChipInputRef | null };
      render(
        <ChipInput
          ref={ref}
          onChipsChange={onChipsChange}
          globalPeople={globalPeople}
          initialChips={['John']}
        />
      );
      const input = screen.getByRole('textbox');
      await user.type(input, 'Jane');

      expect(ref.current?.hasUncommitted()).toBe(true);

      await act(() => {
        ref.current?.clear();
      });

      expect(ref.current?.hasUncommitted()).toBe(false);
      // Initial chips remain since clear only resets input text
      expect(screen.queryByText('John')).toBeInTheDocument();
    });

    it('focus() focuses the input element', async () => {
      const ref = { current: null as ChipInputRef | null };
      render(
        <ChipInput
          ref={ref}
          onChipsChange={onChipsChange}
          globalPeople={globalPeople}
        />
      );
      const input = screen.getByPlaceholderText('Type names (comma-separated)...');

      input.blur();
      expect(input).not.toHaveFocus();

      ref.current?.focus();

      await waitFor(() => {
        expect(input).toHaveFocus();
      });
    });
  });

  describe('Navigation confirmation', () => {
    it('triggers confirmation when navigating with uncommitted text', async () => {
      const user = userEvent.setup();
      const onConfirm = vi.fn();

      const ref = { current: null as ChipInputRef | null };
      render(
        <div>
          <ChipInput
            ref={ref}
            onChipsChange={onChipsChange}
            globalPeople={globalPeople}
          />
          <button
            data-testid="nav-next"
            onClick={() => {
              if (ref.current?.hasUncommitted()) {
                onConfirm();
              }
            }}
          >
            Next
          </button>
        </div>
      );

      const input = screen.getByPlaceholderText('Type names (comma-separated)...');
      await user.type(input, 'Uncommitted');

      await user.click(screen.getByTestId('nav-next'));

      expect(onConfirm).toHaveBeenCalled();
    });

    it('does not trigger confirmation when navigating with empty input and no chips', async () => {
      const user = userEvent.setup();
      const onConfirm = vi.fn();

      const ref = { current: null as ChipInputRef | null };
      render(
        <div>
          <ChipInput
            ref={ref}
            onChipsChange={onChipsChange}
            globalPeople={globalPeople}
          />
          <button
            data-testid="nav-next"
            onClick={() => {
              if (ref.current?.hasUncommitted()) {
                onConfirm();
              }
            }}
          >
            Next
          </button>
        </div>
      );

      await user.click(screen.getByTestId('nav-next'));

      expect(onConfirm).not.toHaveBeenCalled();
    });

    it('does not trigger confirmation when navigating with only chips', async () => {
      const user = userEvent.setup();
      const onConfirm = vi.fn();

      const ref = { current: null as ChipInputRef | null };
      render(
        <div>
          <ChipInput
            ref={ref}
            onChipsChange={onChipsChange}
            globalPeople={globalPeople}
          />
          <button
            data-testid="nav-next"
            onClick={() => {
              if (ref.current?.hasUncommitted()) {
                onConfirm();
              }
            }}
          >
            Next
          </button>
        </div>
      );

      const input = screen.getByPlaceholderText('Type names (comma-separated)...');
      await user.type(input, 'John{Enter}');

      await user.click(screen.getByTestId('nav-next'));

      // Chips are committed, no uncommitted text
      expect(onConfirm).not.toHaveBeenCalled();
    });
  });

  describe('ConfirmDialog', () => {
    it('renders confirmation message and buttons', () => {
      const onConfirm = vi.fn();
      const onCancel = vi.fn();

      render(
        <ConfirmDialog
          message="You have uncommitted tags. Discard?"
          onConfirm={onConfirm}
          onCancel={onCancel}
        />
      );

      expect(screen.getByText('You have uncommitted tags. Discard?')).toBeInTheDocument();
      expect(screen.getByText('Yes')).toBeInTheDocument();
      expect(screen.getByText('No')).toBeInTheDocument();
    });

    it('calls onConfirm when Yes is clicked', async () => {
      const user = userEvent.setup();
      const onConfirm = vi.fn();
      const onCancel = vi.fn();

      render(
        <ConfirmDialog
          message="You have uncommitted tags. Discard?"
          onConfirm={onConfirm}
          onCancel={onCancel}
        />
      );

      await user.click(screen.getByText('Yes'));
      expect(onConfirm).toHaveBeenCalled();
    });

    it('calls onCancel when No is clicked', async () => {
      const user = userEvent.setup();
      const onConfirm = vi.fn();
      const onCancel = vi.fn();

      render(
        <ConfirmDialog
          message="You have uncommitted tags. Discard?"
          onConfirm={onConfirm}
          onCancel={onCancel}
        />
      );

      await user.click(screen.getByText('No'));
      expect(onCancel).toHaveBeenCalled();
    });
  });
});
