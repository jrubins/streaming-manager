import { useSuspenseQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { PageHeader } from '@/components/page-header';
import { PreferencesForm } from '@/features/preferences/preferences-form';
import { preferencesQueryOptions, useUpdatePreferences } from '@/features/preferences/queries';

export function PreferencesPage() {
  const { data: preferences } = useSuspenseQuery(preferencesQueryOptions);
  const update = useUpdatePreferences();

  return (
    <>
      <PageHeader
        title="Preferences"
        description="What your household needs from its plans. The plan is the cheapest set of plans that meets them."
      />
      <section aria-label="Preferences" className="surface p-6">
        <PreferencesForm
          value={preferences}
          pending={update.isPending}
          onChange={(changes) => update.mutate(changes)}
        />
      </section>
      <p className="mt-4 text-sm text-muted-foreground" role="status">
        {update.isPending
          ? 'Saving…'
          : update.isSuccess
            ? 'Saved. '
            : 'Changes save as you make them. '}
        {update.isPending ? null : (
          <Link to="/" className="font-medium text-primary hover:underline">
            See the plan
          </Link>
        )}
      </p>
    </>
  );
}
