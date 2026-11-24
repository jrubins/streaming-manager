import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import { PROVIDERS, SHOWS } from '@/test/story-data';
import { WatchlistCard } from './watchlist-card';

const meta = {
  title: 'Watchlist/WatchlistCard',
  component: WatchlistCard,
  decorators: [
    (Story) => (
      <div className="w-48">
        <Story />
      </div>
    ),
  ],
  args: {
    show: SHOWS.lights,
    providers: new Map(PROVIDERS.map((p) => [p.key, p])),
    householdKeys: new Set(['netflix']),
    onToggleWatched: fn(),
    onRemove: fn(),
  },
} satisfies Meta<typeof WatchlistCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const OnYourServices: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('On Netflix')).toBeInTheDocument();
    await userEvent.click(canvas.getByRole('button', { name: 'Mark Harbor Lights watched' }));
    await expect(args.onToggleWatched).toHaveBeenCalled();
  },
};

export const NotOnYourServices: Story = {
  args: { show: SHOWS.meridian },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByText('Only on Starz')).toBeInTheDocument();
  },
};

export const Watched: Story = { args: { show: { ...SHOWS.harbor, watched: true } } };
