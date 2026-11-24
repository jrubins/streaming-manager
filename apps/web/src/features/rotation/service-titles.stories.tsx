import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';
import { SHOWS, storyShow } from '@/test/story-data';
import { ServiceTitles } from './service-titles';

const many = [
  SHOWS.harbor,
  SHOWS.lights,
  SHOWS.northbound,
  storyShow({ id: 6, title: 'Lantern Season', providerKeys: ['netflix'] }),
  storyShow({ id: 7, title: 'Quarry Road', mediaType: 'movie', providerKeys: ['netflix'] }),
  storyShow({ id: 8, title: 'Paper Lanterns', mediaType: 'movie', providerKeys: ['netflix'] }),
];

const meta = {
  title: 'Plan/ServiceTitles',
  component: ServiceTitles,
  args: {
    serviceName: 'Netflix',
    includes: ['netflix'],
    shows: many,
    providerName: (key: string) => ({ hulu: 'Hulu', peacock: 'Peacock' })[key] ?? key,
  },
} satisfies Meta<typeof ServiceTitles>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Four posters, then "+2"; hovering a poster names it. */
export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const body = within(canvasElement.ownerDocument.body);
    await userEvent.hover(canvas.getByRole('button', { name: 'The Long Harbor' }));
    await expect(await body.findByRole('tooltip')).toHaveTextContent(
      'The Long Harbor · Series · 2025',
    );
  },
};

/** "+2" opens every title, with where else each one streams. */
export const AllTitles: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const body = within(canvasElement.ownerDocument.body);
    await userEvent.click(canvas.getByRole('button', { name: /show all 6 titles on Netflix/ }));
    const dialog = await body.findByRole('dialog', { name: 'Titles on Netflix' });
    await expect(within(dialog).getByText('Quarry Road')).toBeInTheDocument();
    await expect(within(dialog).getByText('Paper Lanterns')).toBeInTheDocument();
    await expect(within(dialog).getByText('Also on Hulu')).toBeInTheDocument();
  },
};

export const Few: Story = { args: { shows: [SHOWS.harbor, SHOWS.lights] } };

export const None: Story = { args: { shows: [] } };
