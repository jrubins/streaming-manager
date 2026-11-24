import type { RotationState, Service, WatchlistShow } from '@app/shared';
import { cn } from 'cn';
import { Check, CircleCheck, CirclePause, CirclePlay, Moon, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { formatList, formatPrice } from '@/lib/format';
import { Poster } from './poster-strip';
import { ServiceLogo } from './service-logo';

const STATES: Record<RotationState, { label: string; tone: string; icon: typeof Check }> = {
  keep: { label: 'Keep', tone: 'bg-keep-soft text-keep', icon: Check },
  pause: { label: 'Pause', tone: 'bg-pause-soft text-pause', icon: CirclePause },
  resume: { label: 'Resume', tone: 'bg-resume-soft text-resume', icon: CirclePlay },
  paused: { label: 'Stay paused', tone: 'bg-muted text-muted-foreground', icon: Moon },
};

export interface ServicePlanRow {
  service: Service;
  state: RotationState;
  /** Unwatched titles that stream on this service. */
  shows: readonly WatchlistShow[];
  /** For a service left out of the plan: the planned services its titles are also on. */
  coveredBy: readonly string[];
}

interface ServicePlanTableProps {
  rows: readonly ServicePlanRow[];
  plannedCostCents: number;
  /** Records that the member paused or resumed a service as the plan says. */
  onDone?: (row: ServicePlanRow) => void;
  pending?: boolean;
}

function explain({ state, shows, coveredBy }: ServicePlanRow): string {
  const titles = shows.length === 1 ? '1 title' : `${shows.length} titles`;
  switch (state) {
    case 'keep':
      return `Needed for ${titles} on your list`;
    case 'resume':
      return `${titles} waiting for it`;
    case 'pause':
    case 'paused':
      if (shows.length === 0) {
        return state === 'pause'
          ? 'Nothing on your list streams here'
          : 'Nothing on your list needs it';
      }
      return `${shows.length === 1 ? 'Its title is' : `All ${titles} are`} also on ${formatList(coveredBy)}`;
  }
}

/** Overlapping posters of the titles on a service, with "+N" past `max`. */
function PosterStack({ shows, max = 4 }: { shows: readonly WatchlistShow[]; max?: number }) {
  if (shows.length === 0) return <span className="text-sm text-muted-foreground">—</span>;
  const hidden = shows.length - max;
  return (
    <ul
      className="flex items-center"
      aria-label={`Titles: ${formatList(shows.map((s) => s.title))}`}
    >
      {shows.slice(0, max).map((show, index) => (
        <li key={show.id} className={cn('w-9 shrink-0', index > 0 && '-ml-3')} title={show.title}>
          <Poster show={show} className="rounded-md ring-2 ring-card" />
        </li>
      ))}
      {hidden > 0 ? (
        <li className="-ml-3 flex aspect-[2/3] w-9 shrink-0 items-center justify-center rounded-md bg-muted text-xs font-medium text-muted-foreground ring-2 ring-card">
          +{hidden}
        </li>
      ) : null}
    </ul>
  );
}

/** The month's plan for every service: what to do with it, why, and what it costs. */
export function ServicePlanTable({
  rows,
  plannedCostCents,
  onDone,
  pending = false,
}: ServicePlanTableProps) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-border/70 bg-card shadow-[0_1px_2px_rgb(0_0_0/0.04),0_4px_16px_-6px_rgb(0_0_0/0.06)]">
      <table className="w-full min-w-[720px] text-sm">
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
            const { service, state } = row;
            const { label, tone, icon: Icon } = STATES[state];
            const outOfPlan = state === 'pause' || state === 'paused';
            return (
              <tr
                key={service.id}
                aria-label={service.name}
                className={cn(
                  'transition-colors hover:bg-muted/40',
                  state === 'paused' && 'bg-muted/25',
                )}
              >
                <td className="py-3.5 pr-4 pl-5">
                  <div className="flex items-center gap-3">
                    <ServiceLogo
                      service={service}
                      className={cn(
                        'size-10 rounded-xl',
                        state === 'paused' && 'opacity-60 grayscale',
                      )}
                    />
                    <div className="min-w-0">
                      <p className="truncate font-semibold">{service.name}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {service.planName ?? 'No plan set'}
                      </p>
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
                  <PosterStack shows={row.shows} />
                </td>
                <td className="px-4 py-3.5 text-right">
                  <span
                    className={cn(
                      'font-semibold tabular-nums',
                      outOfPlan && 'text-muted-foreground',
                    )}
                  >
                    {formatPrice(service.monthlyPriceCents)}
                  </span>
                  <span className="text-xs text-muted-foreground">/mo</span>
                </td>
                <td className="py-3.5 pr-5 pl-4 text-right">
                  {onDone && (state === 'pause' || state === 'resume') ? (
                    <DropdownMenu>
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
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onSelect={() => onDone(row)}>
                          <CircleCheck aria-hidden />
                          {state === 'pause' ? 'Mark as paused' : 'Mark as resumed'}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  ) : null}
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
