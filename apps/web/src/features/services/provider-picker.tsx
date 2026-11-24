import type { CatalogProvider } from '@app/shared';
import { Plus } from 'lucide-react';
import { ServiceLogo } from '@/features/rotation/service-logo';
import { formatList, formatPrice } from '@/lib/format';

interface ProviderPickerProps {
  providers: readonly CatalogProvider[];
  onAdd: (provider: CatalogProvider) => void;
  /** Provider key → display name, for what a bundle includes. */
  providerName: (key: string) => string;
  pending?: boolean;
}

/** Services available in the household's region, to add with one click. */
export function ProviderPicker({
  providers,
  onAdd,
  providerName,
  pending = false,
}: ProviderPickerProps) {
  if (providers.length === 0) {
    return <p className="text-sm text-muted-foreground">You've added every service available.</p>;
  }
  return (
    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {providers.map((provider) => (
        <li key={provider.key}>
          <button
            type="button"
            disabled={pending}
            onClick={() => onAdd(provider)}
            className="group surface flex w-full items-center gap-3 p-3 text-left transition-colors hover:border-primary/40 hover:bg-accent/30 disabled:opacity-50"
          >
            <ServiceLogo service={provider} className="size-10" />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium">
                <span className="sr-only">Add </span>
                {provider.name}
              </span>
              {provider.kind === 'bundle' ? (
                <span className="block truncate text-xs text-muted-foreground">
                  {formatList(provider.includes.map(providerName))}
                </span>
              ) : null}
              <span className="block text-xs text-muted-foreground">
                {provider.plans[0]
                  ? `from ${formatPrice(provider.plans[0].monthlyPriceCents)}`
                  : 'Price not known'}
              </span>
            </span>
            <Plus
              className="size-4 text-muted-foreground transition-colors group-hover:text-primary"
              aria-hidden
            />
          </button>
        </li>
      ))}
    </ul>
  );
}
