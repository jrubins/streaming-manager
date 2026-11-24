import { useQuery } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { countByDay } from '@/features/items/count-by-day';
import { ItemsPerDayChart } from '@/features/items/items-per-day-chart';
import { healthQueryOptions, itemsQueryOptions } from '@/features/items/queries';

export function HomePage() {
  const health = useQuery(healthQueryOptions);
  const items = useQuery(itemsQueryOptions);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Overview</h1>
      <Card>
        <CardHeader>
          <CardTitle>
            <h2>API status</h2>
          </CardTitle>
          <CardDescription>Live check of the API and its database.</CardDescription>
        </CardHeader>
        <CardContent>
          {health.isPending ? (
            <p className="text-muted-foreground text-sm">Checking…</p>
          ) : health.isError ? (
            <Badge variant="destructive">Unreachable</Badge>
          ) : (
            <div className="flex gap-2">
              <Badge variant={health.data.status === 'ok' ? 'default' : 'destructive'}>
                API {health.data.status}
              </Badge>
              <Badge variant="secondary">Database {health.data.database}</Badge>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            <h2>Items per day</h2>
          </CardTitle>
          <CardDescription>Example TanStack Charts chart.</CardDescription>
        </CardHeader>
        <CardContent>
          <ItemsPerDayChart data={countByDay(items.data ?? [])} />
        </CardContent>
      </Card>
    </div>
  );
}
