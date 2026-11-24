import type { Meta, StoryObj } from '@storybook/react-vite';
import { DEFAULT_PREFERENCES } from '@app/shared';
import { expect, fn, userEvent, within } from 'storybook/test';
import { PreferencesForm } from './preferences-form';

const meta = {
  title: 'Preferences/PreferencesForm',
  component: PreferencesForm,
  args: { value: DEFAULT_PREFERENCES, onChange: fn() },
} satisfies Meta<typeof PreferencesForm>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const ads = canvas.getByRole('group', { name: 'Ads' });
    await expect(within(ads).getByRole('button', { name: 'Ads are fine' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await userEvent.click(within(ads).getByRole('button', { name: 'No ads' }));
    await expect(args.onChange).toHaveBeenCalledWith({ allowAds: false });
    await userEvent.click(
      within(canvas.getByRole('group', { name: 'Screens at once' })).getByRole('button', {
        name: '4+',
      }),
    );
    await expect(args.onChange).toHaveBeenCalledWith({ minStreams: 4 });
  },
};

export const Demanding: Story = {
  args: {
    value: {
      allowAds: false,
      minStreams: 4,
      require4k: true,
      requireDownloads: true,
      suggestNewServices: false,
    },
  },
};
