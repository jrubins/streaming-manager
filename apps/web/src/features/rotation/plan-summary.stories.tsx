import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, within } from 'storybook/test';
import { PlanSummary } from './plan-summary';

const meta = {
  title: 'Plan/PlanSummary',
  component: PlanSummary,
  args: {
    currentCostCents: 4747,
    plannedCostCents: 3098,
    unpricedCount: 0,
    activeCount: 3,
    plannedCount: 2,
  },
} satisfies Meta<typeof PlanSummary>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Saving: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('$16.49/mo')).toBeInTheDocument();
    await expect(canvas.getByText('$197.88 a year')).toBeInTheDocument();
  },
};

/** Catching up on the list needs a service resumed. */
export const CostsMore: Story = {
  args: { currentCostCents: 1999, plannedCostCents: 3098, plannedCount: 2, activeCount: 1 },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByText('Extra this month')).toBeInTheDocument();
  },
};

export const WithUnpricedServices: Story = { args: { unpricedCount: 2 } };
