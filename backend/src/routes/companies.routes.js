import { Router } from 'express';
import mongoose from 'mongoose';
import {
  listCompanies,
  getCompanyById,
  createCompany,
  updateCompany,
  deleteCompany,
} from '../api/companyService.js';

const router = Router();

function isValidObjectId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

router.get('/', async (_req, res, next) => {
  try {
    const data = await listCompanies();
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
    const data = await getCompanyById(req.params.id);
    if (!data) {
      return res.status(404).json({ message: 'Entreprise introuvable' });
    }
    res.json({ data });
  } catch (error) {
    next(error);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const data = await createCompany(req.body);
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
    const data = await updateCompany(req.params.id, req.body);
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
    const data = await deleteCompany(req.params.id);
    res.json({ data });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ message: error.message });
    }
    next(error);
  }
});

export default router;
