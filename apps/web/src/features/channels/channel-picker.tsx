import type { Channel, ChannelCategory } from '@app/shared';
import { cn } from 'cn';
import { Check, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

const CATEGORIES: { key: ChannelCategory; label: string; starter: string }[] = [
  { key: 'local', label: 'Local channels', starter: 'Add the big four' },
  { key: 'sports', label: 'Sports', starter: 'Add the usual sports channels' },
  { key: 'leagues', label: 'League passes', starter: '' },
  { key: 'news', label: 'News', starter: 'Add the usual news channels' },
  { key: 'entertainment', label: 'Entertainment', starter: 'Add the usual entertainment' },
  { key: 'kids', label: 'Kids', starter: 'Add the usual kids channels' },
];

interface ChannelPickerProps {
  channels: readonly Channel[];
  /** Keys of the channels the household needs. */
  selected: ReadonlySet<string>;
  onChange: (selected: string[]) => void;
  pending?: boolean;
}

/** The channels a household needs, by category, with a usual set per category to start. */
export function ChannelPicker({
  channels,
  selected,
  onChange,
  pending = false,
}: ChannelPickerProps) {
  const toggle = (key: string) => {
    const next = new Set(selected);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    onChange([...next]);
  };
  return (
    <div className="space-y-6">
      {CATEGORIES.map((category) => {
        const items = channels.filter((c) => c.category === category.key);
        if (items.length === 0) return null;
        const missingStarters = items.filter((c) => c.starter && !selected.has(c.key));
        const headingId = `channels-${category.key}`;
        return (
          <section key={category.key} aria-labelledby={headingId} className="surface p-5">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <h2 id={headingId} className="font-semibold">
                {category.label}
              </h2>
              {category.starter && missingStarters.length > 0 ? (
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={pending}
                  onClick={() => onChange([...selected, ...missingStarters.map((c) => c.key)])}
                >
                  <Plus aria-hidden />
                  {category.starter}
                </Button>
              ) : null}
            </div>
            <div role="group" aria-label={category.label} className="flex flex-wrap gap-2">
              {items.map((channel) => {
                const on = selected.has(channel.key);
                return (
                  <button
                    key={channel.key}
                    type="button"
                    aria-pressed={on}
                    disabled={pending}
                    onClick={() => toggle(channel.key)}
                    className={cn(
                      'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors disabled:opacity-60',
                      on
                        ? 'border-primary bg-primary/10 text-foreground'
                        : 'bg-card text-muted-foreground hover:text-foreground',
                    )}
                  >
                    {on ? <Check className="size-3.5 text-primary" aria-hidden /> : null}
                    {channel.name}
                  </button>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}
