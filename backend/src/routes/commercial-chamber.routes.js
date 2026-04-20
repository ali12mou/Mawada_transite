import { Router } from 'express';
import mongoose from 'mongoose';
import {
  listCommercialChambers,
  getCommercialChamberById,
  createCommercialChamber,
  updateCommercialChamber,
  deleteCommercialChamber,
} from '../api/commercialChamberService.js';

const router = Router();

function isValidObjectId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

router.get('/', async (_req, res, next) => {
  try {
    const data = await listCommercialChambers();
    res.json({ data });
  } catch (error) {
    next(error);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const data = await createCommercialChamber(req.body || {});
    res.status(201).json({ data });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ message: error.message });
    }
    next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Identifiant invalide' });
    }
    const data = await getCommercialChamberById(req.params.id);
    if (!data) {
      return res.status(404).json({ message: 'Enregistrement introuvable' });
    }
    res.json({ data });
  } catch (error) {
    next(error);
  }
});

router.patch('/:id', async (req, res, next) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Identifiant invalide' });
    }
    const data = await updateCommercialChamber(req.params.id, req.body || {});
    res.json({ data });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ message: error.message });
    }
    next(error);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Identifiant invalide' });
    }
    const data = await deleteCommercialChamber(req.params.id);
    res.json({ data });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ message: error.message });
    }
    next(error);
  }
});

export default router;
