import express from 'express';
import { 
  getCategories, getQuestions, getQuestionById, toggleBookmark, 
  getCompanyPrepDetails, getCodingAIExplanation, askAIInterviewer, getDailyChallenge 
} from '../controllers/prepController';
import { protect, optionalProtect } from '../middlewares/auth';

import { getGenAIClient } from '../utils/gemini';

const router = express.Router();

router.get('/test-gemini', async (req, res) => {
  try {
    const client = getGenAIClient();
    if (!client) {
      return res.status(400).json({ success: false, message: 'Gemini client is null/mock. Check if GEMINI_API_KEY environment variable is configured.' });
    }
    const model = client.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const result = await model.generateContent('Say hello!');
    res.json({ success: true, text: result.response.text() });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message, stack: error.stack });
  }
});

router.get('/categories', getCategories);
router.get('/questions/daily-challenge/today', optionalProtect, getDailyChallenge);
router.get('/questions', optionalProtect, getQuestions);
router.get('/questions/:id', optionalProtect, getQuestionById);
router.post('/questions/:id/bookmark', protect, toggleBookmark);
router.post('/questions/:id/ai-explain', optionalProtect, getCodingAIExplanation);
router.post('/questions/:id/ai-interview', optionalProtect, askAIInterviewer);
router.get('/companies/:companyName', optionalProtect, getCompanyPrepDetails);

export default router;
