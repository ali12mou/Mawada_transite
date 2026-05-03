import { Router } from 'express';
import { 
  createDocument, 
  findDocuments, 
  listCollections, 
  updateDocument, 
  deleteDocument,
  getCollection
} from '../api/mongoService.js';
import { ObjectId } from 'mongodb';

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
    const limit = Number(req.query.limit || 500);
    const data = await findDocuments(req.params.name, limit);
    res.json({ data });
  } catch (error) {
    next(error);
  }
});

router.get('/collections/:name/documents/:id', async (req, res, next) => {
  try {
    const col = getCollection(req.params.name);
    const data = await col.findOne({ _id: new ObjectId(req.params.id) });
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

router.put('/collections/:name/documents/:id', async (req, res, next) => {
  try {
    const data = await updateDocument(req.params.name, req.params.id, req.body);
    res.json({ data });
  } catch (error) {
    next(error);
  }
});

router.delete('/collections/:name/documents/:id', async (req, res, next) => {
  try {
    await deleteDocument(req.params.name, req.params.id);
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

export default router;
