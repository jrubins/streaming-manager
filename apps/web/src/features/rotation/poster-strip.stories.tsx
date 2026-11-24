import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, within } from 'storybook/test';
import { SHOWS } from '@/test/story-data';
import { PosterStrip } from './poster-strip';
import { ServiceLogo } from './service-logo';

const all = Object.values(SHOWS);

const meta = {
  title: 'Plan/PosterStrip',
  component: PosterStrip,
  args: { shows: all.slice(0, 3) },
} satisfies Meta<typeof PosterStrip>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Overflow: Story = {
  args: { shows: all, max: 3 },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByText('+2')).toBeInTheDocument();
  },
};

export const Muted: Story = { args: { muted: true } };

/** A service's logo, or its initial when there is none. */
export const Logo: Story = {
  render: () => <ServiceLogo service={{ name: 'Netflix', logoUrl: null }} />,
};
