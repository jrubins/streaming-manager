import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import { ItemForm } from './item-form';

const meta = {
  title: 'Items/ItemForm',
  component: ItemForm,
  args: { onSubmit: fn(async () => {}) },
} satisfies Meta<typeof ItemForm>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Empty: Story = {};

/** Submitting an empty name shows the shared schema's validation message. */
export const ValidationError: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Add' }));
    await expect(await canvas.findByText('Name is required')).toBeInTheDocument();
    await expect(args.onSubmit).not.toHaveBeenCalled();
  },
};
