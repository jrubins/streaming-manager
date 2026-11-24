import type { Preferences, UpdatePreferences } from '@app/shared';
import { cn } from 'cn';
import type { ReactNode } from 'react';

interface PreferencesFormProps {
  value: Preferences;
  /** Called with each change as it's made (the page saves it straight away). */
  onChange: (changes: UpdatePreferences) => void;
  pending?: boolean;
}

interface Choice<T> {
  value: T;
  label: string;
  hint?: string;
}

/** One preference: a question and its choices, as a row of toggle buttons. */
function ChoiceRow<T extends string | number | boolean>({
  title,
  description,
  choices,
  value,
  onSelect,
  pending,
}: {
  title: string;
  description: ReactNode;
  choices: readonly Choice<T>[];
  value: T;
  onSelect: (value: T) => void;
  pending: boolean;
}) {
  return (
    <div className="flex flex-col gap-3 py-5 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between sm:gap-8">
      <div className="max-w-md">
        <h3 className="font-medium">{title}</h3>
        <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
      </div>
      <div role="group" aria-label={title} className="inline-flex shrink-0 rounded-lg bg-muted p-1">
        {choices.map((choice) => (
          <button
            key={String(choice.value)}
            type="button"
            aria-pressed={value === choice.value}
            disabled={pending}
            onClick={() => {
              if (value !== choice.value) onSelect(choice.value);
            }}
            title={choice.hint}
            className={cn(
              'rounded-md px-3 py-1.5 text-sm font-medium whitespace-nowrap text-muted-foreground transition-colors hover:text-foreground disabled:opacity-60',
              value === choice.value && 'bg-card text-foreground shadow-sm',
            )}
          >
            {choice.label}
          </button>
        ))}
      </div>
    </div>
  );
}

/** What the household needs from its plans. Every choice changes the plan. */
export function PreferencesForm({ value, onChange, pending = false }: PreferencesFormProps) {
  return (
    <div className="divide-y">
      <ChoiceRow
        title="Ads"
        description="Ad-supported plans are often half the price."
        choices={[
          { value: true, label: 'Ads are fine' },
          { value: false, label: 'No ads' },
        ]}
        value={value.allowAds}
        onSelect={(allowAds) => onChange({ allowAds })}
        pending={pending}
      />
      <ChoiceRow
        title="Screens at once"
        description="How many people watch at the same time, on different devices."
        choices={[1, 2, 3, 4].map((n) => ({ value: n, label: n === 4 ? '4+' : String(n) }))}
        value={Math.min(value.minStreams, 4)}
        onSelect={(minStreams) => onChange({ minStreams })}
        pending={pending}
      />
      <ChoiceRow
        title="Picture quality"
        description="4K usually needs a service's top plan."
        choices={[
          { value: false, label: 'HD is fine' },
          { value: true, label: '4K' },
        ]}
        value={value.require4k}
        onSelect={(require4k) => onChange({ require4k })}
        pending={pending}
      />
      <ChoiceRow
        title="Downloads"
        description="Watching offline, on a plane or a commute."
        choices={[
          { value: false, label: 'Not needed' },
          { value: true, label: 'Needed' },
        ]}
        value={value.requireDownloads}
        onSelect={(requireDownloads) => onChange({ requireDownloads })}
        pending={pending}
      />
      <ChoiceRow
        title="New services"
        description="Suggest services and bundles you don't have when they're the cheapest way to watch your list."
        choices={[
          { value: true, label: 'Suggest them' },
          { value: false, label: 'Only ours' },
        ]}
        value={value.suggestNewServices}
        onSelect={(suggestNewServices) => onChange({ suggestNewServices })}
        pending={pending}
      />
    </div>
  );
}
