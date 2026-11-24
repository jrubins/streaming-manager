import type { Region, UpdateHousehold } from '@app/shared';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface HouseholdSettingsProps {
  name: string;
  region: string;
  regions: readonly Region[];
  onSave: (changes: UpdateHousehold) => void;
  pending?: boolean;
}

/** The household's name and the country whose streaming catalogs apply. */
export function HouseholdSettings({
  name,
  region,
  regions,
  onSave,
  pending = false,
}: HouseholdSettingsProps) {
  const [draft, setDraft] = useState(name);
  const options = regions.some((r) => r.code === region)
    ? regions
    : [{ code: region, name: region }, ...regions];

  return (
    <div className="space-y-5">
      <form
        className="space-y-2"
        onSubmit={(event) => {
          event.preventDefault();
          const trimmed = draft.trim();
          if (trimmed && trimmed !== name) onSave({ name: trimmed });
        }}
      >
        <Label htmlFor="household-name">Name</Label>
        <div className="flex gap-2">
          <Input
            id="household-name"
            value={draft}
            maxLength={100}
            onChange={(event) => setDraft(event.target.value)}
          />
          <Button type="submit" variant="outline" disabled={pending || draft.trim() === name}>
            Save
          </Button>
        </div>
      </form>
      <div className="space-y-2">
        <Label htmlFor="household-region">Country</Label>
        <Select
          value={region}
          disabled={pending}
          onValueChange={(code) => {
            if (code !== region) onSave({ region: code });
          }}
        >
          <SelectTrigger id="household-region" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {options.map((option) => (
              <SelectItem key={option.code} value={option.code}>
                {option.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          What streams where depends on the country. Changing it looks up every title again.
        </p>
      </div>
    </div>
  );
}
