import express from 'express';
import { 
  getCategories, getQuestions, getQuestionById, toggleBookmark, 
  getCompanyPrepDetails, getCodingAIExplanation, askAIInterviewer, getDailyChallenge 
} from '../controllers/prepController';
import { protect, optionalProtect } from '../middlewares/auth';

const router = express.Router();

router.get('/categories', getCategories);
router.get('/questions/daily-challenge/today', optionalProtect, getDailyChallenge);
router.get('/questions', optionalProtect, getQuestions);
router.get('/questions/:id', optionalProtect, getQuestionById);
router.post('/questions/:id/bookmark', protect, toggleBookmark);
router.post('/questions/:id/ai-explain', optionalProtect, getCodingAIExplanation);
router.post('/questions/:id/ai-interview', optionalProtect, askAIInterviewer);
router.get('/companies/:companyName', optionalProtect, getCompanyPrepDetails);

export default router;
