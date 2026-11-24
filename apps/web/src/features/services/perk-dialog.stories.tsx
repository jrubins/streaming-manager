import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import { PerkDialog } from './perk-dialog';

const meta = {
  title: 'Services/PerkDialog',
  component: PerkDialog,
  args: { serviceName: 'Peacock', perk: null, open: true, onOpenChange: fn(), onSave: fn() },
} satisfies Meta<typeof PerkDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const New: Story = {
  play: async ({ canvasElement, args }) => {
    // The dialog renders in a portal, outside the story's canvas.
    const body = within(canvasElement.ownerDocument.body);
    await userEvent.click(body.getByRole('button', { name: 'Save' }));
    await expect(body.getByText('Say what it comes with, like Xfinity')).toBeInTheDocument();
    await expect(args.onSave).not.toHaveBeenCalled();

    await userEvent.type(body.getByLabelText('Comes with'), 'Xfinity');
    await userEvent.type(body.getByLabelText('Last day (optional)'), '2027-03-01');
    await userEvent.click(body.getByRole('button', { name: 'Save' }));
    await expect(args.onSave).toHaveBeenCalledWith({
      via: 'Xfinity',
      monthlyPriceCents: 0,
      endsOn: '2027-03-01',
    });
  },
};

export const Existing: Story = {
  args: { perk: { via: 'Verizon', monthlyPriceCents: 1000, endsOn: null } },
  play: async ({ canvasElement, args }) => {
    const body = within(canvasElement.ownerDocument.body);
    await expect(body.getByLabelText('You pay ($/month)')).toHaveValue('10.00');
    await userEvent.click(body.getByRole('button', { name: 'Remove perk' }));
    await expect(args.onSave).toHaveBeenCalledWith(null);
  },
};
