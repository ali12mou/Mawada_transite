import { Router } from 'express';
import mongoose from 'mongoose';
import {
  listSuppliers,
  getSupplierById,
  createSupplier,
  updateSupplier,
  deleteSupplier,
} from '../api/supplierService.js';

const router = Router();

function isValidObjectId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

router.get('/', async (_req, res, next) => {
  try {
    const data = await listSuppliers();
    res.json({ data });
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Identifiant invalide' });
    }
    const data = await getSupplierById(req.params.id);
    if (!data) {
      return res.status(404).json({ message: 'Fournisseur introuvable' });
    }
    res.json({ data });
  } catch (error) {
    next(error);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const data = await createSupplier(req.body);
    res.status(201).json({ data });
  } catch (error) {
    next(error);
  }
});

router.patch('/:id', async (req, res, next) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Identifiant invalide' });
    }
    const data = await updateSupplier(req.params.id, req.body);
    res.json({ data });
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Identifiant invalide' });
    }
    await deleteSupplier(req.params.id);
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

export default router;
