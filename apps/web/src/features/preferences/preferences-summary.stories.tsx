import type { Meta, StoryObj } from '@storybook/react-vite';
import { DEFAULT_PREFERENCES } from '@app/shared';
import { expect, within } from 'storybook/test';
import { RouterDecorator } from '@/test/router-decorator';
import { PreferencesSummary } from './preferences-summary';

const meta = {
  title: 'Preferences/PreferencesSummary',
  component: PreferencesSummary,
  decorators: [RouterDecorator],
  args: { preferences: DEFAULT_PREFERENCES },
} satisfies Meta<typeof PreferencesSummary>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      canvas.getByText('Planned for: Ads OK · 1 screen · HD · new services suggested'),
    ).toBeInTheDocument();
    await expect(canvas.getByRole('link', { name: 'Change preferences' })).toHaveAttribute(
      'href',
      '/preferences',
    );
  },
};
