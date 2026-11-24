import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ItemForm } from './item-form';

describe('ItemForm', () => {
  it('submits the trimmed name and clears the field', async () => {
    const onSubmit = vi.fn(async () => {});
    render(<ItemForm onSubmit={onSubmit} />);

    const input = screen.getByLabelText('Name');
    await userEvent.type(input, '  Squat  ');
    await userEvent.click(screen.getByRole('button', { name: 'Add' }));

    expect(onSubmit).toHaveBeenCalledWith({ name: 'Squat' });
    expect(input).toHaveValue('');
  });

  it('shows a validation error and does not submit an empty name', async () => {
    const onSubmit = vi.fn(async () => {});
    render(<ItemForm onSubmit={onSubmit} />);

    await userEvent.click(screen.getByRole('button', { name: 'Add' }));

    expect(await screen.findByText('Name is required')).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });
});
