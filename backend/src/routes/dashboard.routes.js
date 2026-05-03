import { Router } from 'express';
import * as dashboardService from '../api/dashboardService.js';

const router = Router();

router.get('/stats', async (req, res, next) => {
  try {
    const data = await dashboardService.getDashboardStats();
    res.json(data);
  } catch (error) {
    next(error);
  }
});

export default router;
