import { Request, Response } from 'express';
import Question from '../models/Question';
import TestResult from '../models/TestResult';
import { AuthRequest } from '../middlewares/auth';

// List all 15 aptitude topics with available count and completion rate
export const getAptitudeTopics = async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  try {
    // 1. Get all questions to group by topic
    const questions = await Question.find({ type: 'MCQ' });
    
    const topicCounts: { [key: string]: number } = {};
    const topicMap: { [key: string]: string[] } = {};

    questions.forEach(q => {
      if (!q.topic) return;
      topicCounts[q.topic] = (topicCounts[q.topic] || 0) + 1;
      if (!topicMap[q.topic]) {
        topicMap[q.topic] = [];
      }
      topicMap[q.topic].push(q._id.toString());
    });

    // 2. Fetch user's completed test results to count answered questions
    const completedResults = await TestResult.find({
      user: req.user._id,
      status: { $ne: 'Pending' }
    });

    const answeredQuestionIds = new Set<string>();
    completedResults.forEach(r => {
      r.answers.forEach(a => {
        answeredQuestionIds.add(a.questionId.toString());
      });
    });

    // 3. Assemble 15 topics details
    const allTopics = [
      'Number System', 'Percentages', 'Profit and Loss', 'Ratio and Proportion',
      'Average', 'Time and Work', 'Time Speed Distance', 'Probability',
      'Permutation and Combination', 'Simple Interest', 'Compound Interest',
      'Pipes and Cisterns', 'Data Interpretation', 'Logical Reasoning', 'Verbal Ability'
    ];

    const topicsPayload = allTopics.map(topicName => {
      const totalQuestions = topicCounts[topicName] || 0;
      const questionIds = topicMap[topicName] || [];
      const answeredCount = questionIds.filter(id => answeredQuestionIds.has(id)).length;
      
      const completionRate = totalQuestions > 0 
        ? Math.min(100, Math.round((answeredCount / totalQuestions) * 100))
        : 0;

      return {
        name: topicName,
        totalQuestions,
        completionRate
      };
    });

    return res.status(200).json({ success: true, topics: topicsPayload });
  } catch (err: any) {
    console.error('Error fetching aptitude topics:', err);
    return res.status(500).json({ success: false, message: 'Error retrieving topics' });
  }
};

// Get practice questions by topic
export const getPracticeQuestions = async (req: Request, res: Response) => {
  const { topic } = req.params;

  try {
    const questions = await Question.find({ topic, type: 'MCQ' });
    return res.status(200).json({ success: true, questions });
  } catch (err: any) {
    console.error('Error fetching topic practice questions:', err);
    return res.status(500).json({ success: false, message: 'Error fetching questions' });
  }
};

// Start a random quick quiz (selects 10 random MCQs)
export const getRandomQuiz = async (req: Request, res: Response) => {
  try {
    // Select up to 10 random MCQs
    const questions = await Question.aggregate([
      { $match: { type: 'MCQ' } },
      { $sample: { size: 10 } }
    ]);

    return res.status(200).json({ success: true, questions });
  } catch (err: any) {
    console.error('Error compiling random quiz:', err);
    return res.status(500).json({ success: false, message: 'Error compiling quiz' });
  }
};
