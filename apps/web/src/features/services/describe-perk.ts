import { daysUntil, perkActive, type ServicePerk } from '@app/shared';
import { formatPrice } from '@/lib/format';

const dateFormat = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
  timeZone: 'UTC',
});

/** "Mar 1, 2027" for a YYYY-MM-DD date. */
export function formatDay(day: string): string {
  return dateFormat.format(new Date(`${day}T00:00:00Z`));
}

/** "Free via Xfinity until Mar 1, 2027", "$10.00/mo via Verizon" or "Xfinity perk ended …". */
export function describePerk(perk: ServicePerk, today: string): string {
  if (perk.endsOn !== null && perk.endsOn < today) {
    return `${perk.via} perk ended ${formatDay(perk.endsOn)}`;
  }
  const price = perk.monthlyPriceCents === 0 ? 'Free' : `${formatPrice(perk.monthlyPriceCents)}/mo`;
  return `${price} via ${perk.via}${perk.endsOn ? ` until ${formatDay(perk.endsOn)}` : ''}`;
}

/** Days left when the perk ends within `withinDays`, else null. */
export function perkEndingIn(
  perk: ServicePerk | null,
  today: string,
  withinDays: number,
): number | null {
  if (!perkActive(perk, today)) return null;
  const days = daysUntil(perk.endsOn, today);
  return days !== null && days <= withinDays ? days : null;
}
