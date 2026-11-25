import type { Channel } from '@app/shared';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import { ChannelPicker } from './channel-picker';

const channel = (
  key: string,
  name: string,
  category: Channel['category'],
  starter = false,
): Channel => ({
  key,
  name,
  category,
  local: category === 'local',
  starter,
  carriers: ['youtube-tv'],
});

const meta = {
  title: 'Channels/ChannelPicker',
  component: ChannelPicker,
  args: {
    channels: [
      channel('cbs', 'CBS', 'local', true),
      channel('nbc', 'NBC', 'local', true),
      channel('espn', 'ESPN', 'sports', true),
      channel('fs1', 'FS1', 'sports', true),
      channel('golf-channel', 'Golf Channel', 'sports'),
      channel('nfl-sunday-ticket', 'NFL Sunday Ticket', 'leagues'),
      channel('mtv', 'MTV', 'entertainment', true),
    ],
    selected: new Set(['espn']),
    onChange: fn(),
  },
} satisfies Meta<typeof ChannelPicker>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('button', { name: 'ESPN' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await userEvent.click(canvas.getByRole('button', { name: 'MTV' }));
    await expect(args.onChange).toHaveBeenLastCalledWith(['espn', 'mtv']);
    // The usual sports set adds what's missing from it.
    await userEvent.click(canvas.getByRole('button', { name: 'Add the usual sports channels' }));
    await expect(args.onChange).toHaveBeenLastCalledWith(['espn', 'fs1']);
    // League passes have no usual set.
    await expect(
      within(canvas.getByRole('region', { name: 'League passes' })).queryByRole('button', {
        name: /Add/,
      }),
    ).not.toBeInTheDocument();
  },
};
