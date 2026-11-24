import type { RotationPlan } from '@app/shared';
import { ArrowRight } from 'lucide-react';
import { formatPrice } from '@/lib/format';

type SavingsHeroProps = Pick<
  RotationPlan,
  'currentCostCents' | 'plannedCostCents' | 'unpricedCount'
> & {
  activeCount: number;
  plannedCount: number;
};

/** The headline: what following this month's plan saves (or costs). */
export function SavingsHero({
  currentCostCents,
  plannedCostCents,
  unpricedCount,
  activeCount,
  plannedCount,
}: SavingsHeroProps) {
  const saving = currentCostCents - plannedCostCents;
  const services = (n: number) => (n === 1 ? '1 service' : `${n} services`);
  return (
    <section
      aria-label="Monthly cost"
      className="rounded-2xl border border-border/70 bg-gradient-to-br from-accent/70 via-card to-card p-6 shadow-[0_1px_2px_rgb(0_0_0/0.04)] sm:px-8"
    >
      <div className="flex flex-wrap items-end justify-between gap-x-10 gap-y-8">
        <div>
          <p className="text-sm font-medium text-muted-foreground">
            {saving > 0
              ? 'Rotate this month and save'
              : saving < 0
                ? 'Catching up on your list costs'
                : 'Your services already match your list'}
          </p>
          <p className="mt-1 text-4xl font-semibold tracking-tight text-primary tabular-nums">
            {formatPrice(Math.abs(saving))}
            <span className="ml-1 text-lg font-medium text-muted-foreground">/mo</span>
          </p>
          {saving > 0 ? (
            <p className="mt-0.5 text-sm text-muted-foreground">
              {formatPrice(saving * 12)} a year
            </p>
          ) : null}
        </div>

        <dl className="flex flex-wrap items-center gap-x-6 gap-y-3">
          <div>
            <dt className="text-xs font-medium tracking-wide uppercase text-muted-foreground">
              Paying now
            </dt>
            <dd className="text-lg font-semibold tabular-nums">
              {formatPrice(currentCostCents)}
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                {services(activeCount)}
              </span>
            </dd>
          </div>
          <ArrowRight className="size-5 text-muted-foreground" aria-hidden />
          <div>
            <dt className="text-xs font-medium tracking-wide uppercase text-muted-foreground">
              With this plan
            </dt>
            <dd className="text-lg font-semibold tabular-nums">
              {formatPrice(plannedCostCents)}
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                {services(plannedCount)}
              </span>
            </dd>
          </div>
        </dl>
        {unpricedCount > 0 ? (
          <p className="basis-full text-xs text-muted-foreground">
            {services(unpricedCount)} without a price {unpricedCount === 1 ? "isn't" : "aren't"}{' '}
            counted.
          </p>
        ) : null}
      </div>
    </section>
  );
}
