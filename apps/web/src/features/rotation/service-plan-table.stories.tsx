import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import { PROVIDERS, SERVICES, SHOWS, storyEntry, storyService } from '@/test/story-data';
import { ServicePlanTable } from './service-plan-table';

const plansOf = (key: string) => PROVIDERS.find((p) => p.key === key)?.plans ?? [];
const netflix = storyService({
  id: 1,
  name: 'Netflix',
  providerKey: 'netflix',
  planName: 'Standard',
  monthlyPriceCents: 1999,
  manageUrl: 'https://www.netflix.com/account',
});

const meta = {
  title: 'Plan/ServicePlanTable',
  component: ServicePlanTable,
  args: {
    plannedCostCents: 899 + 2199,
    providerName: (key: string) =>
      ({ netflix: 'Netflix', hulu: 'Hulu', 'disney-plus': 'Disney+', 'espn-plus': 'ESPN Select' })[
        key
      ] ?? key,
    onDone: fn(),
    rows: [
      {
        ...storyEntry({
          key: 'disney-hulu-espn-select',
          state: 'subscribe',
          plan: plansOf('disney-hulu-espn-select')[0] ?? null,
          plannedCostCents: 2199,
          shows: [SHOWS.lights],
        }),
        coveredBy: [],
      },
      {
        ...storyEntry({
          key: 'hulu',
          state: 'pause',
          service: SERVICES.hulu,
          shows: [SHOWS.lights],
        }),
        coveredBy: ['Disney+, Hulu & ESPN Select'],
      },
      {
        ...storyEntry({
          key: 'netflix',
          state: 'keep',
          service: netflix,
          plan: plansOf('netflix')[0] ?? null,
          planChange: true,
          plannedCostCents: 899,
          shows: [SHOWS.harbor, SHOWS.northbound],
        }),
        coveredBy: [],
      },
      {
        ...storyEntry({ key: 'starz', state: 'paused', service: SERVICES.starz }),
        coveredBy: [],
      },
    ],
  },
} satisfies Meta<typeof ServicePlanTable>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const body = within(canvasElement.ownerDocument.body);
    // The table (wide screens); a hidden card list holds the same rows for phones.
    const table = within(canvas.getByRole('table'));
    await expect(table.getByText('Switch plan')).toBeInTheDocument();
    await expect(table.getByText('Same titles for $11.00 less')).toBeInTheDocument();
    await expect(table.getByText('Includes Disney+, Hulu, and ESPN Select')).toBeInTheDocument();

    await userEvent.click(
      canvas.getByRole('button', { name: 'Disney+, Hulu & ESPN Select actions' }),
    );
    await expect(
      await body.findByRole('menuitem', { name: 'Subscribe on disneyplus.com' }),
    ).toHaveAttribute('href', 'https://www.disneyplus.com/account');
    await userEvent.click(body.getByRole('menuitem', { name: 'Mark as subscribed' }));
    await expect(args.onDone).toHaveBeenCalledWith(
      expect.objectContaining({ state: 'subscribe', plannedCostCents: 2199 }),
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
