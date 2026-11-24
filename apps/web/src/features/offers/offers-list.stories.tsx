import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import { OFFERS, storyService } from '@/test/story-data';
import { OffersList } from './offers-list';

const meta = {
  title: 'Offers/OffersList',
  component: OffersList,
  args: {
    label: 'Offers',
    offers: OFFERS,
    services: [],
    needed: new Set(['netflix']),
    onClaim: fn(),
  },
} satisfies Meta<typeof OffersList>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    // Services on the watchlist come first.
    const items = canvas.getAllByRole('listitem');
    await expect(items[0]).toHaveTextContent('Netflix');
    await expect(items[0]).toHaveTextContent('On your watchlist');
    await expect(canvas.getByText('Free with Xfinity')).toBeInTheDocument();
    // A statement credit can't be claimed as a fixed price.
    await expect(canvas.getByText('Credit with Amex Platinum')).toBeInTheDocument();
    await expect(
      canvas.queryByRole('button', { name: /Peacock with Amex Platinum/ }),
    ).not.toBeInTheDocument();
    await userEvent.click(
      canvas.getByRole('button', { name: /We get this.*Peacock with Xfinity/ }),
    );
    await expect(args.onClaim).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'xfinity-peacock' }),
    );
  },
};

export const AlreadyUsing: Story = {
  args: {
    services: [
      storyService({
        id: 1,
        name: 'Peacock',
        perk: { via: 'Xfinity', monthlyPriceCents: 0, endsOn: null },
      }),
    ],
  },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByText('Using it')).toBeInTheDocument();
  },
};
