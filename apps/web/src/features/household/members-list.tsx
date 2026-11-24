import type { HouseholdMember } from '@app/shared';

const joined = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
});

/** The people sharing this household. */
export function MembersList({ members }: { members: readonly HouseholdMember[] }) {
  return (
    <ul className="divide-y" aria-label="Members">
      {members.map((member, index) => {
        const name = member.displayName ?? `Member ${index + 1}`;
        return (
          <li key={member.userId} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
            <span
              aria-hidden
              className="flex size-9 items-center justify-center rounded-full bg-accent text-sm font-semibold text-accent-foreground"
            >
              {name.slice(0, 1).toUpperCase()}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate font-medium">
                {name}
                {member.isYou ? <span className="text-muted-foreground"> (you)</span> : null}
              </span>
              <span className="block text-xs text-muted-foreground">
                Joined {joined.format(new Date(member.joinedAt))}
              </span>
            </span>
          </li>
        );
      })}
    </ul>
  );
}
