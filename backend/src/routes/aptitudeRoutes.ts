import express from 'express';
import { getAptitudeTopics, getPracticeQuestions, getRandomQuiz } from '../controllers/questionController';
import { protect } from '../middlewares/auth';

const router = express.Router();

router.get('/topics', protect, getAptitudeTopics);
router.get('/practice/:topic', protect, getPracticeQuestions);
router.get('/random-quiz', protect, getRandomQuiz);

export default router;
