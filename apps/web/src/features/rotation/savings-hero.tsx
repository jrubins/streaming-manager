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
      className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-hero-from to-hero-to p-6 text-hero-foreground shadow-lg sm:p-8"
    >
      <div aria-hidden className="absolute -top-16 -right-10 size-56 rounded-full bg-white/10" />
      <div aria-hidden className="absolute -right-24 -bottom-24 size-64 rounded-full bg-white/5" />

      <div className="relative flex flex-wrap items-end justify-between gap-x-10 gap-y-8">
        <div>
          <p className="text-sm font-medium opacity-80">
            {saving > 0
              ? 'Rotate this month and save'
              : saving < 0
                ? 'Catching up on your list costs'
                : 'Your services already match your list'}
          </p>
          <p className="mt-2 text-5xl font-semibold tracking-tight tabular-nums">
            {formatPrice(Math.abs(saving))}
            <span className="ml-1 text-2xl font-medium opacity-80">/mo</span>
          </p>
          {saving > 0 ? (
            <p className="mt-1 text-sm opacity-80">{formatPrice(saving * 12)} a year</p>
          ) : null}
        </div>

        <dl className="flex flex-wrap items-center gap-x-6 gap-y-3">
          <div>
            <dt className="text-xs font-medium tracking-wide uppercase opacity-70">Paying now</dt>
            <dd className="text-lg font-semibold tabular-nums">
              {formatPrice(currentCostCents)}
              <span className="ml-2 text-sm font-normal opacity-70">{services(activeCount)}</span>
            </dd>
          </div>
          <ArrowRight className="size-5 opacity-60" aria-hidden />
          <div>
            <dt className="text-xs font-medium tracking-wide uppercase opacity-70">
              With this plan
            </dt>
            <dd className="text-lg font-semibold tabular-nums">
              {formatPrice(plannedCostCents)}
              <span className="ml-2 text-sm font-normal opacity-70">{services(plannedCount)}</span>
            </dd>
          </div>
        </dl>
        {unpricedCount > 0 ? (
          <p className="basis-full text-xs opacity-70">
            {services(unpricedCount)} without a price {unpricedCount === 1 ? "isn't" : "aren't"}{' '}
            counted.
          </p>
        ) : null}
      </div>
    </section>
  );
}
