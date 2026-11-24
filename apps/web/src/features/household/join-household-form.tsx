import { JoinHouseholdSchema, type JoinHousehold } from '@app/shared';
import { useForm } from '@tanstack/react-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface JoinHouseholdFormProps {
  onSubmit: (values: JoinHousehold) => Promise<unknown>;
  /** Shown under the field, e.g. "No household has that invite code". */
  error?: string | null;
}

/** Joins another household with its invite code. */
export function JoinHouseholdForm({ onSubmit, error = null }: JoinHouseholdFormProps) {
  const form = useForm({
    defaultValues: { inviteCode: '' },
    validators: { onSubmit: JoinHouseholdSchema },
    onSubmit: async ({ value }) => {
      await onSubmit(value);
    },
  });

  return (
    <form
      className="space-y-2"
      onSubmit={(event) => {
        event.preventDefault();
        void form.handleSubmit();
      }}
    >
      <form.Field name="inviteCode">
        {(field) => {
          const message = field.state.meta.errors[0]?.message ?? error;
          return (
            <>
              <Label htmlFor={field.name}>Invite code</Label>
              <div className="flex gap-2">
                <Input
                  id={field.name}
                  placeholder="ABCDE-23456"
                  className="font-mono uppercase"
                  value={field.state.value}
                  aria-invalid={message ? true : undefined}
                  aria-describedby={message ? `${field.name}-error` : undefined}
                  onBlur={field.handleBlur}
                  onChange={(event) => field.handleChange(event.target.value)}
                />
                <form.Subscribe selector={(state) => state.isSubmitting}>
                  {(submitting) => (
                    <Button type="submit" disabled={submitting}>
                      Join
                    </Button>
                  )}
                </form.Subscribe>
              </div>
              {message ? (
                <p id={`${field.name}-error`} className="text-sm text-destructive">
                  {message}
                </p>
              ) : null}
            </>
          );
        }}
      </form.Field>
      <p className="text-xs text-muted-foreground">
        You'll share that household's services and watchlist. If you're the only member here, this
        household and its data are deleted.
      </p>
    </form>
  );
}
