import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button } from '@/components/ui/button';
import { BrandMark } from './brand-mark';
import { PageHeader } from './page-header';

const meta = {
  title: 'App/PageHeader',
  component: PageHeader,
  args: {
    eyebrow: 'November 2026',
    title: "This month's plan",
    description: 'The fewest, cheapest services that cover everything left on your watchlist.',
  },
} satisfies Meta<typeof PageHeader>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithActions: Story = {
  args: {
    eyebrow: undefined,
    title: 'Services',
    actions: <Button variant="outline">Action</Button>,
  },
};

/** The logo mark shown beside the app name. */
export const Brand: Story = {
  render: () => <BrandMark className="size-10" />,
};
