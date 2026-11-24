import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, within } from 'storybook/test';
import { storyEntry, storyService } from '@/test/story-data';
import { RouterDecorator } from '@/test/router-decorator';
import { PerksEnding } from './perks-ending';

const meta = {
  title: 'Rotation/PerksEnding',
  component: PerksEnding,
  decorators: [RouterDecorator],
  args: {
    today: '2026-11-24',
    entries: [
      storyEntry({
        key: 'hulu',
        state: 'keep',
        service: storyService({
          id: 1,
          name: 'Hulu',
          providerKey: 'hulu',
          monthlyPriceCents: 1099,
          perk: { via: 'Xfinity', monthlyPriceCents: 0, endsOn: '2026-12-05' },
        }),
      }),
      // Ends later than the warning window: no notice.
      storyEntry({
        key: 'netflix',
        state: 'keep',
        service: storyService({
          id: 2,
          name: 'Netflix',
          perk: { via: 'T-Mobile', monthlyPriceCents: 0, endsOn: '2027-06-01' },
        }),
      }),
    ],
  },
} satisfies Meta<typeof PerksEnding>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText(/from Xfinity ends in 11 days/)).toBeInTheDocument();
    await expect(canvas.getByText(/Then it's \$10\.99\/mo/)).toBeInTheDocument();
    await expect(canvas.queryByText(/T-Mobile/)).not.toBeInTheDocument();
  },
};
