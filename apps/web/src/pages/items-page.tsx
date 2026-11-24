import { useSuspenseQuery } from '@tanstack/react-query';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ItemForm } from '@/features/items/item-form';
import { itemsQueryOptions, useCreateItem, useDeleteItem } from '@/features/items/queries';

export function ItemsPage() {
  const { data: items } = useSuspenseQuery(itemsQueryOptions);
  const createItem = useCreateItem();
  const deleteItem = useDeleteItem();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Items</h1>
      <ItemForm onSubmit={(values) => createItem.mutateAsync(values)} />
      {items.length === 0 ? (
        <p className="text-muted-foreground text-sm">No items yet.</p>
      ) : (
        <ul className="divide-y rounded-md border">
          {items.map((item) => (
            <li key={item.id} className="flex items-center justify-between px-4 py-2">
              <span>{item.name}</span>
              <Button
                variant="ghost"
                size="icon"
                aria-label={`Delete ${item.name}`}
                disabled={deleteItem.isPending}
                onClick={() => deleteItem.mutate(item.id)}
              >
                <Trash2 />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
