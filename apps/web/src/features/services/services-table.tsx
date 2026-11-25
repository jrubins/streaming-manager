import {
  isoToday,
  perkActive,
  type CatalogProvider,
  type Service,
  type ServiceStatus,
  type UpdateService,
} from '@app/shared';
import { cn } from 'cn';
import { ExternalLink, Gift, MoreHorizontal, Pin, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
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
import { formatList, formatPrice } from '@/lib/format';
import { manageLink } from '@/lib/manage-link';
import { describePerk } from './describe-perk';
import { PerkDialog } from './perk-dialog';

const CUSTOM = '__custom__';

/** "ads · 2 screens · HD", for choosing between plans. */
function planFeatures(plan: CatalogProvider['plans'][number]): string {
  return [
    plan.ads ? 'ads' : 'no ads',
    `${plan.streams} ${plan.streams === 1 ? 'screen' : 'screens'}`,
    plan.uhd ? '4K' : 'HD',
    ...(plan.downloads ? ['downloads'] : []),
  ].join(' · ');
}

const SOURCE_LABELS = {
  catalog: 'Published price',
  manual: 'Entered by you',
  invoice: 'From an invoice',
} as const;

interface ServicesTableProps {
  services: readonly Service[];
  /** Known plans by provider key. */
  plansFor: (providerKey: string) => CatalogProvider['plans'];
  /** Provider key → display name, for what a bundle includes. */
  providerName: (key: string) => string;
  onChange: (service: Service, changes: UpdateService) => void;
  onRemove: (service: Service) => void;
  pending?: boolean;
}

/** The household's services, each with its status, plan and monthly price editable. */
export function ServicesTable({
  services,
  plansFor,
  providerName,
  onChange,
  onRemove,
  pending = false,
}: ServicesTableProps) {
  const today = isoToday();
  // A perk sets what a service costs while it lasts.
  const total = services
    .filter((s) => s.status === 'active')
    .reduce(
      (sum, s) =>
        sum + (perkActive(s.perk, today) ? s.perk.monthlyPriceCents : (s.monthlyPriceCents ?? 0)),
      0,
    );
  const controls = (service: Service): ServiceControlsProps => ({
    service,
    plans: plansFor(service.providerKey),
    onChange: (changes) => onChange(service, changes),
    onRemove: () => onRemove(service),
    pending,
  });
  const totalLine = (
    <>
      <span className="font-semibold tabular-nums">{formatPrice(total)}</span>
      <span className="text-xs text-muted-foreground">/mo</span>
    </>
  );

  return (
    <>
      <ul className="space-y-3 md:hidden" aria-label="Your services">
        {services.map((service) => (
          <ServiceCard
            // A new price from the server resets the price field.
            key={`${service.id}:${service.monthlyPriceCents}`}
            {...controls(service)}
            providerName={providerName}
          />
        ))}
        <li className="flex items-baseline justify-between px-1 pt-1 text-sm">
          <span className="font-medium">Active services</span>
          <span>{totalLine}</span>
        </li>
      </ul>

      <div className="surface relative hidden overflow-x-auto md:block">
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
                key={`${service.id}:${service.monthlyPriceCents}`}
                {...controls(service)}
                providerName={providerName}
              />
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t bg-muted/30">
              <th scope="row" colSpan={3} className="py-3 pr-4 pl-5 text-left font-medium">
                Active services
              </th>
              <td className="px-4 py-3">{totalLine}</td>
              <td />
            </tr>
          </tfoot>
        </table>
      </div>
    </>
  );
}

interface ServiceControlsProps {
  service: Service;
  plans: CatalogProvider['plans'];
  onChange: (changes: UpdateService) => void;
  onRemove: () => void;
  pending: boolean;
}

/** Name, what it includes and where its price came from. */
function ServiceName({
  service,
  providerName,
}: {
  service: Service;
  providerName: (key: string) => string;
}) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <ServiceLogo
        service={service}
        className={cn('size-10 rounded-xl', service.status === 'paused' && 'opacity-60 grayscale')}
      />
      <div className="min-w-0">
        <p className="flex flex-wrap items-center gap-x-2 font-semibold">
          {service.name}
          {service.alwaysKeep ? (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-primary">
              <Pin className="size-3" aria-hidden />
              Always kept
            </span>
          ) : null}
        </p>
        {service.includes.length > 1 ? (
          <p className="text-xs text-muted-foreground">
            {formatList(service.includes.map(providerName))}
          </p>
        ) : null}
        {service.perk ? (
          <p
            className={cn(
              'flex items-center gap-1 text-xs font-medium',
              perkActive(service.perk, isoToday()) ? 'text-primary' : 'text-muted-foreground',
            )}
          >
            <Gift className="size-3.5 shrink-0" aria-hidden />
            {describePerk(service.perk, isoToday())}
          </p>
        ) : (
          <p className="text-xs text-muted-foreground">
            {service.priceSource ? SOURCE_LABELS[service.priceSource] : 'No price yet'}
          </p>
        )}
      </div>
    </div>
  );
}

