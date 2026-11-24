import { useQuery, useSuspenseQuery } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { HouseholdSettings } from '@/features/household/household-settings';
import { InviteCard } from '@/features/household/invite-card';
import { JoinHouseholdForm } from '@/features/household/join-household-form';
import { MembersList } from '@/features/household/members-list';
import {
  householdQueryOptions,
  regionsQueryOptions,
  useJoinHousehold,
  useLeaveHousehold,
  useNewInviteCode,
  useUpdateHousehold,
} from '@/features/household/queries';
import { ApiRequestError } from '@/lib/api';

function Panel({ title, children }: { title: string; children: ReactNode }) {
  const id = `panel-${title.toLowerCase().replace(/\W+/g, '-')}`;
  return (
    <section aria-labelledby={id} className="surface p-6">
      <h2 id={id} className="mb-4 font-semibold">
        {title}
      </h2>
      {children}
    </section>
  );
}

export function HouseholdPage() {
  const { data: household } = useSuspenseQuery(householdQueryOptions);
  const regions = useQuery(regionsQueryOptions);
  const update = useUpdateHousehold();
  const join = useJoinHousehold();
  const leave = useLeaveHousehold();
  const newCode = useNewInviteCode();

  const joinError =
    join.error instanceof ApiRequestError
      ? join.error.message
      : join.error
        ? 'Could not join. Try again.'
        : null;

  return (
    <>
      <PageHeader
        title="Household"
        description="Everyone in a household shares its services, watchlist and plan."
      />
      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Settings">
          <HouseholdSettings
            key={`${household.name}:${household.region}`}
            name={household.name}
            region={household.region}
            regions={regions.data ?? []}
            pending={update.isPending}
            onSave={(changes) => update.mutate(changes)}
          />
        </Panel>
        <Panel title={`Members (${household.members.length})`}>
          <MembersList members={household.members} />
          {household.members.length > 1 ? (
            <Button
              variant="outline"
              className="mt-5"
              disabled={leave.isPending}
              onClick={() => leave.mutate()}
            >
              Leave this household
            </Button>
          ) : null}
        </Panel>
        <Panel title="Invite someone">
          <InviteCard
            inviteCode={household.inviteCode}
            pending={newCode.isPending}
            onNewCode={() => newCode.mutate()}
          />
        </Panel>
        <Panel title="Join another household">
          <JoinHouseholdForm
            error={joinError}
            onSubmit={(values) =>
              // The error is shown from `join.error`.
              join.mutateAsync(values).catch(() => undefined)
            }
          />
        </Panel>
      </div>
    </>
  );
}
