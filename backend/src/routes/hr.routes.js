import { Router } from 'express';
import * as hrService from '../api/hrService.js';

const router = Router();

router.get('/employees', async (req, res, next) => {
  try {
    const data = await hrService.listEmployees();
    res.json(data);
  } catch (error) {
    next(error);
  }
});

router.get('/employees/:id', async (req, res, next) => {
  try {
    const data = await hrService.getEmployee(req.params.id);
    res.json(data);
  } catch (error) {
    next(error);
  }
});

router.post('/employees', async (req, res, next) => {
  try {
    const data = await hrService.createEmployee(req.body);
    res.status(201).json(data);
  } catch (error) {
    next(error);
  }
});

router.put('/employees/:id', async (req, res, next) => {
  try {
    const data = await hrService.updateEmployee(req.params.id, req.body);
    res.json(data);
  } catch (error) {
    next(error);
  }
});

router.delete('/employees/:id', async (req, res, next) => {
  try {
    await hrService.deleteEmployee(req.params.id);
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

export default router;
