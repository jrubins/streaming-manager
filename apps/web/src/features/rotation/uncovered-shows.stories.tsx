import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, within } from 'storybook/test';
import { SHOWS, storyShow } from '@/test/story-data';
import { UncoveredShows } from './uncovered-shows';

const meta = {
  title: 'Plan/UncoveredShows',
  component: UncoveredShows,
  args: {
    shows: [SHOWS.meridian, storyShow({ id: 9, title: 'Paper Lanterns', providerKeys: [] })],
    providerName: (key: string) => (key === 'starz' ? 'Starz' : key),
  },
} satisfies Meta<typeof UncoveredShows>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('Streams on Starz')).toBeInTheDocument();
    await expect(canvas.getByText('Not streaming anywhere right now')).toBeInTheDocument();
  },
};
