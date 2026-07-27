import express from 'express';
import { startInterview, submitInterviewAnswer, completeInterview, getInterviewHistory, uploadResumeForInterview } from '../controllers/interviewController';
import { protect } from '../middlewares/auth';

const router = express.Router();

router.post('/start', protect, startInterview);
router.post('/upload-resume', protect, uploadResumeForInterview);
router.post('/:id/answer', protect, submitInterviewAnswer);
router.post('/:id/complete', protect, completeInterview);
router.get('/history', protect, getInterviewHistory);

export default router;
