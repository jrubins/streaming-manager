import type { Membership, MembershipCategory } from '@app/shared';
import { cn } from 'cn';
import { Check } from 'lucide-react';

const CATEGORIES: { key: MembershipCategory; label: string }[] = [
  { key: 'internet', label: 'Internet & TV' },
  { key: 'mobile', label: 'Phone plans' },
  { key: 'shopping', label: 'Memberships' },
  { key: 'card', label: 'Credit cards' },
];

interface MembershipPickerProps {
  memberships: readonly Membership[];
  /** Keys of the ones the household has. */
  selected: ReadonlySet<string>;
  onToggle: (key: string) => void;
  pending?: boolean;
}

/** Which memberships with streaming perks the household has, by category. */
export function MembershipPicker({
  memberships,
  selected,
  onToggle,
  pending = false,
}: MembershipPickerProps) {
  return (
    <div className="space-y-4">
      {CATEGORIES.map((category) => {
        const items = memberships.filter((m) => m.category === category.key);
        if (items.length === 0) return null;
        return (
          <div key={category.key} role="group" aria-label={category.label}>
            <h3 className="mb-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">
              {category.label}
            </h3>
            <div className="flex flex-wrap gap-2">
              {items.map((membership) => {
                const on = selected.has(membership.key);
                return (
                  <button
                    key={membership.key}
                    type="button"
                    aria-pressed={on}
                    disabled={pending}
                    onClick={() => onToggle(membership.key)}
                    className={cn(
                      'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors disabled:opacity-60',
                      on
                        ? 'border-primary bg-primary/10 text-foreground'
                        : 'bg-card text-muted-foreground hover:text-foreground',
                    )}
                  >
                    {on ? <Check className="size-3.5 text-primary" aria-hidden /> : null}
                    {membership.name}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
