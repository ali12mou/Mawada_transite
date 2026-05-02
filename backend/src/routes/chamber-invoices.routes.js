import { Router } from 'express';
import * as chamberMongo from '../api/chamberInvoiceMongoService.js';

const router = Router();

router.get('/', async (req, res, next) => {
  try {
    const data = await chamberMongo.listChamberInvoicesMongo();
    res.json(data);
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const data = await chamberMongo.getChamberInvoiceFullMongo(req.params.id);
    res.json(data);
  } catch (error) {
    next(error);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const data = await chamberMongo.createChamberInvoiceMongo(req.body);
    res.status(201).json(data);
  } catch (error) {
    next(error);
  }
});

router.put('/:id', async (req, res, next) => {
  try {
    const data = await chamberMongo.updateChamberInvoiceMongo(req.params.id, req.body);
    res.json(data);
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    await chamberMongo.deleteChamberInvoiceMongo(req.params.id);
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

export default router;
