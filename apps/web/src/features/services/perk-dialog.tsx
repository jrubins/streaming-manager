import { PerkFormSchema, perkFromForm, type ServicePerk } from '@app/shared';
import { useForm } from '@tanstack/react-form';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface PerkDialogProps {
  serviceName: string;
  perk: ServicePerk | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Saves the perk, or removes it (null). */
  onSave: (perk: ServicePerk | null) => void;
}

/** Record that a service comes free or discounted with something else, and until when. */
export function PerkDialog({ serviceName, perk, open, onOpenChange, onSave }: PerkDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{serviceName} comes with another plan</DialogTitle>
          <DialogDescription>
            For a service you get free or discounted through your internet, phone plan or a
            membership. The plan counts what you pay while it lasts, then the regular price.
          </DialogDescription>
        </DialogHeader>
        {/* Mounted only while open, so it starts from the saved perk each time. */}
        {open ? (
          <PerkForm
            perk={perk}
            onSave={(next) => {
              onSave(next);
              onOpenChange(false);
            }}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function PerkForm({
  perk,
  onSave,
}: {
  perk: ServicePerk | null;
  onSave: (perk: ServicePerk | null) => void;
}) {
  const form = useForm({
    defaultValues: {
      via: perk?.via ?? '',
      price: perk ? (perk.monthlyPriceCents / 100).toFixed(2) : '0',
      endsOn: perk?.endsOn ?? '',
    },
    validators: { onSubmit: PerkFormSchema },
    onSubmit: ({ value }) => onSave(perkFromForm(PerkFormSchema.parse(value))),
  });

  const field = (
    name: 'via' | 'price' | 'endsOn',
    label: string,
    input: { type?: string; placeholder?: string; inputMode?: 'decimal'; hint?: string },
  ) => (
    <form.Field name={name}>
      {(f) => {
        const message = f.state.meta.errors[0]?.message;
        const describedBy = message ? `${f.name}-error` : input.hint ? `${f.name}-hint` : undefined;
        return (
          <div className="space-y-1.5">
            <Label htmlFor={f.name}>{label}</Label>
            <Input
              id={f.name}
              type={input.type ?? 'text'}
              inputMode={input.inputMode}
              placeholder={input.placeholder}
              value={f.state.value}
              aria-invalid={message ? true : undefined}
              aria-describedby={describedBy}
              onBlur={f.handleBlur}
              onChange={(event) => f.handleChange(event.target.value)}
            />
            {message ? (
              <p id={`${f.name}-error`} className="text-sm text-destructive">
                {message}
              </p>
            ) : input.hint ? (
              <p id={`${f.name}-hint`} className="text-xs text-muted-foreground">
                {input.hint}
              </p>
            ) : null}
          </div>
        );
      }}
    </form.Field>
  );

  return (
    <form
      noValidate
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        void form.handleSubmit();
      }}
    >
      {field('via', 'Comes with', { placeholder: 'Xfinity' })}
      {field('price', 'You pay ($/month)', {
        inputMode: 'decimal',
        hint: '0 when it’s free.',
      })}
      {field('endsOn', 'Last day (optional)', {
        type: 'date',
        hint: 'Leave empty if it doesn’t end. The plan warns you two weeks before.',
      })}
      <DialogFooter className="gap-2 sm:justify-between">
        {perk ? (
          <Button type="button" variant="ghost" onClick={() => onSave(null)}>
            Remove perk
          </Button>
        ) : (
          <span />
        )}
        <Button type="submit">Save</Button>
      </DialogFooter>
    </form>
  );
}
