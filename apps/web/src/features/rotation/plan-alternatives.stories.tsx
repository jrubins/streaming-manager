import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import { PlanAlternatives } from './plan-alternatives';

const meta = {
  title: 'Plan/PlanAlternatives',
  component: PlanAlternatives,
  args: {
    onChoose: fn(),
    uncoveredCount: 0,
    alternatives: [
      {
        id: 'no-ads',
        label: 'No ads',
        changes: 'Netflix: Standard · HBO Max: Standard',
        plannedCostCents: 3848,
        deltaCents: 1850,
        uncoveredCount: 0,
        preferences: { allowAds: false },
      },
      {
        id: 'owned-only',
        label: 'Only services you have',
        changes: 'Hulu: With ads · HBO Max: Basic with ads · without Disney+, Hulu & HBO Max',
        plannedCostCents: 2348,
        deltaCents: 149,
        uncoveredCount: 1,
        preferences: { suggestNewServices: false },
      },
    ],
  },
} satisfies Meta<typeof PlanAlternatives>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('+$18.50/mo')).toBeInTheDocument();
    await expect(canvas.getByText(/covers 1 fewer title or channel/)).toBeInTheDocument();
    await userEvent.click(canvas.getByRole('button', { name: 'Use this option: No ads' }));
    await expect(args.onChoose).toHaveBeenCalledWith({ allowAds: false });
  },
};
