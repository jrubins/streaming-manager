import type { PlanAlternative, UpdatePreferences } from '@app/shared';
import { cn } from 'cn';
import { Button } from '@/components/ui/button';
import { formatPrice } from '@/lib/format';

interface PlanAlternativesProps {
  alternatives: readonly PlanAlternative[];
  /** Titles the current plan leaves uncovered, to say when an option covers fewer. */
  uncoveredCount: number;
  /** Switches the household's preferences to an alternative's. */
  onChoose: (preferences: UpdatePreferences) => void;
  pending?: boolean;
}

const fewer = (n: number) => (n === 1 ? '1 title fewer' : `${n} titles fewer`);

/** The plan under other preferences: what each would cost and change. */
export function PlanAlternatives({
  alternatives,
  uncoveredCount,
  onChoose,
  pending = false,
}: PlanAlternativesProps) {
  return (
    <ul className="grid gap-3 md:grid-cols-2" aria-label="Other options">
      {alternatives.map((alternative) => {
        const { deltaCents } = alternative;
        return (
          <li
            key={alternative.id}
            aria-label={alternative.label}
            className="surface flex flex-col gap-3 p-4"
          >
            <div className="flex items-baseline justify-between gap-4">
              <h3 className="font-semibold">{alternative.label}</h3>
              <p className="text-right whitespace-nowrap">
                <span
                  className={cn(
                    'font-semibold tabular-nums',
                    deltaCents < 0 && 'text-keep',
                    deltaCents > 0 && 'text-pause',
                  )}
                >
                  {deltaCents === 0
                    ? 'Same price'
                    : `${deltaCents > 0 ? '+' : '−'}${formatPrice(Math.abs(deltaCents))}/mo`}
                </span>
                <span className="block text-xs text-muted-foreground">
                  {formatPrice(alternative.plannedCostCents)}/mo in total
                </span>
              </p>
            </div>
            <p className="text-sm text-muted-foreground">
              {alternative.changes || 'Same subscriptions'}
              {alternative.uncoveredCount > uncoveredCount
                ? ` · covers ${fewer(alternative.uncoveredCount - uncoveredCount)}`
                : ''}
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-auto self-start"
              disabled={pending}
              onClick={() => onChoose(alternative.preferences)}
              aria-label={`Use this option: ${alternative.label}`}
            >
              Use this option
            </Button>
          </li>
        );
      })}
    </ul>
  );
}
