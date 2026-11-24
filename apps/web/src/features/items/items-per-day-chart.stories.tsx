import type { Meta, StoryObj } from '@storybook/react-vite';
import { ItemsPerDayChart } from './items-per-day-chart';

const meta = {
  title: 'Items/ItemsPerDayChart',
  component: ItemsPerDayChart,
} satisfies Meta<typeof ItemsPerDayChart>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithData: Story = {
  args: {
    data: [
      { day: '2026-11-16', count: 2 },
      { day: '2026-11-17', count: 5 },
      { day: '2026-11-18', count: 3 },
      { day: '2026-11-19', count: 8 },
      { day: '2026-11-20', count: 6 },
    ],
  },
};

export const Empty: Story = { args: { data: [] } };
