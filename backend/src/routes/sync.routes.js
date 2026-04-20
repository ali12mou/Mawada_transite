import { Router } from 'express';
import { findDocuments, listCollections } from '../api/mongoService.js';
import { syncCollectionToSupabase } from '../api/syncService.js';

const router = Router();

async function syncAllMongoCollections(req, res, next) {
  try {
    const limit = Number(req.body?.limit || 500);
    const collections = await listCollections();
    const report = [];

    for (const collection of collections) {
      const collectionName = collection.name;
      const documents = await findDocuments(collectionName, limit);
      const result = await syncCollectionToSupabase({ collectionName, documents });
      report.push({
        collectionName,
        documentsFetched: documents.length,
        ...result
      });
    }

    res.json({
      collectionsCount: report.length,
      report
    });
  } catch (error) {
    next(error);
  }
}

router.post('/mongodb-all', syncAllMongoCollections);
router.post('/mongodb/all', syncAllMongoCollections);

router.post('/mongodb/:collectionName', async (req, res, next) => {
  try {
    const collectionName = req.params.collectionName;
    const limit = Number(req.body?.limit || 500);
    const documents = await findDocuments(collectionName, limit);
    const result = await syncCollectionToSupabase({ collectionName, documents });

    res.json({
      collectionName,
      documentsFetched: documents.length,
      ...result
    });
  } catch (error) {
    next(error);
  }
});

export default router;
