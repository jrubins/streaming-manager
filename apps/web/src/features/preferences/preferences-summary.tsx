import type { Preferences } from '@app/shared';
import { Link } from '@tanstack/react-router';
import { SlidersHorizontal } from 'lucide-react';
import { describePreferences } from './describe-preferences';

/** The preferences the plan was made for, with a link to change them. */
export function PreferencesSummary({ preferences }: { preferences: Preferences }) {
  return (
    <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
      <SlidersHorizontal className="size-4" aria-hidden />
      <span>Planned for: {describePreferences(preferences)}</span>
      <Link to="/preferences" className="font-medium text-primary hover:underline">
        Change preferences
      </Link>
    </p>
  );
}
