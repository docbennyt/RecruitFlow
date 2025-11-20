import express from 'express';
import { protect } from '../middleware/auth.js';
import { createJob, getJobMatches, unlockCandidate } from '../controllers/jobController.js';

const router = express.Router();

router.post('/', protect, createJob);
router.post('/:jobId/matches', protect, getJobMatches);
router.post('/:jobId/unlock/:candidateId', protect, unlockCandidate);

export default router;