import type { CatalogProvider, Service, ServiceStatus, UpdateService } from '@app/shared';
import { cn } from 'cn';
import { Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
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

const CUSTOM = '__custom__';

interface ServiceEditorProps {
  service: Service;
  /** Known plans for this service (empty when its prices aren't known). */
  plans: CatalogProvider['plans'];
  onChange: (changes: UpdateService) => void;
  onRemove: () => void;
  pending?: boolean;
}

const SOURCE_LABELS = {
  catalog: 'Published price',
  manual: 'Entered by you',
  invoice: 'From an invoice',
} as const;

/** One of the household's services: its status, plan and monthly price. */
export function ServiceEditor({
  service,
  plans,
  onChange,
  onRemove,
  pending = false,
}: ServiceEditorProps) {
  const [price, setPrice] = useState(
    service.monthlyPriceCents === null ? '' : (service.monthlyPriceCents / 100).toFixed(2),
  );
  const planValue =
    service.planName && plans.some((p) => p.name === service.planName) ? service.planName : CUSTOM;

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
    <article
      aria-label={service.name}
      className="flex flex-wrap items-center gap-x-5 gap-y-4 rounded-2xl border bg-card p-4 shadow-sm"
    >
      <div className="flex min-w-48 flex-1 items-center gap-3">
        <ServiceLogo service={service} />
        <div className="min-w-0">
          <h3 className="truncate font-semibold">{service.name}</h3>
          <p className="text-xs text-muted-foreground">
            {service.priceSource ? SOURCE_LABELS[service.priceSource] : 'No price yet'}
          </p>
        </div>
      </div>

      <div
        role="group"
        aria-label={`${service.name} status`}
        className="flex rounded-lg bg-muted p-1"
      >
        {(['active', 'paused'] as const).map((status) => (
          <button
            key={status}
            type="button"
            aria-pressed={service.status === status}
            disabled={pending}
            onClick={() => setStatus(status)}
            className={cn(
              'rounded-md px-3 py-1 text-sm font-medium text-muted-foreground transition-colors',
              service.status === status && 'bg-background text-foreground shadow-sm',
            )}
          >
            {status === 'active' ? 'Active' : 'Paused'}
          </button>
        ))}
      </div>

      {plans.length > 0 ? (
        <Select
          value={planValue}
          disabled={pending}
          onValueChange={(value) => {
            if (value !== CUSTOM) onChange({ planName: value });
          }}
        >
          <SelectTrigger className="w-56" aria-label={`${service.name} plan`}>
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
      ) : null}

      <div className="relative w-32">
        <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm text-muted-foreground">
          $
        </span>
        <Input
          aria-label={`${service.name} monthly price`}
          inputMode="decimal"
          placeholder="0.00"
          className="pr-10 pl-6 tabular-nums"
          value={price}
          disabled={pending}
          onChange={(event) => setPrice(event.target.value)}
          onBlur={savePrice}
          onKeyDown={(event) => {
            if (event.key === 'Enter') event.currentTarget.blur();
          }}
        />
        <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-xs text-muted-foreground">
          /mo
        </span>
      </div>

      <Button
        variant="ghost"
        size="icon"
        disabled={pending}
        onClick={onRemove}
        aria-label={`Remove ${service.name}`}
        title="Remove"
      >
        <Trash2 aria-hidden />
      </Button>
    </article>
  );
}
