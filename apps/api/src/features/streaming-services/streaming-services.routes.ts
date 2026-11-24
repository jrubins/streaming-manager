import { Router } from 'express';
import { CreateServiceSchema, ServiceIdParamsSchema, UpdateServiceSchema } from '@app/shared';
import { currentUserId } from '../../auth/middleware.ts';
import { validate } from '../../lib/validate.ts';
import type { StreamingServicesService } from './streaming-services.service.ts';

export function streamingServicesRouter(services: StreamingServicesService): Router {
  const router = Router();

  router.get('/', async (req, res) => {
    res.json(await services.list(currentUserId(req)));
  });

  router.post('/', async (req, res) => {
    const input = validate(CreateServiceSchema, req.body);
    res.status(201).json(await services.create(currentUserId(req), input));
  });

  router.patch('/:id', async (req, res) => {
    const { id } = validate(ServiceIdParamsSchema, req.params);
    const input = validate(UpdateServiceSchema, req.body);
    res.json(await services.update(currentUserId(req), id, input));
  });

  router.delete('/:id', async (req, res) => {
    const { id } = validate(ServiceIdParamsSchema, req.params);
    await services.remove(currentUserId(req), id);
    res.status(204).end();
  });

  return router;
}
