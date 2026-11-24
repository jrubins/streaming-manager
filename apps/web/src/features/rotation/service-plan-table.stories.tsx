import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import { SERVICES, SHOWS } from '@/test/story-data';
import { ServicePlanTable } from './service-plan-table';

const meta = {
  title: 'Plan/ServicePlanTable',
  component: ServicePlanTable,
  args: {
    plannedCostCents: 3098,
    onDone: fn(),
    rows: [
      { service: SERVICES.max, state: 'resume', shows: [SHOWS.signal], coveredBy: [] },
      { service: SERVICES.hulu, state: 'pause', shows: [SHOWS.lights], coveredBy: ['Netflix'] },
      {
        service: SERVICES.netflix,
        state: 'keep',
        shows: [SHOWS.harbor, SHOWS.lights, SHOWS.northbound],
        coveredBy: [],
      },
      { service: SERVICES.starz, state: 'paused', shows: [], coveredBy: [] },
    ],
  },
} satisfies Meta<typeof ServicePlanTable>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const body = within(canvasElement.ownerDocument.body);
    await expect(canvas.getByText('Its title is also on Netflix')).toBeInTheDocument();

    await userEvent.click(canvas.getByRole('button', { name: 'Hulu actions' }));
    await expect(await body.findByRole('menuitem', { name: 'Pause on hulu.com' })).toHaveAttribute(
      'href',
      'https://www.hulu.com/account',
    );
    await userEvent.click(body.getByRole('menuitem', { name: 'Mark as paused' }));
    await expect(args.onDone).toHaveBeenCalledWith(
      expect.objectContaining({ state: 'pause', service: SERVICES.hulu }),
    );
  },
};

/** A service without a known account page links to a search instead. */
export const UnknownAccountPage: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Starz actions' }));
    await expect(
      await within(canvasElement.ownerDocument.body).findByRole('menuitem', {
        name: 'Find how to manage Starz',
      }),
    ).toBeInTheDocument();
  },
};
