import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ChipInput } from '../components/ChipInput';

describe('ChipInput', () => {
  const onChipsChange = vi.fn();
  const globalPeople = ['Alice', 'Bob', 'Charlie', 'Alice Smith'];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders input field', () => {
    render(<ChipInput onChipsChange={onChipsChange} globalPeople={globalPeople} />);
    expect(screen.getByPlaceholderText('Type names (comma-separated)...')).toBeInTheDocument();
  });

  it('creates chip on Enter key', async () => {
    const user = userEvent.setup();
    render(<ChipInput onChipsChange={onChipsChange} globalPeople={globalPeople} />);
    const input = screen.getByPlaceholderText('Type names (comma-separated)...');

    await user.type(input, 'John{Enter}');

    expect(screen.getByText('John')).toBeInTheDocument();
    expect(onChipsChange).toHaveBeenCalledWith(['John']);
  });

  it('creates chips from comma-separated input', async () => {
    const user = userEvent.setup();
    render(<ChipInput onChipsChange={onChipsChange} globalPeople={globalPeople} />);
    const input = screen.getByPlaceholderText('Type names (comma-separated)...');

    await user.type(input, 'John, Jane, Dad,');

    expect(screen.getByText('John')).toBeInTheDocument();
    expect(screen.getByText('Jane')).toBeInTheDocument();
    expect(screen.getByText('Dad')).toBeInTheDocument();
  });

  it('removes chip on click', async () => {
    const user = userEvent.setup();
    render(<ChipInput onChipsChange={onChipsChange} globalPeople={globalPeople} />);
    const input = screen.getByPlaceholderText('Type names (comma-separated)...');

    await user.type(input, 'Alice{Enter}');

    expect(screen.getByText('Alice')).toBeInTheDocument();

    // Find and click the remove button (the × button)
    const chips = screen.getAllByRole('button');
    await user.click(chips[0]);

    expect(screen.queryByText('Alice')).not.toBeInTheDocument();
  });

  it('shows autocomplete suggestions from global people list', async () => {
    const user = userEvent.setup();
    render(<ChipInput onChipsChange={onChipsChange} globalPeople={globalPeople} />);
    const input = screen.getByPlaceholderText('Type names (comma-separated)...');

    await user.type(input, 'Al');

    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Alice Smith')).toBeInTheDocument();
  });

  it('selects autocomplete suggestion on Enter', async () => {
    const user = userEvent.setup();
    render(<ChipInput onChipsChange={onChipsChange} globalPeople={globalPeople} />);
    const input = screen.getByPlaceholderText('Type names (comma-separated)...');

    await user.type(input, 'Al');
    await user.type(input, '{ArrowDown}');
    await user.type(input, '{Enter}');

    expect(onChipsChange).toHaveBeenCalledWith(['Alice']);
  });

  it('removes last chip on backspace with empty input', async () => {
    const user = userEvent.setup();
    render(<ChipInput onChipsChange={onChipsChange} globalPeople={globalPeople} />);
    const input = screen.getByPlaceholderText('Type names (comma-separated)...');

    await user.type(input, 'John{Enter}');
    expect(screen.getByText('John')).toBeInTheDocument();

    await user.type(input, '{Backspace}');
    expect(screen.queryByText('John')).not.toBeInTheDocument();
  });

  it('does not add duplicate chips', async () => {
    const user = userEvent.setup();
    render(<ChipInput onChipsChange={onChipsChange} globalPeople={globalPeople} />);
    const input = screen.getByPlaceholderText('Type names (comma-separated)...');

    await user.type(input, 'Alice{Enter}');
    await user.type(input, 'Alice{Enter}');

    const aliceElements = screen.getAllByText('Alice');
    expect(aliceElements).toHaveLength(1);
  });
});