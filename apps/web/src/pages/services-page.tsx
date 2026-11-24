import type { CatalogProvider, PerkOffer } from '@app/shared';
import { useQuery, useSuspenseQuery } from '@tanstack/react-query';
import { Search } from 'lucide-react';
import { useState } from 'react';
import { PageHeader } from '@/components/page-header';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MembershipPicker } from '@/features/offers/membership-picker';
import { OffersList } from '@/features/offers/offers-list';
import {
  membershipsQueryOptions,
  offersQueryOptions,
  useSetMemberships,
} from '@/features/offers/queries';
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
import { watchlistQueryOptions } from '@/features/watchlist/queries';

type Tab = 'yours' | 'add' | 'bundles' | 'offers';

export function ServicesPage() {
  const { data: services } = useSuspenseQuery(servicesQueryOptions);
  const providers = useQuery(providersQueryOptions);
  const create = useCreateService();
  const update = useUpdateService();
  const remove = useDeleteService();
  const offers = useQuery(offersQueryOptions);
  const memberships = useQuery(membershipsQueryOptions);
  const watchlist = useQuery(watchlistQueryOptions);
  const setMemberships = useSetMemberships();
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

  // Services (and bundles holding them) that an unwatched title streams on.
  const showKeys = new Set(
    (watchlist.data ?? []).filter((s) => !s.watched).flatMap((s) => s.providerKeys),
  );
  const needed = new Set([
    ...showKeys,
    ...(providers.data ?? [])
      .filter((p) => p.includes.some((key) => showKeys.has(key)))
      .map((p) => p.key),
  ]);
  const mine = new Set(memberships.data?.memberships ?? []);
  const toggleMembership = (key: string) => {
    const next = new Set(mine);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    setMemberships.mutate([...next]);
  };
  // Record the perk on the service (adding it if needed), then show it in the list.
  const claim = (offer: PerkOffer) => {
    if (offer.monthlyPriceCents === null) return;
    const perk = {
      via: offer.membershipName,
      monthlyPriceCents: offer.monthlyPriceCents,
      endsOn: null,
    };
    const planName = offer.planName ?? undefined;
    const existing = services.find((s) => s.providerKey === offer.providerKey);
    const done = { onSuccess: () => setTab('yours') };
    if (existing) update.mutate({ id: existing.id, perk, planName, status: 'active' }, done);
    else create.mutate({ providerKey: offer.providerKey, planName, perk }, done);
  };
  const yourOffers = (offers.data?.offers ?? []).filter((o) => mine.has(o.membershipKey));
  const otherOffers = (offers.data?.offers ?? []).filter((o) => !mine.has(o.membershipKey));

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
          <TabsTrigger value="offers">Offers</TabsTrigger>
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
        <TabsContent value="offers" className="space-y-8">
          <p className="max-w-2xl text-sm text-muted-foreground">
            Services that come free or cheaper with things you already pay for. Pick what your
            household has and the plan uses their perks. Offers change often: check the terms.
          </p>
          {offers.isPending || memberships.isPending ? (
            <p className="text-sm text-muted-foreground">Loading offers…</p>
          ) : offers.isError || memberships.isError ? (
            <p className="text-sm text-destructive">Couldn't load offers.</p>
          ) : offers.data.offers.length === 0 ? (
            <p className="text-sm text-muted-foreground">No offers known in your region yet.</p>
          ) : (
            <>
              <section aria-labelledby="memberships-heading" className="surface p-5">
                <h2 id="memberships-heading" className="mb-1 font-semibold">
                  What your household has
                </h2>
                <p className="mb-4 text-sm text-muted-foreground">
                  The plan counts their perks as options.
                </p>
                <MembershipPicker
                  memberships={offers.data.memberships}
                  selected={mine}
                  onToggle={toggleMembership}
                  pending={setMemberships.isPending}
                />
              </section>
              {yourOffers.length > 0 ? (
                <section aria-labelledby="your-offers-heading">
                  <h2 id="your-offers-heading" className="mb-3 font-semibold">
                    With your memberships
                  </h2>
                  <OffersList
                    label="Offers with your memberships"
                    offers={yourOffers}
                    services={services}
                    needed={needed}
                    onClaim={claim}
                    pending={create.isPending || update.isPending}
                  />
                </section>
              ) : null}
              {otherOffers.length > 0 ? (
                <section aria-labelledby="other-offers-heading">
                  <h2 id="other-offers-heading" className="mb-3 font-semibold">
                    {yourOffers.length > 0 ? 'Other offers' : 'All offers'}
                  </h2>
                  <OffersList
                    label="Other offers"
                    offers={otherOffers}
                    services={services}
                    needed={needed}
                    onClaim={claim}
                    pending={create.isPending || update.isPending}
                  />
                </section>
              ) : null}
              <p className="text-xs text-muted-foreground">Offers as of {offers.data.asOf}.</p>
            </>
          )}
        </TabsContent>
      </Tabs>
    </>
  );
}
