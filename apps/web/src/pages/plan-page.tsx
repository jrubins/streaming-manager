import type { RotationEntry, RotationState } from '@app/shared';
import { useQuery, useSuspenseQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { Clapperboard, Tv } from 'lucide-react';
import { PageHeader, SectionHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { rotationQueryOptions } from '@/features/rotation/queries';
import { SavingsHero } from '@/features/rotation/savings-hero';
import { ServicePlanCard } from '@/features/rotation/service-plan-card';
import { UncoveredShows } from '@/features/rotation/uncovered-shows';
import { providersQueryOptions, useUpdateService } from '@/features/services/queries';

const ORDER: RotationState[] = ['resume', 'pause', 'keep', 'paused'];

/** Names of the planned services each of an entry's titles is also on. */
function coveredBy(entry: RotationEntry, entries: readonly RotationEntry[]): string[] {
  const planned = entries.filter((e) => e.state === 'keep' || e.state === 'resume');
  const names = entry.shows.flatMap((show) =>
    planned.filter((p) => p.shows.some((s) => s.id === show.id)).map((p) => p.service.name),
  );
  return [...new Set(names)];
}

export function PlanPage() {
  const { data: plan } = useSuspenseQuery(rotationQueryOptions);
  const providers = useQuery(providersQueryOptions);
  const updateService = useUpdateService();
  const now = new Date();
  const month = now.toLocaleString('en-US', { month: 'long', year: 'numeric' });

  const providerName = (key: string) =>
    providers.data?.find((p) => p.key === key)?.name ??
    key.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

  if (plan.entries.length === 0) {
    return (
      <>
        <PageHeader eyebrow={month} title="This month's plan" />
        <div className="rounded-2xl border border-dashed bg-card p-10 text-center">
          <h2 className="text-xl font-semibold">Let's build your first rotation</h2>
          <p className="mx-auto mt-2 max-w-md text-muted-foreground">
            Add the streaming services you have and the shows you want to watch. We'll tell you
            which to keep and which to pause each month.
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

  const entries = ORDER.flatMap((state) => plan.entries.filter((e) => e.state === state));

  return (
    <>
      <PageHeader
        eyebrow={month}
        title="This month's plan"
        description="The fewest, cheapest services that cover everything left on your watchlist."
      />

      <SavingsHero
        {...plan}
        activeCount={plan.entries.filter((e) => e.service.status === 'active').length}
        plannedCount={plan.entries.filter((e) => e.state === 'keep' || e.state === 'resume').length}
      />

      <section aria-labelledby="plan-services" className="mt-12">
        <SectionHeader
          id="plan-services"
          title="Your services this month"
          note="Changes to make come first"
        />
        <div className="grid gap-5 md:grid-cols-2 2xl:grid-cols-3">
          {entries.map((entry) => (
            <ServicePlanCard
              key={entry.service.id}
              service={entry.service}
              state={entry.state}
              shows={entry.shows}
              coveredBy={coveredBy(entry, plan.entries)}
              pending={updateService.isPending}
              onDone={() =>
                updateService.mutate({
                  id: entry.service.id,
                  status: entry.state === 'pause' ? 'paused' : 'active',
                })
              }
            />
          ))}
        </div>
      </section>

      {plan.uncovered.length > 0 ? (
        <section aria-labelledby="plan-uncovered" className="mt-12">
          <SectionHeader
            id="plan-uncovered"
            title="Not on your services"
            note="On your list, but none of your services carry them"
          />
          <UncoveredShows shows={plan.uncovered} providerName={providerName} />
        </section>
      ) : null}
    </>
  );
}
