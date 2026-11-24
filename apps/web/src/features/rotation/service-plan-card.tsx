import type { RotationState, Service, WatchlistShow } from '@app/shared';
import { cn } from 'cn';
import { Check, CirclePause, CirclePlay, Moon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatList, formatPrice } from '@/lib/format';
import { PosterStrip } from './poster-strip';

const STATE_LABELS: Record<RotationState, string> = {
  keep: 'Keep',
  pause: 'Pause',
  resume: 'Resume',
  paused: 'Paused',
};

const STATE_STYLES: Record<RotationState, { badge: string; icon: typeof Check }> = {
  keep: { badge: 'bg-keep-soft text-keep', icon: Check },
  pause: { badge: 'bg-pause-soft text-pause', icon: CirclePause },
  resume: { badge: 'bg-resume-soft text-resume', icon: CirclePlay },
  paused: { badge: 'bg-muted text-muted-foreground', icon: Moon },
};

interface ServicePlanCardProps {
  service: Service;
  state: RotationState;
  /** Unwatched titles that stream on this service. */
  shows: readonly WatchlistShow[];
  /** For a service to pause: the planned services its titles are also on. */
  coveredBy?: readonly string[];
  /** Records that the member paused or resumed the service as the plan says. */
  onDone?: () => void;
  pending?: boolean;
}

function explain(state: RotationState, shows: number, coveredBy: readonly string[]): string {
  const titles = shows === 1 ? '1 title' : `${shows} titles`;
  switch (state) {
    case 'keep':
      return `Needed for ${titles} on your list`;
    case 'resume':
      return `${titles} waiting for it`;
    case 'pause':
    case 'paused':
      if (shows === 0) {
        return state === 'pause'
          ? 'Nothing on your list streams here'
          : 'Nothing on your list needs it';
      }
      return `${shows === 1 ? 'Its title is' : `All ${titles} are`} also on ${formatList(coveredBy)}`;
  }
}

/** One service in the month's plan: what to do with it, and why. */
export function ServicePlanCard({
  service,
  state,
  shows,
  coveredBy = [],
  onDone,
  pending = false,
}: ServicePlanCardProps) {
  const { badge, icon: Icon } = STATE_STYLES[state];
  const actionable = state === 'pause' || state === 'resume';
  return (
    <article
      aria-label={service.name}
      className={cn(
        'flex flex-col gap-4 rounded-xl border bg-card p-4 shadow-sm',
        state === 'paused' && 'bg-muted/40 shadow-none',
      )}
    >
      <header className="flex items-start gap-3">
        {service.logoUrl ? (
          <img src={service.logoUrl} alt="" className="size-11 shrink-0 rounded-lg" />
        ) : (
          <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-muted font-semibold">
            {service.name.slice(0, 1)}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-semibold">{service.name}</h3>
          <p className="truncate text-sm text-muted-foreground">
            {service.planName ?? 'No plan set'} · {formatPrice(service.monthlyPriceCents)}/mo
          </p>
        </div>
        <span
          className={cn(
            'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold',
            badge,
          )}
        >
          <Icon className="size-3.5" aria-hidden />
          {STATE_LABELS[state]}
        </span>
      </header>

      <p className="text-sm">{explain(state, shows.length, coveredBy)}</p>
      <PosterStrip shows={shows} muted={state === 'pause' || state === 'paused'} />

      {actionable && onDone ? (
        <Button
          variant={state === 'resume' ? 'default' : 'outline'}
          size="sm"
          className="mt-auto self-start"
          disabled={pending}
          onClick={onDone}
        >
          {state === 'pause' ? `I've paused ${service.name}` : `I've resumed ${service.name}`}
        </Button>
      ) : null}
    </article>
  );
}
