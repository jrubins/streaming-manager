import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import { PROVIDERS } from '@/test/story-data';
import { ProviderPicker } from './provider-picker';

const meta = {
  title: 'Services/ProviderPicker',
  component: ProviderPicker,
  args: { providers: PROVIDERS, onAdd: fn() },
} satisfies Meta<typeof ProviderPicker>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('from $8.99')).toBeInTheDocument();
    await userEvent.click(canvas.getByRole('button', { name: /^Add Starz/ }));
    await expect(args.onAdd).toHaveBeenCalledWith(expect.objectContaining({ key: 'starz' }));
  },
};

export const AllAdded: Story = { args: { providers: [] } };
