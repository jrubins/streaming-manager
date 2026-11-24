import { PERK_ENDING_WARNING_DAYS, type RotationEntry } from '@app/shared';
import { Link } from '@tanstack/react-router';
import { CalendarClock } from 'lucide-react';
import { formatDay, perkEndingIn } from '@/features/services/describe-perk';
import { formatPrice } from '@/lib/format';

interface PerksEndingProps {
  entries: readonly RotationEntry[];
  /** YYYY-MM-DD. */
  today: string;
}

/** A heads-up for each perk that ends soon, and what the service costs after. */
export function PerksEnding({ entries, today }: PerksEndingProps) {
  const ending = entries.flatMap((entry) => {
    const perk = entry.service?.perk ?? null;
    const days = perkEndingIn(perk, today, PERK_ENDING_WARNING_DAYS);
    return perk?.endsOn && days !== null ? [{ entry, perk, endsOn: perk.endsOn, days }] : [];
  });
  if (ending.length === 0) return null;
  return (
    <section
      aria-label="Perks ending soon"
      className="mb-8 rounded-2xl border border-pause/40 bg-pause-soft p-4"
    >
      <ul className="space-y-2">
        {ending.map(({ entry, perk, endsOn, days }) => (
          <li key={entry.offering.key} className="flex items-start gap-3 text-sm">
            <CalendarClock className="mt-0.5 size-4 shrink-0 text-pause" aria-hidden />
            <p>
              <span className="font-semibold">{entry.offering.name}</span> from {perk.via} ends{' '}
              {days <= 0 ? 'today' : days === 1 ? 'tomorrow' : `in ${days} days`} (
              {formatDay(endsOn)}).{' '}
              {entry.service?.monthlyPriceCents !== null &&
              entry.service?.monthlyPriceCents !== undefined
                ? `Then it's ${formatPrice(entry.service.monthlyPriceCents)}/mo, and the plan will decide whether to keep it.`
                : 'Then the plan prices it like any other service.'}{' '}
              <Link to="/services" className="font-medium text-primary hover:underline">
                Update the perk
              </Link>
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}
