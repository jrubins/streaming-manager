import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import { MEMBERSHIPS } from '@/test/story-data';
import { MembershipPicker } from './membership-picker';

const meta = {
  title: 'Offers/MembershipPicker',
  component: MembershipPicker,
  args: { memberships: MEMBERSHIPS, selected: new Set(['xfinity']), onToggle: fn() },
} satisfies Meta<typeof MembershipPicker>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('button', { name: 'Xfinity' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await userEvent.click(
      within(canvas.getByRole('group', { name: 'Memberships' })).getByRole('button', {
        name: 'Walmart+',
      }),
    );
    await expect(args.onToggle).toHaveBeenCalledWith('walmart-plus');
  },
};
