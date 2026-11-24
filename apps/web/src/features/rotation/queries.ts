import { RotationPlanSchema } from '@app/shared';
import { queryOptions } from '@tanstack/react-query';
import { apiRequest } from '@/lib/api';

export const rotationQueryOptions = queryOptions({
  queryKey: ['rotation'],
  queryFn: () => apiRequest('/rotation', RotationPlanSchema),
});
