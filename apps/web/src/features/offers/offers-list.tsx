import type { PerkOffer, Service } from '@app/shared';
import { Check, ExternalLink, Gift } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatPrice } from '@/lib/format';

interface OffersListProps {
  offers: readonly PerkOffer[];
  /** The household's services, to show which perks it already uses. */
  services: readonly Service[];
  /** Provider keys of services an unwatched title streams on (shown first). */
  needed: ReadonlySet<string>;
  onClaim: (offer: PerkOffer) => void;
  pending?: boolean;
  label: string;
}

function priceLine(offer: PerkOffer): string {
  if (offer.monthlyPriceCents === null) return `Credit with ${offer.membershipName}`;
  if (offer.monthlyPriceCents === 0) return `Free with ${offer.membershipName}`;
  return `${formatPrice(offer.monthlyPriceCents)}/mo with ${offer.membershipName}`;
}

/** Streaming perks, each with its terms and a way to record that the household uses it. */
export function OffersList({
  offers,
  services,
  needed,
  onClaim,
  pending = false,
  label,
}: OffersListProps) {
  const sorted = [...offers].sort(
    (a, b) =>
      Number(needed.has(b.providerKey)) - Number(needed.has(a.providerKey)) ||
      a.providerName.localeCompare(b.providerName) ||
      a.membershipName.localeCompare(b.membershipName),
  );
  return (
    <ul className="surface divide-y" aria-label={label}>
      {sorted.map((offer) => {
        const service = services.find((s) => s.providerKey === offer.providerKey);
        const claimed = service?.perk?.via === offer.membershipName;
        return (
          <li
            key={offer.id}
            className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="min-w-0">
              <p className="flex flex-wrap items-center gap-2 font-semibold">
                {offer.providerName}
                {needed.has(offer.providerKey) ? (
                  <Badge variant="secondary">On your watchlist</Badge>
                ) : null}
              </p>
              <p className="flex items-center gap-1 text-sm font-medium text-primary">
                <Gift className="size-3.5 shrink-0" aria-hidden />
                {priceLine(offer)}
              </p>
              <p className="mt-0.5 text-sm text-muted-foreground">{offer.summary}</p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <Button variant="ghost" size="sm" asChild>
                <a href={offer.url} target="_blank" rel="noopener noreferrer">
                  <ExternalLink aria-hidden />
                  Terms
                  <span className="sr-only">
                    {' '}
                    for {offer.providerName} with {offer.membershipName}
                  </span>
                </a>
              </Button>
              {claimed ? (
                <span className="inline-flex items-center gap-1 px-2 text-sm text-muted-foreground">
                  <Check className="size-4" aria-hidden />
                  Using it
                </span>
              ) : offer.monthlyPriceCents === null ? null : (
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={pending}
                  onClick={() => onClaim(offer)}
                >
                  We get this
                  <span className="sr-only">
                    : {offer.providerName} with {offer.membershipName}
                  </span>
                </Button>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
