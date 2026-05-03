import { Router } from 'express';
import * as expenseService from '../api/expenseService.js';

const router = Router();

// Categories
router.get('/categories', async (req, res, next) => {
  try {
    const data = await expenseService.listCategories();
    res.json(data);
  } catch (error) {
    next(error);
  }
});

router.post('/categories', async (req, res, next) => {
  try {
    const data = await expenseService.createCategory(req.body);
    res.status(201).json(data);
  } catch (error) {
    next(error);
  }
});

router.put('/categories/:id', async (req, res, next) => {
  try {
    const data = await expenseService.updateCategory(req.params.id, req.body);
    res.json(data);
  } catch (error) {
    next(error);
  }
});

router.delete('/categories/:id', async (req, res, next) => {
  try {
    await expenseService.deleteCategory(req.params.id);
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

// Expenses
router.get('/', async (req, res, next) => {
  try {
    const data = await expenseService.listExpenses();
    res.json(data);
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const data = await expenseService.getExpense(req.params.id);
    res.json(data);
  } catch (error) {
    next(error);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const data = await expenseService.createExpense(req.body);
    res.status(201).json(data);
  } catch (error) {
    next(error);
  }
});

router.put('/:id', async (req, res, next) => {
  try {
    const data = await expenseService.updateExpense(req.params.id, req.body);
    res.json(data);
  } catch (error) {
    next(error);
  }
});

router.patch('/:id/approve', async (req, res, next) => {
  try {
    const data = await expenseService.approveExpense(req.params.id);
    res.json(data);
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    await expenseService.deleteExpense(req.params.id);
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

export default router;
