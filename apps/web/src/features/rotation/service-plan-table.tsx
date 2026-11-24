import type { RotationEntry } from '@app/shared';
import { cn } from 'cn';
import {
  ArrowRight,
  Check,
  CircleCheck,
  CirclePause,
  CirclePlay,
  CirclePlus,
  ExternalLink,
  Moon,
  MoreHorizontal,
  Repeat,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { formatList, formatPrice } from '@/lib/format';
import { manageLink } from '@/lib/manage-link';
import { ServiceLogo } from './service-logo';
import { ServiceTitles } from './service-titles';

export interface ServicePlanRow extends RotationEntry {
  /** For a subscription left out of the plan: the planned ones its titles are also on. */
  coveredBy: readonly string[];
}

type RowKind = 'keep' | 'switch' | 'pause' | 'resume' | 'paused' | 'subscribe';

const KINDS: Record<RowKind, { label: string; tone: string; icon: typeof Check }> = {
  keep: { label: 'Keep', tone: 'bg-keep-soft text-keep', icon: Check },
  switch: { label: 'Switch plan', tone: 'bg-resume-soft text-resume', icon: Repeat },
  pause: { label: 'Pause', tone: 'bg-pause-soft text-pause', icon: CirclePause },
  resume: { label: 'Resume', tone: 'bg-resume-soft text-resume', icon: CirclePlay },
  paused: { label: 'Stay paused', tone: 'bg-muted text-muted-foreground', icon: Moon },
  subscribe: { label: 'Subscribe', tone: 'bg-accent text-accent-foreground', icon: CirclePlus },
};

const kindOf = (row: RotationEntry): RowKind =>
  row.state === 'keep' && row.planChange ? 'switch' : row.state;

/** The action to take at the service, as the menu and "Mark as…" name it. */
const ACTIONS: Record<RowKind, { verb: string; mark: string | null }> = {
  keep: { verb: 'Manage', mark: null },
  switch: { verb: 'Change plan', mark: 'Mark plan as changed' },
  pause: { verb: 'Pause', mark: 'Mark as paused' },
  resume: { verb: 'Resume', mark: 'Mark as resumed' },
  paused: { verb: 'Manage', mark: null },
  subscribe: { verb: 'Subscribe', mark: 'Mark as subscribed' },
};

interface ServicePlanTableProps {
  rows: readonly ServicePlanRow[];
  /** Provider key → display name, for where else a title streams. */
  providerName: (key: string) => string;
  plannedCostCents: number;
  /** Records that the member made the change at the service (paused, resumed, …). */
  onDone?: (row: ServicePlanRow) => void;
  pending?: boolean;
}

function explain(row: ServicePlanRow): string {
  const { shows, coveredBy, service, plannedCostCents } = row;
  const titles = shows.length === 1 ? '1 title' : `${shows.length} titles`;
  switch (kindOf(row)) {
    case 'keep':
      return `Needed for ${titles} on your list`;
    case 'switch': {
      const current = service?.monthlyPriceCents ?? null;
      return current !== null && plannedCostCents !== null && plannedCostCents < current
        ? `Same titles for ${formatPrice(current - plannedCostCents)} less`
        : 'To meet your preferences';
    }
    case 'resume':
      return `${titles} waiting for it`;
    case 'subscribe':
      return `Cheapest way to watch ${titles}`;
    case 'pause':
    case 'paused':
      if (shows.length === 0) {
        return row.state === 'pause'
          ? 'Nothing on your list streams here'
          : 'Nothing on your list needs it';
      }
      if (coveredBy.length === 0) return 'No plan here meets your preferences';
      return `${shows.length === 1 ? 'Its title is' : `All ${titles} are`} also on ${formatList(coveredBy)}`;
  }
}

/** The plan line under the name: the plan to be on, or the switch from one to another. */
function PlanLine({ row }: { row: ServicePlanRow }) {
  const current = row.service?.planName ?? null;
  if (row.planChange && row.plan) {
    return (
      <span className="inline-flex items-center gap-1">
        {current ?? 'Current plan'}
        <ArrowRight className="size-3" aria-label="to" />
        <span className="font-medium text-foreground">{row.plan.name}</span>
      </span>
    );
  }
  return <>{row.plan?.name ?? current ?? 'No plan set'}</>;
}

function Price({ row }: { row: ServicePlanRow }) {
  const inPlan = row.state === 'keep' || row.state === 'resume' || row.state === 'subscribe';
  const current = row.service?.monthlyPriceCents ?? null;
  const cents = inPlan ? (row.plannedCostCents ?? current) : current;
  return (
    <>
      {row.planChange && current !== null && current !== cents ? (
        <span className="mr-1.5 text-xs text-muted-foreground tabular-nums line-through">
          {formatPrice(current)}
        </span>
      ) : null}
      <span className={cn('font-semibold tabular-nums', !inPlan && 'text-muted-foreground')}>
        {formatPrice(cents)}
      </span>
      <span className="text-xs text-muted-foreground">/mo</span>
    </>
  );
}

function ServiceRowMenu({
  row,
  onDone,
  pending,
}: {
  row: ServicePlanRow;
  onDone: ((row: ServicePlanRow) => void) | undefined;
  pending: boolean;
}) {
  const { offering } = row;
  const { verb, mark } = ACTIONS[kindOf(row)];
  const link = manageLink(offering);
  const linkLabel = link.site
    ? `${verb} on ${link.site}`
    : `Find how to ${verb.toLowerCase()} ${offering.name}`;
  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          disabled={pending}
          aria-label={`${offering.name} actions`}
        >
          <MoreHorizontal aria-hidden />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-56">
        <DropdownMenuLabel className="text-xs text-muted-foreground">
          {offering.name}
        </DropdownMenuLabel>
        <DropdownMenuItem asChild>
          <a href={link.href} target="_blank" rel="noopener noreferrer">
            <ExternalLink aria-hidden />
            {linkLabel}
          </a>
        </DropdownMenuItem>
        {mark && onDone ? (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => onDone(row)}>
              <CircleCheck aria-hidden />
              {mark}
            </DropdownMenuItem>
          </>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/** The month's plan for every subscription: what to do with it, why, and what it costs. */
export function ServicePlanTable({
  rows,
  providerName,
  plannedCostCents,
  onDone,
  pending = false,
}: ServicePlanTableProps) {
  return (
    <div className="surface overflow-x-auto">
      <table className="w-full min-w-[760px] text-sm">
        <thead>
          <tr className="border-b text-left text-xs font-medium tracking-wide text-muted-foreground uppercase">
            <th scope="col" className="py-3 pr-4 pl-5 font-medium">
              Service
            </th>
            <th scope="col" className="px-4 py-3 font-medium">
              This month
            </th>
            <th scope="col" className="px-4 py-3 font-medium">
              Titles
            </th>
            <th scope="col" className="px-4 py-3 text-right font-medium">
              Price
            </th>
            <th scope="col" className="py-3 pr-5 pl-4">
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {rows.map((row) => {
            const { offering, state } = row;
            const { label, tone, icon: Icon } = KINDS[kindOf(row)];
            return (
              <tr
                key={offering.key}
                aria-label={offering.name}
                className={cn(
                  'transition-colors hover:bg-muted/40',
                  state === 'paused' && 'bg-muted/25',
                )}
              >
                <td className="py-3.5 pr-4 pl-5">
                  <div className="flex items-center gap-3">
                    <ServiceLogo
                      service={offering}
                      className={cn(
                        'size-10 rounded-xl',
                        state === 'paused' && 'opacity-60 grayscale',
                      )}
                    />
                    <div className="min-w-0">
                      <p className="truncate font-semibold">{offering.name}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        <PlanLine row={row} />
                      </p>
                      {offering.kind === 'bundle' ? (
                        <p className="truncate text-xs text-muted-foreground">
                          Includes {formatList(offering.includes.map(providerName))}
                        </p>
                      ) : null}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3.5">
                  <span
                    className={cn(
                      'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold',
                      tone,
                    )}
                  >
                    <Icon className="size-3.5" aria-hidden />
                    {label}
                  </span>
                  <p className="mt-1.5 text-xs text-muted-foreground">{explain(row)}</p>
                </td>
                <td className="px-4 py-3.5">
                  <ServiceTitles
                    serviceName={offering.name}
                    includes={offering.includes}
                    shows={row.shows}
                    providerName={providerName}
                  />
                </td>
                <td className="px-4 py-3.5 text-right whitespace-nowrap">
                  <Price row={row} />
                </td>
                <td className="py-3.5 pr-5 pl-4 text-right">
                  <ServiceRowMenu row={row} onDone={onDone} pending={pending} />
                </td>
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr className="border-t bg-muted/30">
            <th scope="row" colSpan={3} className="py-3 pr-4 pl-5 text-left font-medium">
              With this plan
            </th>
            <td className="px-4 py-3 text-right">
              <span className="font-semibold tabular-nums">{formatPrice(plannedCostCents)}</span>
              <span className="text-xs text-muted-foreground">/mo</span>
            </td>
            <td />
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