function StatusToggle({ service, onChange, pending }: ServiceControlsProps) {
  const setStatus = (status: ServiceStatus) => {
    if (status !== service.status) onChange({ status });
  };
  return (
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
  );
}

function PlanSelect({
  service,
  plans,
  onChange,
  pending,
  className,
}: ServiceControlsProps & { className?: string }) {
  if (plans.length === 0) {
    return <span className="text-sm text-muted-foreground">{service.planName ?? '—'}</span>;
  }
  const value =
    service.planName && plans.some((p) => p.name === service.planName) ? service.planName : CUSTOM;
  return (
    <Select
      value={value}
      disabled={pending}
      onValueChange={(planName) => {
        if (planName !== CUSTOM) onChange({ planName });
      }}
    >
      <SelectTrigger size="sm" className={className} aria-label={`${service.name} plan`}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {plans.map((plan) => (
          <SelectItem key={plan.name} value={plan.name}>
            {plan.name} · {formatPrice(plan.monthlyPriceCents)}
            <span className="text-xs text-muted-foreground"> ({planFeatures(plan)})</span>
          </SelectItem>
        ))}
        <SelectItem value={CUSTOM}>{service.planName ?? 'Other plan'}</SelectItem>
      </SelectContent>
    </Select>
  );
}

function PriceInput({ service, onChange, pending }: ServiceControlsProps) {
  const [price, setPrice] = useState(
    service.monthlyPriceCents === null ? '' : (service.monthlyPriceCents / 100).toFixed(2),
  );
  function savePrice() {
    const trimmed = price.trim().replace(/^\$/, '');
    const cents = trimmed === '' ? null : Math.round(Number(trimmed) * 100);
    if (cents !== null && (!Number.isFinite(cents) || cents < 0)) return;
    if (cents !== service.monthlyPriceCents) onChange({ monthlyPriceCents: cents });
  }
  return (
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
  );
}

function ServiceMenu({ service, onChange, onRemove, pending }: ServiceControlsProps) {
  const link = manageLink(service);
  const [perkOpen, setPerkOpen] = useState(false);
  return (
    <>
      <PerkDialog
        serviceName={service.name}
        perk={service.perk}
        open={perkOpen}
        onOpenChange={setPerkOpen}
        onSave={(perk) => onChange({ perk })}
      />
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
          <DropdownMenuCheckboxItem
            checked={service.alwaysKeep}
            onCheckedChange={(alwaysKeep) => onChange({ alwaysKeep })}
          >
            Always keep
          </DropdownMenuCheckboxItem>
          <DropdownMenuItem onSelect={() => setPerkOpen(true)}>
            <Gift aria-hidden />
            {service.perk ? 'Edit perk' : 'Comes with another plan…'}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" onSelect={onRemove}>
            <Trash2 aria-hidden />
            Remove {service.name}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}

function ServiceRow(props: ServiceControlsProps & { providerName: (key: string) => string }) {
  const { service, providerName } = props;
  return (
    <tr
      aria-label={service.name}
      className={cn('hover:bg-muted/40', service.status === 'paused' && 'bg-muted/25')}
    >
      <td className="py-3 pr-4 pl-5">
        <ServiceName service={service} providerName={providerName} />
      </td>
      <td className="px-4 py-3">
        <StatusToggle {...props} />
      </td>
      <td className="px-4 py-3">
        <PlanSelect {...props} className="w-52" />
      </td>
      <td className="px-4 py-3">
        <PriceInput {...props} />
      </td>
      <td className="py-3 pr-5 pl-4 text-right">
        <ServiceMenu {...props} />
      </td>
    </tr>
  );
}

/** A service as a card: the phone layout of a table row. */
function ServiceCard(props: ServiceControlsProps & { providerName: (key: string) => string }) {
  const { service, providerName } = props;
  return (
    <li
      aria-label={service.name}
      className={cn(
        'surface space-y-3 p-4',
        service.status === 'paused' && 'bg-muted/40 shadow-none',
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <ServiceName service={service} providerName={providerName} />
        <ServiceMenu {...props} />
      </div>
      <PlanSelect {...props} className="w-full" />
      <div className="flex items-center justify-between gap-3">
        <StatusToggle {...props} />
        <PriceInput {...props} />
      </div>
    </li>
  );
}
