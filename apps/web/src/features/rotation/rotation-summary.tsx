import type { RotationPlan } from '@app/shared';
import { cn } from 'cn';
import { formatPrice } from '@/lib/format';

type RotationSummaryProps = Pick<
  RotationPlan,
  'currentCostCents' | 'plannedCostCents' | 'unpricedCount'
>;

/** What the household pays now, what the plan costs, and the difference. */
export function RotationSummary({
  currentCostCents,
  plannedCostCents,
  unpricedCount,
}: RotationSummaryProps) {
  const change = plannedCostCents - currentCostCents;
  return (
    <section aria-label="Monthly cost" className="space-y-2">
      <dl className="grid grid-cols-3 divide-x rounded-xl border bg-card shadow-sm">
        <Stat label="Paying now" value={formatPrice(currentCostCents)} />
        <Stat label="With this plan" value={formatPrice(plannedCostCents)} />
        <Stat
          label={change <= 0 ? 'You save' : 'Extra this month'}
          value={`${formatPrice(Math.abs(change))}/mo`}
          className={change < 0 ? 'text-keep' : change > 0 ? 'text-pause' : undefined}
        />
      </dl>
      {unpricedCount > 0 ? (
        <p className="text-xs text-muted-foreground">
          {unpricedCount === 1 ? '1 service has' : `${unpricedCount} services have`} no price yet
          and {unpricedCount === 1 ? "isn't" : "aren't"} counted.
        </p>
      ) : null}
    </section>
  );
}

function Stat({ label, value, className }: { label: string; value: string; className?: string }) {
  return (
    <div className="px-5 py-4">
      <dt className="text-xs font-medium tracking-wide text-muted-foreground uppercase">{label}</dt>
      <dd className={cn('mt-1 text-2xl font-semibold tabular-nums', className)}>{value}</dd>
    </div>
  );
}
