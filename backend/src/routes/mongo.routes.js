import { Router } from 'express';
import { createDocument, findDocuments, listCollections } from '../api/mongoService.js';

const router = Router();

router.get('/collections', async (_req, res, next) => {
  try {
    const data = await listCollections();
    res.json({ data });
  } catch (error) {
    next(error);
  }
});

router.get('/collections/:name/documents', async (req, res, next) => {
  try {
    const limit = Number(req.query.limit || 100);
    const data = await findDocuments(req.params.name, limit);
    res.json({ data });
  } catch (error) {
    next(error);
  }
});

router.post('/collections/:name/documents', async (req, res, next) => {
  try {
    const payload = req.body;
    const data = await createDocument(req.params.name, payload);
    res.status(201).json({ data });
  } catch (error) {
    next(error);
  }
});

export default router;
