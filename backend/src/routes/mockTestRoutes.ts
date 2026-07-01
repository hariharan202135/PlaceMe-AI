import express from 'express';
import { getMockTests, getMockTestById, submitMockTest, getTestHistory } from '../controllers/mockTestController';
import { startMockTestAttempt, saveMockTestAttempt, submitMockTestAttempt } from '../controllers/mockTestAttemptController';
import { protect, optionalProtect } from '../middlewares/auth';

const router = express.Router();

router.get('/', optionalProtect, getMockTests);
router.get('/history', protect, getTestHistory);
router.get('/:id', optionalProtect, getMockTestById);
router.post('/:id/submit', protect, submitMockTest);

// Resumable mock test attempt routes
router.post('/:id/start', protect, startMockTestAttempt);
router.post('/:id/save', protect, saveMockTestAttempt);
router.post('/:id/submit-attempt', protect, submitMockTestAttempt);

export default router;
