import { isoToday, type RotationEntry } from '@app/shared';
import { cn } from 'cn';
import {
  ArrowRight,
  Gift,
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
import { describePerk } from '@/features/services/describe-perk';
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
  const { shows, channels, coveredBy, service, plannedCostCents } = row;
  // What it's needed for: titles on the list, and needed channels by name.
  const titles = shows.length === 1 ? '1 title' : `${shows.length} titles`;
  const channelList =
    channels.length <= 3
      ? formatList(channels)
      : `${channels.slice(0, 2).join(', ')} and ${channels.length - 2} more channels`;
  const what =
    channels.length === 0
      ? `${titles} on your list`
      : shows.length === 0
        ? channelList
        : `${titles} and ${channelList}`;
  switch (kindOf(row)) {
    case 'keep':
      if (service?.alwaysKeep) {
        return shows.length === 0 && channels.length === 0
          ? 'Always kept'
          : `Always kept · also covers ${what}`;
      }
      return `Needed for ${what}`;
    case 'switch': {
      const current = service?.monthlyPriceCents ?? null;
      return current !== null && plannedCostCents !== null && plannedCostCents < current
        ? `Same titles for ${formatPrice(current - plannedCostCents)} less`
        : 'To meet your preferences';
    }
    case 'resume':
      return `${channels.length === 0 ? titles : what} waiting for it`;
    case 'subscribe':
      return `Cheapest way to get ${channels.length === 0 ? titles : what}`;
    case 'pause':
    case 'paused':
      if (shows.length === 0 && channels.length === 0) {
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
  const perkPlan = row.plan?.perk ?? null;
  const planName = perkPlan?.planName ?? row.plan?.name ?? null;
  const name =
    row.planChange && planName ? (
      <span className="inline-flex items-center gap-1">
        {current ?? 'Current plan'}
        <ArrowRight className="size-3" aria-label="to" />
        <span className="font-medium text-foreground">{planName}</span>
      </span>
    ) : (
      <>{planName ?? current ?? 'No plan set'}</>
    );
  // A perk of a membership the household has, or one already on the service.
  const perkLine = perkPlan ? (
    <span className="flex items-center gap-1 text-xs font-medium text-primary">
      <Gift className="size-3 shrink-0" aria-hidden />
      {row.plan?.monthlyPriceCents === 0
        ? `Free with ${perkPlan.via}`
        : `${formatPrice(row.plan?.monthlyPriceCents ?? null)}/mo with ${perkPlan.via}`}
      <a
        href={perkPlan.url}
        target="_blank"
        rel="noopener noreferrer"
        className="ml-1 underline-offset-2 hover:underline"
      >
        Terms<span className="sr-only"> of the {perkPlan.via} offer</span>
      </a>
    </span>
  ) : row.service?.perk ? (
    <span className="flex items-center gap-1 text-xs font-medium text-primary">
      <Gift className="size-3 shrink-0" aria-hidden />
      {describePerk(row.service.perk, isoToday())}
    </span>
  ) : null;
  return perkLine ? (
    <span className="flex flex-col gap-0.5">
      <span>{name}</span>
      {perkLine}
    </span>
  ) : (
    name
  );
}

function Price({ row }: { row: ServicePlanRow }) {
  const inPlan = row.state === 'keep' || row.state === 'resume' || row.state === 'subscribe';
  // What the household pays now: a perk's price while it lasts.
  const current = row.service?.perk
    ? row.service.perk.monthlyPriceCents
    : (row.service?.monthlyPriceCents ?? null);
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

/** One subscription in the plan, as a card: the phone layout of a table row. */
function PlanCard({
  row,
  providerName,
  onDone,
  pending,
}: {
  row: ServicePlanRow;
  providerName: (key: string) => string;
  onDone: ((row: ServicePlanRow) => void) | undefined;
  pending: boolean;
}) {
  const { offering, state } = row;
  const { label, tone, icon: Icon } = KINDS[kindOf(row)];
  return (
    <li
      aria-label={offering.name}
      className={cn('surface space-y-3 p-4', state === 'paused' && 'bg-muted/40 shadow-none')}
    >
      <div className="flex items-start gap-3">
        <ServiceLogo
          service={offering}
          className={cn('size-10 rounded-xl', state === 'paused' && 'opacity-60 grayscale')}
        />
        <div className="min-w-0 flex-1">
          <p className="font-semibold">{offering.name}</p>
          <p className="text-xs text-muted-foreground">
            <PlanLine row={row} />
          </p>
          {offering.kind === 'bundle' ? (
            <p className="text-xs text-muted-foreground">
              Includes {formatList(offering.includes.map(providerName))}
            </p>
          ) : null}
        </div>
        <p className="text-right whitespace-nowrap">
          <Price row={row} />
        </p>
      </div>
      <div>
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
      </div>
      <div className="flex items-center justify-between gap-3">
        <ServiceTitles
          serviceName={offering.name}
          includes={offering.includes}
          shows={row.shows}
          providerName={providerName}
        />
        <ServiceRowMenu row={row} onDone={onDone} pending={pending} />
      </div>
    </li>
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
    <>
      <ul className="space-y-3 md:hidden" aria-label="Your services this month">
        {rows.map((row) => (
          <PlanCard
            key={row.offering.key}
            row={row}
            providerName={providerName}
            onDone={onDone}
            pending={pending}
          />
        ))}
        <li className="flex items-baseline justify-between px-1 pt-1 text-sm">
          <span className="font-medium">With this plan</span>
          <span>
            <span className="font-semibold tabular-nums">{formatPrice(plannedCostCents)}</span>
            <span className="text-xs text-muted-foreground">/mo</span>
          </span>
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
    </>
  );
}
