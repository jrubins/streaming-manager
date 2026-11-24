import type { RotationPlan } from '@app/shared';
import { cn } from 'cn';
import { formatPrice } from '@/lib/format';

type PlanSummaryProps = Pick<
  RotationPlan,
  'currentCostCents' | 'plannedCostCents' | 'unpricedCount'
> & {
  activeCount: number;
  plannedCount: number;
};

const services = (n: number) => (n === 1 ? '1 service' : `${n} services`);

/** What the household pays now, what the plan costs, and the difference. */
export function PlanSummary({
  currentCostCents,
  plannedCostCents,
  unpricedCount,
  activeCount,
  plannedCount,
}: PlanSummaryProps) {
  const saving = currentCostCents - plannedCostCents;
  return (
    <section aria-label="Monthly cost" className="space-y-2">
      <dl className="grid divide-y surface sm:grid-cols-3 sm:divide-x sm:divide-y-0">
        <Stat
          label="Paying now"
          value={formatPrice(currentCostCents)}
          note={services(activeCount)}
        />
        <Stat
          label="With this plan"
          value={formatPrice(plannedCostCents)}
          note={services(plannedCount)}
        />
        <Stat
          label={saving >= 0 ? 'You save' : 'Extra this month'}
          value={`${formatPrice(Math.abs(saving))}/mo`}
          note={saving > 0 ? `${formatPrice(saving * 12)} a year` : 'to catch up on your list'}
          valueClassName={saving > 0 ? 'text-primary' : undefined}
        />
      </dl>
      {unpricedCount > 0 ? (
        <p className="text-xs text-muted-foreground">
          {services(unpricedCount)} without a price {unpricedCount === 1 ? "isn't" : "aren't"}{' '}
          counted.
        </p>
      ) : null}
    </section>
  );
}

function Stat({
  label,
  value,
  note,
  valueClassName,
}: {
  label: string;
  value: string;
  note: string;
  valueClassName?: string | undefined;
}) {
  return (
    // A compact row on a phone (label left, amount right); a tile from tablet width up.
    <div className="grid grid-cols-[1fr_auto] items-baseline gap-x-4 px-5 py-3 sm:block sm:px-6 sm:py-5">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd
        className={cn(
          'text-right text-lg font-semibold tracking-tight tabular-nums sm:mt-1 sm:text-left sm:text-2xl',
          valueClassName,
        )}
      >
        {value}
      </dd>
      <dd className="col-span-2 text-xs text-muted-foreground sm:col-span-1">{note}</dd>
    </div>
  );
}
