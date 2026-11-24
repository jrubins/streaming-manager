import type { CatalogProvider } from '@app/shared';
import { useQuery, useSuspenseQuery } from '@tanstack/react-query';
import { Search } from 'lucide-react';
import { useState } from 'react';
import { PageHeader } from '@/components/page-header';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BundlePicker } from '@/features/services/bundle-picker';
import { ProviderPicker } from '@/features/services/provider-picker';
import {
  providersQueryOptions,
  servicesQueryOptions,
  useCreateService,
  useDeleteService,
  useUpdateService,
} from '@/features/services/queries';
import { ServicesTable } from '@/features/services/services-table';

type Tab = 'yours' | 'add' | 'bundles';

export function ServicesPage() {
  const { data: services } = useSuspenseQuery(servicesQueryOptions);
  const providers = useQuery(providersQueryOptions);
  const create = useCreateService();
  const update = useUpdateService();
  const remove = useDeleteService();
  const [tab, setTab] = useState<Tab>(services.length === 0 ? 'add' : 'yours');
  const [query, setQuery] = useState('');

  const active = services.filter((s) => s.status === 'active');
  const have = new Set(services.map((s) => s.providerKey));
  const available = (providers.data ?? []).filter((p) => !have.has(p.key));
  const search = query.trim().toLowerCase();
  const availableServices = available.filter(
    (p) => p.kind === 'service' && (!search || p.name.toLowerCase().includes(search)),
  );
  const availableBundles = available.filter((p) => p.kind === 'bundle');
  const providerName = (key: string) =>
    providers.data?.find((p) => p.key === key)?.name ??
    key.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  // Back to the list after adding, to set its plan and price.
  const add = (provider: CatalogProvider) =>
    create.mutate({ providerKey: provider.key }, { onSuccess: () => setTab('yours') });

  const catalogState = providers.isPending ? (
    <p className="text-sm text-muted-foreground">Loading services…</p>
  ) : providers.isError ? (
    <p className="text-sm text-destructive">Couldn't load the services in your region.</p>
  ) : null;

  return (
    <>
      <PageHeader
        title="Services"
        description="The subscriptions your household has. Prices start from published plans; change them to match your bill."
      />

      <Tabs value={tab} onValueChange={(value) => setTab(value as Tab)}>
        <TabsList className="mb-6">
          <TabsTrigger value="yours">Your services ({services.length})</TabsTrigger>
          <TabsTrigger value="add">Add a service</TabsTrigger>
          <TabsTrigger value="bundles">Bundles</TabsTrigger>
        </TabsList>

        <TabsContent value="yours">
          {services.length === 0 ? (
            <p className="rounded-2xl border border-dashed p-8 text-center text-muted-foreground">
              No services yet. Add the ones you subscribe to (or used to) under "Add a service".
            </p>
          ) : (
            <>
              <p className="mb-3 text-sm text-muted-foreground">
                {active.length} active · {services.length - active.length} paused
              </p>
              <ServicesTable
                services={services}
                plansFor={(key) => providers.data?.find((p) => p.key === key)?.plans ?? []}
                providerName={providerName}
                pending={update.isPending || remove.isPending}
                onChange={(service, changes) => update.mutate({ id: service.id, ...changes })}
                onRemove={(service) => remove.mutate(service.id)}
              />
            </>
          )}
          <p className="mt-3 text-xs text-muted-foreground">
            Billed through Apple, Google Play, Roku or Amazon? Pause or cancel it in that store's
            subscription settings.
          </p>
        </TabsContent>

        <TabsContent value="add">
          <div className="relative mb-4 max-w-md">
            <Search
              className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <Input
              type="search"
              aria-label="Search services"
              placeholder="Search services…"
              className="pl-9"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>
          <p className="mb-4 text-sm text-muted-foreground">
            Added as active, at the cheapest plan. Services with known prices come first.
          </p>
          {catalogState ??
            (availableServices.length === 0 && search ? (
              <p className="text-sm text-muted-foreground">No services match "{query.trim()}".</p>
            ) : (
              <ProviderPicker
                providers={availableServices}
                providerName={providerName}
                pending={create.isPending}
                onAdd={add}
              />
            ))}
        </TabsContent>

        <TabsContent value="bundles">
          <p className="mb-4 text-sm text-muted-foreground">
            One subscription for several services. Add the one you pay for, then remove those
            services from your list if you'd added them separately.
          </p>
          {catalogState ?? (
            <BundlePicker
              bundles={availableBundles}
              providerName={providerName}
              pending={create.isPending}
              onAdd={add}
            />
          )}
        </TabsContent>
      </Tabs>
    </>
  );
}
