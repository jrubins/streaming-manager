import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import { PROVIDERS, SERVICES } from '@/test/story-data';
import { ServicesTable } from './services-table';

const meta = {
  title: 'Services/ServicesTable',
  component: ServicesTable,
  args: {
    services: [SERVICES.netflix, SERVICES.hulu, SERVICES.starz],
    plansFor: (key: string) => PROVIDERS.find((p) => p.key === key)?.plans ?? [],
    onChange: fn(),
    onRemove: fn(),
  },
} satisfies Meta<typeof ServicesTable>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await userEvent.click(
      within(canvas.getByRole('group', { name: 'Hulu status' })).getByRole('button', {
        name: 'Paused',
      }),
    );
    await expect(args.onChange).toHaveBeenCalledWith(expect.objectContaining({ name: 'Hulu' }), {
      status: 'paused',
    });

    const price = canvas.getByLabelText('Starz monthly price');
    await userEvent.type(price, '10.99{Enter}');
    await expect(args.onChange).toHaveBeenCalledWith(expect.objectContaining({ name: 'Starz' }), {
      monthlyPriceCents: 1099,
    });
  },
};

export const Remove: Story = {
  play: async ({ canvasElement, args }) => {
    await userEvent.click(within(canvasElement).getByRole('button', { name: 'Netflix actions' }));
    const body = within(canvasElement.ownerDocument.body);
    await expect(
      await body.findByRole('menuitem', { name: 'Manage on netflix.com' }),
    ).toBeInTheDocument();
    await userEvent.click(body.getByRole('menuitem', { name: 'Remove Netflix' }));
    await expect(args.onRemove).toHaveBeenCalledWith(expect.objectContaining({ name: 'Netflix' }));
  },
};
