import type { CatalogProvider } from '@app/shared';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ServiceLogo } from '@/features/rotation/service-logo';
import { formatList, formatPrice } from '@/lib/format';

interface BundlePickerProps {
  bundles: readonly CatalogProvider[];
  onAdd: (bundle: CatalogProvider) => void;
  /** Provider key → display name, for what a bundle includes. */
  providerName: (key: string) => string;
  pending?: boolean;
}

/** Bundles available in the household's region: what each includes and its plans. */
export function BundlePicker({ bundles, onAdd, providerName, pending = false }: BundlePickerProps) {
  if (bundles.length === 0) {
    return <p className="text-sm text-muted-foreground">You've added every bundle available.</p>;
  }
  return (
    <ul className="grid gap-3 lg:grid-cols-2">
      {bundles.map((bundle) => (
        <li
          key={bundle.key}
          aria-label={bundle.name}
          className="surface flex items-start gap-4 p-4"
        >
          <ServiceLogo service={bundle} className="size-12" />
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold">{bundle.name}</h3>
            <p className="text-sm text-muted-foreground">
              Includes {formatList(bundle.includes.map(providerName))}
            </p>
            <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm" aria-label="Plans">
              {bundle.plans.map((plan) => (
                <li key={plan.name}>
                  {plan.name}{' '}
                  <span className="font-medium tabular-nums">
                    {formatPrice(plan.monthlyPriceCents)}
                  </span>
                  <span className="text-xs text-muted-foreground">/mo</span>
                </li>
              ))}
            </ul>
          </div>
          <Button
            variant="outline"
            size="sm"
            disabled={pending}
            onClick={() => onAdd(bundle)}
            aria-label={`Add ${bundle.name}`}
          >
            <Plus aria-hidden /> Add
          </Button>
        </li>
      ))}
    </ul>
  );
}
