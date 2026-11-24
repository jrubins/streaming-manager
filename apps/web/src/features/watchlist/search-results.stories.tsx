import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import { SearchResults } from './search-results';

const meta = {
  title: 'Watchlist/SearchResults',
  component: SearchResults,
  args: {
    results: [
      {
        tmdbId: 1001,
        mediaType: 'tv',
        title: 'The Long Harbor',
        year: 2024,
        posterUrl: null,
        overview: '',
      },
      {
        tmdbId: 1010,
        mediaType: 'tv',
        title: 'Harbor Lights',
        year: 2019,
        posterUrl: null,
        overview: '',
      },
    ],
    added: new Set(['tv:1001']),
    onAdd: fn(),
  },
} satisfies Meta<typeof SearchResults>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('button', { name: 'Added The Long Harbor' })).toBeDisabled();
    await userEvent.click(canvas.getByRole('button', { name: 'Add Harbor Lights' }));
    await expect(args.onAdd).toHaveBeenCalledWith(expect.objectContaining({ tmdbId: 1010 }));
  },
};

export const NoResults: Story = { args: { results: [] } };
