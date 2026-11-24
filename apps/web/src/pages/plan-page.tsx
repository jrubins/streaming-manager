import type { RotationEntry } from '@app/shared';
import { useQuery, useSuspenseQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { Clapperboard, Tv } from 'lucide-react';
import { PageHeader, SectionHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { PreferencesSummary } from '@/features/preferences/preferences-summary';
import { useUpdatePreferences } from '@/features/preferences/queries';
import { PlanAlternatives } from '@/features/rotation/plan-alternatives';
import { PlanSummary } from '@/features/rotation/plan-summary';
import { rotationQueryOptions } from '@/features/rotation/queries';
import { ServicePlanTable, type ServicePlanRow } from '@/features/rotation/service-plan-table';
import { UncoveredShows } from '@/features/rotation/uncovered-shows';
import {
  providersQueryOptions,
  useCreateService,
  useUpdateService,
} from '@/features/services/queries';

const inPlan = (entry: RotationEntry) =>
  entry.state === 'keep' || entry.state === 'resume' || entry.state === 'subscribe';

/** Names of the planned subscriptions each of an entry's titles is also on. */
function coveredBy(entry: RotationEntry, entries: readonly RotationEntry[]): string[] {
  const planned = entries.filter(inPlan);
  const names = entry.shows.flatMap((show) =>
    planned.filter((p) => p.shows.some((s) => s.id === show.id)).map((p) => p.offering.name),
  );
  return [...new Set(names)];
}

export function PlanPage() {
  const { data: plan } = useSuspenseQuery(rotationQueryOptions);
  const providers = useQuery(providersQueryOptions);
  const updateService = useUpdateService();
  const createService = useCreateService();
  const updatePreferences = useUpdatePreferences();
  const month = new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' });

  const providerName = (key: string) =>
    providers.data?.find((p) => p.key === key)?.name ??
    key.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

  /** Records the change the member made at the service. */
  function markDone(row: ServicePlanRow) {
    const planName = row.planChange && row.plan ? { planName: row.plan.name } : {};
    if (row.state === 'subscribe') {
      createService.mutate({ providerKey: row.offering.key, planName: row.plan?.name });
    } else if (row.service && row.state === 'pause') {
      updateService.mutate({ id: row.service.id, status: 'paused' });
    } else if (row.service && row.state === 'resume') {
      updateService.mutate({ id: row.service.id, status: 'active', ...planName });
    } else if (row.service && row.planChange) {
      updateService.mutate({ id: row.service.id, ...planName });
    }
  }

  if (plan.entries.length === 0 && plan.uncovered.length === 0) {
    return (
      <>
        <PageHeader eyebrow={month} title="This month's plan" />
        <div className="rounded-2xl border border-dashed bg-card p-10 text-center">
          <h2 className="text-xl font-semibold">Let's build your first rotation</h2>
          <p className="mx-auto mt-2 max-w-md text-muted-foreground">
            Add the streaming services you have and the shows you want to watch. We'll work out the
            cheapest way to watch them each month.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Button asChild>
              <Link to="/services">
                <Tv aria-hidden /> Add your services
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/watchlist">
                <Clapperboard aria-hidden /> Build your watchlist
              </Link>
            </Button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader
        eyebrow={month}
        title="This month's plan"
        description="The cheapest set of plans that covers everything left on your watchlist."
      />

      <div className="space-y-3">
        <PlanSummary
          {...plan}
          activeCount={plan.entries.filter((e) => e.service?.status === 'active').length}
          plannedCount={plan.entries.filter(inPlan).length}
        />
        <PreferencesSummary preferences={plan.preferences} />
      </div>

      {plan.entries.length > 0 ? (
        <section aria-labelledby="plan-services" className="mt-12">
          <SectionHeader
            id="plan-services"
            title="Your services this month"
            note="Changes to make come first"
          />
          <ServicePlanTable
            rows={plan.entries.map((entry) => ({
              ...entry,
              coveredBy: coveredBy(entry, plan.entries),
            }))}
            plannedCostCents={plan.plannedCostCents}
            providerName={providerName}
            pending={updateService.isPending || createService.isPending}
            onDone={markDone}
          />
        </section>
      ) : null}

      {plan.alternatives.length > 0 ? (
        <section aria-labelledby="plan-alternatives" className="mt-12">
          <SectionHeader
            id="plan-alternatives"
            title="Other options"
            note="The same list under different preferences"
          />
          <PlanAlternatives
            alternatives={plan.alternatives}
            uncoveredCount={plan.uncovered.length}
            pending={updatePreferences.isPending}
            onChoose={(preferences) => updatePreferences.mutate(preferences)}
          />
        </section>
      ) : null}

      {plan.uncovered.length > 0 ? (
        <section aria-labelledby="plan-uncovered" className="mt-12">
          <SectionHeader
            id="plan-uncovered"
            title="Not covered"
            note="No plan that meets your preferences carries them"
          />
          <UncoveredShows shows={plan.uncovered} providerName={providerName} />
        </section>
      ) : null}
    </>
  );
}
