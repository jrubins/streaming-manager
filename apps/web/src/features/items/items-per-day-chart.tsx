import { defineChart, lineY } from '@tanstack/charts';
import { Chart } from '@tanstack/charts/react';
import { scaleLinear } from '@tanstack/charts/scales/linear';
import { scalePoint } from '@tanstack/charts/scales/point';
import { tooltip } from '@tanstack/charts/tooltip';
import { useMemo } from 'react';
import type { DayCount } from './count-by-day';

/** Line chart of items created per day. Colours come from the theme (--chart-1 line, muted axes). */
export function ItemsPerDayChart({ data }: { data: readonly DayCount[] }) {
  const definition = useMemo(() => {
    // Counts are whole numbers: start at zero and never ask for more ticks than the max.
    const max = Math.max(1, ...data.map((d) => d.count));
    return defineChart({
      marks: [
        lineY(data, {
          id: 'items-per-day',
          x: 'day',
          y: 'count',
          points: true,
          stroke: 'var(--chart-1)',
        }),
      ],
      scales: {
        x: { scale: () => scalePoint<string>().padding(0.3), axis: { label: 'Day' } },
        y: {
          scale: scaleLinear().domain([0, max]),
          nice: true,
          grid: true,
          axis: { label: 'Items created', ticks: { count: Math.min(max, 5) } },
        },
      },
      tooltip,
    });
  }, [data]);

  if (data.length === 0) {
    return <p className="text-muted-foreground text-sm">No items yet.</p>;
  }

  return (
    <div className="text-muted-foreground">
      <Chart
        definition={definition}
        height={240}
        initialWidth={640}
        ariaLabel="Items created per day"
      />
    </div>
  );
}
