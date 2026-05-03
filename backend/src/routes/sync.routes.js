import { Router } from 'express';

const router = Router();

/** 
 * Syncing to Supabase is no longer supported. 
 * Returning a standardized deactivation response.
 */
const deactivationResponse = (req, res) => {
  res.status(410).json({
    message: 'Supabase synchronization is no longer supported. The system has migrated to a standalone MongoDB backend.'
  });
};

router.post('/mongodb-all', deactivationResponse);
router.post('/mongodb/all', deactivationResponse);
router.post('/mongodb/:collectionName', deactivationResponse);

export default router;
