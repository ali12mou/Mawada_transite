import { Router } from 'express';
import mongoose from 'mongoose';
import {
  listUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  authenticateUser,
} from '../api/userService.js';

const router = Router();

function isValidObjectId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

// Route spécifique en premier (évite tout conflit avec /:id selon versions Express).
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const data = await authenticateUser(email, password);
    res.json({ data });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ message: error.message });
    }
    next(error);
  }
});

router.get('/', async (_req, res, next) => {
  try {
    const data = await listUsers();
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
    const data = await getUserById(req.params.id);
    if (!data) {
      return res.status(404).json({ message: 'Utilisateur introuvable' });
    }
    res.json({ data });
  } catch (error) {
    next(error);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const data = await createUser(req.body);
    res.status(201).json({ data });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: 'Cet email est déjà utilisé' });
    }
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
    const data = await updateUser(req.params.id, req.body);
    res.json({ data });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: 'Cet email est déjà utilisé' });
    }
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
    const data = await deleteUser(req.params.id);
    res.json({ data });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ message: error.message });
    }
    next(error);
  }
});

export default router;
