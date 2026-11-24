import { useQuery, useSuspenseQuery } from '@tanstack/react-query';
import { PageHeader, SectionHeader } from '@/components/page-header';
import { ProviderPicker } from '@/features/services/provider-picker';
import {
  providersQueryOptions,
  servicesQueryOptions,
  useCreateService,
  useDeleteService,
  useUpdateService,
} from '@/features/services/queries';
import { ServiceEditor } from '@/features/services/service-editor';
import { formatPrice } from '@/lib/format';

export function ServicesPage() {
  const { data: services } = useSuspenseQuery(servicesQueryOptions);
  const providers = useQuery(providersQueryOptions);
  const create = useCreateService();
  const update = useUpdateService();
  const remove = useDeleteService();

  const active = services.filter((s) => s.status === 'active');
  const total = active.reduce((sum, s) => sum + (s.monthlyPriceCents ?? 0), 0);
  const have = new Set(services.map((s) => s.providerKey));
  const available = (providers.data ?? []).filter((p) => !have.has(p.key));
  const plansFor = (key: string) => providers.data?.find((p) => p.key === key)?.plans ?? [];

  return (
    <>
      <PageHeader
        title="Services"
        description="The subscriptions your household has. Prices come from published plans; change them to match your bill."
        actions={
          <div className="rounded-xl border bg-card px-4 py-2 text-right shadow-sm">
            <p className="text-xs text-muted-foreground">Active now</p>
            <p className="text-lg font-semibold tabular-nums">
              {formatPrice(total)}
              <span className="text-sm font-normal text-muted-foreground">/mo</span>
            </p>
          </div>
        }
      />

      <section aria-labelledby="your-services">
        <SectionHeader
          id="your-services"
          title="Your services"
          note={`${active.length} active · ${services.length - active.length} paused`}
        />
        {services.length === 0 ? (
          <p className="rounded-2xl border border-dashed p-8 text-center text-muted-foreground">
            No services yet. Add the ones you subscribe to (or used to) below.
          </p>
        ) : (
          <div className="space-y-3">
            {services.map((service) => (
              <ServiceEditor
                key={`${service.id}:${service.monthlyPriceCents}`}
                service={service}
                plans={plansFor(service.providerKey)}
                pending={update.isPending || remove.isPending}
                onChange={(changes) => update.mutate({ id: service.id, ...changes })}
                onRemove={() => remove.mutate(service.id)}
              />
            ))}
          </div>
        )}
      </section>

      <section aria-labelledby="add-service" className="mt-12">
        <SectionHeader
          id="add-service"
          title="Add a service"
          note="Added as active, at the cheapest plan"
        />
        {providers.isPending ? (
          <p className="text-sm text-muted-foreground">Loading services…</p>
        ) : providers.isError ? (
          <p className="text-sm text-destructive">Couldn't load the services in your region.</p>
        ) : (
          <ProviderPicker
            providers={available}
            pending={create.isPending}
            onAdd={(provider) => create.mutate({ providerKey: provider.key })}
          />
        )}
      </section>
    </>
  );
}
