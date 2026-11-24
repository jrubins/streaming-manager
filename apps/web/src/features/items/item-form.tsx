import { CreateItemSchema, type CreateItem } from '@app/shared';
import { useForm } from '@tanstack/react-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface ItemFormProps {
  onSubmit: (values: CreateItem) => Promise<unknown>;
}

/** Create-item form. Validates with the same Zod schema the API uses. */
export function ItemForm({ onSubmit }: ItemFormProps) {
  const form = useForm({
    defaultValues: { name: '' },
    validators: { onSubmit: CreateItemSchema },
    onSubmit: async ({ value, formApi }) => {
      await onSubmit(CreateItemSchema.parse(value));
      formApi.reset();
    },
  });

  return (
    <form
      className="flex items-start gap-2"
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        void form.handleSubmit();
      }}
    >
      <form.Field name="name">
        {(field) => {
          const error = field.state.meta.errors[0]?.message;
          return (
            <div className="flex-1 space-y-1">
              <Label htmlFor={field.name} className="sr-only">
                Name
              </Label>
              <Input
                id={field.name}
                name={field.name}
                placeholder="New item"
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(event) => field.handleChange(event.target.value)}
                aria-invalid={error ? true : undefined}
                aria-describedby={error ? `${field.name}-error` : undefined}
              />
              {error ? (
                <p id={`${field.name}-error`} className="text-destructive text-sm">
                  {error}
                </p>
              ) : null}
            </div>
          );
        }}
      </form.Field>
      <form.Subscribe selector={(state) => state.isSubmitting}>
        {(isSubmitting) => (
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Adding…' : 'Add'}
          </Button>
        )}
      </form.Subscribe>
    </form>
  );
}
