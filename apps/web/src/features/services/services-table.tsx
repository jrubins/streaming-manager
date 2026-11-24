import type { CatalogProvider, Service, ServiceStatus, UpdateService } from '@app/shared';
import { cn } from 'cn';
import { ExternalLink, MoreHorizontal, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ServiceLogo } from '@/features/rotation/service-logo';
import { formatPrice } from '@/lib/format';
import { manageLink } from '@/lib/manage-link';

const CUSTOM = '__custom__';

const SOURCE_LABELS = {
  catalog: 'Published price',
  manual: 'Entered by you',
  invoice: 'From an invoice',
} as const;

interface ServicesTableProps {
  services: readonly Service[];
  /** Known plans by provider key. */
  plansFor: (providerKey: string) => CatalogProvider['plans'];
  onChange: (service: Service, changes: UpdateService) => void;
  onRemove: (service: Service) => void;
  pending?: boolean;
}

/** The household's services, each with its status, plan and monthly price editable. */
export function ServicesTable({
  services,
  plansFor,
  onChange,
  onRemove,
  pending = false,
}: ServicesTableProps) {
  const total = services
    .filter((s) => s.status === 'active')
    .reduce((sum, s) => sum + (s.monthlyPriceCents ?? 0), 0);
  return (
    <div className="surface overflow-x-auto">
      <table className="w-full min-w-[760px] text-sm">
        <thead>
          <tr className="border-b text-left text-xs font-medium tracking-wide text-muted-foreground uppercase">
            <th scope="col" className="py-3 pr-4 pl-5 font-medium">
              Service
            </th>
            <th scope="col" className="px-4 py-3 font-medium">
              Status
            </th>
            <th scope="col" className="px-4 py-3 font-medium">
              Plan
            </th>
            <th scope="col" className="px-4 py-3 font-medium">
              Monthly price
            </th>
            <th scope="col" className="py-3 pr-5 pl-4">
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {services.map((service) => (
            <ServiceRow
              // A new price from the server resets the price field.
              key={`${service.id}:${service.monthlyPriceCents}`}
              service={service}
              plans={plansFor(service.providerKey)}
              onChange={(changes) => onChange(service, changes)}
              onRemove={() => onRemove(service)}
              pending={pending}
            />
          ))}
        </tbody>
        <tfoot>
          <tr className="border-t bg-muted/30">
            <th scope="row" colSpan={3} className="py-3 pr-4 pl-5 text-left font-medium">
              Active services
            </th>
            <td className="px-4 py-3">
              <span className="font-semibold tabular-nums">{formatPrice(total)}</span>
              <span className="text-xs text-muted-foreground">/mo</span>
            </td>
            <td />
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

function ServiceRow({
  service,
  plans,
  onChange,
  onRemove,
  pending,
}: {
  service: Service;
  plans: CatalogProvider['plans'];
  onChange: (changes: UpdateService) => void;
  onRemove: () => void;
  pending: boolean;
}) {
  const [price, setPrice] = useState(
    service.monthlyPriceCents === null ? '' : (service.monthlyPriceCents / 100).toFixed(2),
  );
  const planValue =
    service.planName && plans.some((p) => p.name === service.planName) ? service.planName : CUSTOM;
  const link = manageLink(service);

  function savePrice() {
    const trimmed = price.trim().replace(/^\$/, '');
    const cents = trimmed === '' ? null : Math.round(Number(trimmed) * 100);
    if (cents !== null && (!Number.isFinite(cents) || cents < 0)) return;
    if (cents !== service.monthlyPriceCents) onChange({ monthlyPriceCents: cents });
  }

  const setStatus = (status: ServiceStatus) => {
    if (status !== service.status) onChange({ status });
  };

  return (
    <tr
      aria-label={service.name}
      className={cn('hover:bg-muted/40', service.status === 'paused' && 'bg-muted/25')}
    >
      <td className="py-3 pr-4 pl-5">
        <div className="flex items-center gap-3">
          <ServiceLogo
            service={service}
            className={cn(
              'size-10 rounded-xl',
              service.status === 'paused' && 'opacity-60 grayscale',
            )}
          />
          <div className="min-w-0">
            <p className="truncate font-semibold">{service.name}</p>
            <p className="truncate text-xs text-muted-foreground">
              {service.priceSource ? SOURCE_LABELS[service.priceSource] : 'No price yet'}
            </p>
          </div>
        </div>
      </td>
      <td className="px-4 py-3">
        <div
          role="group"
          aria-label={`${service.name} status`}
          className="inline-flex rounded-lg bg-muted p-0.5"
        >
          {(['active', 'paused'] as const).map((status) => (
            <button
              key={status}
              type="button"
              aria-pressed={service.status === status}
              disabled={pending}
              onClick={() => setStatus(status)}
              className={cn(
                'rounded-md px-2.5 py-1 text-xs font-medium text-muted-foreground transition-colors',
                service.status === status && 'bg-card text-foreground shadow-sm',
              )}
            >
              {status === 'active' ? 'Active' : 'Paused'}
            </button>
          ))}
        </div>
      </td>
      <td className="px-4 py-3">
        {plans.length > 0 ? (
          <Select
            value={planValue}
            disabled={pending}
            onValueChange={(value) => {
              if (value !== CUSTOM) onChange({ planName: value });
            }}
          >
            <SelectTrigger size="sm" className="w-52" aria-label={`${service.name} plan`}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {plans.map((plan) => (
                <SelectItem key={plan.name} value={plan.name}>
                  {plan.name} · {formatPrice(plan.monthlyPriceCents)}
                </SelectItem>
              ))}
              <SelectItem value={CUSTOM}>{service.planName ?? 'Other plan'}</SelectItem>
            </SelectContent>
          </Select>
        ) : (
          <span className="text-muted-foreground">{service.planName ?? '—'}</span>
        )}
      </td>
      <td className="px-4 py-3">
        <div className="relative w-28">
          <span className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-muted-foreground">
            $
          </span>
          <Input
            aria-label={`${service.name} monthly price`}
            inputMode="decimal"
            placeholder="0.00"
            className="h-8 pl-6 tabular-nums"
            value={price}
            disabled={pending}
            onChange={(event) => setPrice(event.target.value)}
            onBlur={savePrice}
            onKeyDown={(event) => {
              if (event.key === 'Enter') event.currentTarget.blur();
            }}
          />
        </div>
      </td>
      <td className="py-3 pr-5 pl-4 text-right">
        <DropdownMenu modal={false}>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              disabled={pending}
              aria-label={`${service.name} actions`}
            >
              <MoreHorizontal aria-hidden />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-56">
            <DropdownMenuLabel className="text-xs text-muted-foreground">
              {service.name}
            </DropdownMenuLabel>
            <DropdownMenuItem asChild>
              <a href={link.href} target="_blank" rel="noopener noreferrer">
                <ExternalLink aria-hidden />
                {link.site ? `Manage on ${link.site}` : `Find how to manage ${service.name}`}
              </a>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onSelect={onRemove}>
              <Trash2 aria-hidden />
              Remove {service.name}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </td>
    </tr>
  );
}
