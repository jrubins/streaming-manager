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
import { ServicesTable } from '@/features/services/services-table';

export function ServicesPage() {
  const { data: services } = useSuspenseQuery(servicesQueryOptions);
  const providers = useQuery(providersQueryOptions);
  const create = useCreateService();
  const update = useUpdateService();
  const remove = useDeleteService();

  const active = services.filter((s) => s.status === 'active');
  const have = new Set(services.map((s) => s.providerKey));
  const available = (providers.data ?? []).filter((p) => !have.has(p.key));

  return (
    <>
      <PageHeader
        title="Services"
        description="The subscriptions your household has. Prices start from published plans; change them to match your bill."
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
          <ServicesTable
            services={services}
            plansFor={(key) => providers.data?.find((p) => p.key === key)?.plans ?? []}
            pending={update.isPending || remove.isPending}
            onChange={(service, changes) => update.mutate({ id: service.id, ...changes })}
            onRemove={(service) => remove.mutate(service.id)}
          />
        )}
        <p className="mt-3 text-xs text-muted-foreground">
          Billed through Apple, Google Play, Roku or Amazon? Pause or cancel it in that store's
          subscription settings.
        </p>
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
