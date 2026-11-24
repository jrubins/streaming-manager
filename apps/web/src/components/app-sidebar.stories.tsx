import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import { SidebarProvider } from '@/components/ui/sidebar';
import { RouterDecorator } from '@/test/router-decorator';
import { AppSidebar } from './app-sidebar';

const meta = {
  title: 'App/AppSidebar',
  component: AppSidebar,
  parameters: { layout: 'fullscreen' },
  decorators: [
    (Story) => (
      <SidebarProvider>
        <Story />
      </SidebarProvider>
    ),
    RouterDecorator,
  ],
  args: {
    user: { id: 'user_1', email: 'alex@example.com', name: 'Alex Lee' },
    householdName: "Alex's household",
    toWatchCount: 6,
    activeServiceCount: 3,
    onSignOut: fn(),
  },
} satisfies Meta<typeof AppSidebar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('link', { name: 'Plan' })).toHaveAttribute(
      'data-status',
      'active',
    );
    await expect(canvas.getByText("Alex's household")).toBeInTheDocument();
    await userEvent.click(canvas.getByRole('button', { name: 'Sign out' }));
    await expect(args.onSignOut).toHaveBeenCalled();
  },
};

/** Before the household's data has loaded: no counts. */
export const Loading: Story = {
  args: { householdName: null, toWatchCount: null, activeServiceCount: null },
};
