import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import { MEMBERS } from '@/test/story-data';
import { HouseholdSettings } from './household-settings';
import { InviteCard } from './invite-card';
import { JoinHouseholdForm } from './join-household-form';
import { MembersList } from './members-list';

const meta = {
  title: 'Household/HouseholdSettings',
  component: HouseholdSettings,
  decorators: [
    (Story) => (
      <div className="max-w-md">
        <Story />
      </div>
    ),
  ],
  args: {
    name: "Alex's household",
    region: 'US',
    regions: [
      { code: 'CA', name: 'Canada' },
      { code: 'US', name: 'United States of America' },
    ],
    onSave: fn(),
  },
} satisfies Meta<typeof HouseholdSettings>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Settings: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const name = canvas.getByLabelText('Name');
    await userEvent.clear(name);
    await userEvent.type(name, 'The Lees');
    await userEvent.click(canvas.getByRole('button', { name: 'Save' }));
    await expect(args.onSave).toHaveBeenCalledWith({ name: 'The Lees' });
  },
};

export const Invite: Story = {
  render: () => <InviteCard inviteCode="SZLYS-X4AD5" onNewCode={fn()} />,
};

export const Members: Story = {
  render: () => <MembersList members={MEMBERS} />,
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByText('(you)')).toBeInTheDocument();
  },
};

export const Join: Story = {
  render: () => <JoinHouseholdForm onSubmit={fn(async () => {})} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Join' }));
    await expect(await canvas.findByText('Invite code is required')).toBeInTheDocument();
  },
};

export const JoinWithError: Story = {
  render: () => (
    <JoinHouseholdForm onSubmit={fn(async () => {})} error="No household has that invite code" />
  ),
};
