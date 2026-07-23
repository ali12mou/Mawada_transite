// document9
import { Router } from 'express';
import mongoose from 'mongoose';
import {
  listDocument9,
  getDocument9ById,
  createDocument9,
  updateDocument9,
  deleteDocument9,
} from '../api/document9Service.js';

const router = Router();

function isValidObjectId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

router.get('/', async (_req, res, next) => {
  try {
    const data = await listDocument9();
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
    const data = await getDocument9ById(req.params.id);
    if (!data) {
      return res.status(404).json({ message: 'Document introuvable' });
    }
    res.json({ data });
  } catch (error) {
    next(error);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const data = await createDocument9(req.body);
    res.status(201).json({ data });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ message: error.message });
    }
    next(error);
  }
});

router.patch('/:id', async (req, res, next) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Identifiant invalide' });
    }
    const data = await updateDocument9(req.params.id, req.body);
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
    const data = await deleteDocument9(req.params.id);
    res.json({ data });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ message: error.message });
    }
    next(error);
  }
});

export default router;
