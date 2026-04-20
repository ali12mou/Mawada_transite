import { Router } from 'express';
import { getAllConfigMap, upsertConfigMap } from '../api/configService.js';

const router = Router();

router.get('/', async (_req, res, next) => {
  try {
    const data = await getAllConfigMap();
    res.json({ data });
  } catch (error) {
    next(error);
  }
});

router.patch('/', async (req, res, next) => {
  try {
    const body = req.body && typeof req.body === 'object' ? req.body : {};
    const data = await upsertConfigMap(body);
    res.json({ data });
  } catch (error) {
    next(error);
  }
});

export default router;
