import type { RotationEntry, RotationState } from '@app/shared';
import { useQuery, useSuspenseQuery } from '@tanstack/react-query';
import { RotationSummary } from '@/features/rotation/rotation-summary';
import { rotationQueryOptions } from '@/features/rotation/queries';
import { ServicePlanCard } from '@/features/rotation/service-plan-card';
import { UncoveredShows } from '@/features/rotation/uncovered-shows';
import { providersQueryOptions, useUpdateService } from '@/features/services/queries';

const SECTIONS: { states: RotationState[]; title: string; description: string }[] = [
  {
    states: ['resume', 'pause'],
    title: 'To do this month',
    description: 'Change these to match the plan, then mark them done.',
  },
  { states: ['keep'], title: 'Keep', description: 'Active, and your list needs them.' },
  { states: ['paused'], title: 'Stay paused', description: 'Nothing on your list needs them.' },
];

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
  const month = new Date().toLocaleString('en-US', { month: 'long' });

  const providerName = (key: string) =>
    providers.data?.find((p) => p.key === key)?.name ??
    key.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

  if (plan.entries.length === 0) {
    return (
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">Your {month} plan</h1>
        <p className="text-muted-foreground">
          Add the streaming services you have and the shows you want to watch, and this page will
          tell you which to keep and which to pause.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Your {month} plan</h1>
          <p className="mt-1 text-muted-foreground">
            The fewest, cheapest services that cover everything left on your watchlist.
          </p>
        </div>
        <RotationSummary {...plan} />
      </div>

      {SECTIONS.map((section) => {
        // In section order: resumes before pauses.
        const entries = section.states.flatMap((state) =>
          plan.entries.filter((e) => e.state === state),
        );
        if (entries.length === 0) return null;
        return (
          <section key={section.title} aria-labelledby={`section-${section.states[0]}`}>
            <h2 id={`section-${section.states[0]}`} className="text-lg font-semibold">
              {section.title}
            </h2>
            <p className="mb-4 text-sm text-muted-foreground">{section.description}</p>
            <div className="grid gap-4 md:grid-cols-2">
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
        );
      })}

      {plan.uncovered.length > 0 ? (
        <section aria-labelledby="section-uncovered">
          <h2 id="section-uncovered" className="text-lg font-semibold">
            Not on your services
          </h2>
          <p className="mb-4 text-sm text-muted-foreground">
            On your list, but none of your services carry them.
          </p>
          <UncoveredShows shows={plan.uncovered} providerName={providerName} />
        </section>
      ) : null}
    </div>
  );
}
