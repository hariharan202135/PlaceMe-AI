import express from 'express';
import { getCodingProblems, getCodingProblemById, runCodingTest, submitCodingSolution, getSubmissionHistory, unlockCodingSet } from '../controllers/codingController';
import { protect, optionalProtect } from '../middlewares/auth';

const router = express.Router();

router.get('/problems', optionalProtect, getCodingProblems);
router.get('/history', protect, getSubmissionHistory);
router.post('/problems/unlock-set', protect, unlockCodingSet);
router.get('/problems/:id', optionalProtect, getCodingProblemById);
router.post('/problems/:id/run', optionalProtect, runCodingTest);
router.post('/problems/:id/submit', protect, submitCodingSolution);

export default router;
