import { Router } from 'express';
import { getMongoConnectionState } from '../config/mongodb.js';

const router = Router();

router.get('/', (_req, res) => {
  res.json({
    ok: true,
    service: 'transit-transport-backend',
    mongoReadyState: getMongoConnectionState()
  });
});

export default router;
