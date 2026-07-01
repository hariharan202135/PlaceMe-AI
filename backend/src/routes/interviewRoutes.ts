import express from 'express';
import { startInterview, submitInterviewAnswer, completeInterview, getInterviewHistory } from '../controllers/interviewController';
import { protect } from '../middlewares/auth';

const router = express.Router();

router.post('/start', protect, startInterview);
router.post('/:id/answer', protect, submitInterviewAnswer);
router.post('/:id/complete', protect, completeInterview);
router.get('/history', protect, getInterviewHistory);

export default router;
