import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import { PROVIDERS } from '@/test/story-data';
import { BundlePicker } from './bundle-picker';

const meta = {
  title: 'Services/BundlePicker',
  component: BundlePicker,
  args: {
    bundles: PROVIDERS.filter((p) => p.kind === 'bundle'),
    onAdd: fn(),
    providerName: (key: string) =>
      ({ 'disney-plus': 'Disney+', hulu: 'Hulu', 'espn-plus': 'ESPN Select' })[key] ?? key,
  },
} satisfies Meta<typeof BundlePicker>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('Disney+, Hulu & ESPN Select')).toBeInTheDocument();
    await expect(canvas.getByText('Includes Disney+, Hulu, and ESPN Select')).toBeInTheDocument();
    await expect(canvas.getByText('$32.99')).toBeInTheDocument();
    await userEvent.click(canvas.getByRole('button', { name: 'Add Disney+, Hulu & ESPN Select' }));
    await expect(args.onAdd).toHaveBeenCalledWith(
      expect.objectContaining({ key: 'disney-hulu-espn-select' }),
    );
  },
};

export const AllAdded: Story = { args: { bundles: [] } };
