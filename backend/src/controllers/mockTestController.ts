import { Response } from 'express';
import MockTest from '../models/MockTest';
import TestResult from '../models/TestResult';
import Question from '../models/Question';
import User from '../models/User';
import { AuthRequest } from '../middlewares/auth';

// 1. Get List of Mock Tests
export const getMockTests = async (req: AuthRequest, res: Response) => {
  try {
    const tests = await MockTest.find().populate('category');
    res.status(200).json({ success: true, tests });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching mock tests' });
  }
};

// 2. Get Mock Test details for taking the test (Hides correct answers)
export const getMockTestById = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  try {
    const test = await MockTest.findById(id)
      .populate('category')
      .populate({
        path: 'questions',
        select: '-correctOption -explanation' // Hide answers & explanations to prevent cheating
      });

    if (!test) {
      return res.status(404).json({ success: false, message: 'Mock test not found' });
    }

    res.status(200).json({ success: true, test });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching mock test' });
  }
};

// 3. Submit Mock Test
export const submitMockTest = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { responses, timeTaken } = req.body; // responses: [{ questionId: string, chosenOption?: number }]
  
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  try {
    const test = await MockTest.findById(id).populate('questions');
    if (!test) {
      return res.status(404).json({ success: false, message: 'Mock test not found' });
    }

    const testQuestions = test.questions as any[];
    let correctAnswers = 0;
    let incorrectAnswers = 0;
    const answerDetails: any[] = [];

    // Section counters
    const sectionCounts = { aptitude: 0, logical: 0, verbal: 0, technical: 0 };
    const sectionCorrect = { aptitude: 0, logical: 0, verbal: 0, technical: 0 };

    for (const q of testQuestions) {
      // Detect topic mapping to sections
      const topicName = (q.topic || '').toLowerCase();
      let section: 'aptitude' | 'logical' | 'verbal' | 'technical' = 'technical';
      
      if (topicName.includes('aptitude') || topicName.includes('math') || topicName.includes('quant') || topicName.includes('numerical')) {
        section = 'aptitude';
      } else if (topicName.includes('logical') || topicName.includes('reasoning') || topicName.includes('analytical')) {
        section = 'logical';
      } else if (topicName.includes('verbal') || topicName.includes('english') || topicName.includes('grammar')) {
        section = 'verbal';
      }

      sectionCounts[section] += 1;

      // Find user response for this question
      const userResp = responses.find((r: any) => r.questionId === q._id.toString());
      const isCorrect = userResp && userResp.chosenOption === q.correctOption;

      if (isCorrect) {
        correctAnswers++;
        sectionCorrect[section]++;
      } else {
        incorrectAnswers++;
      }

      answerDetails.push({
        questionId: q._id,
        chosenOption: userResp?.chosenOption,
        isCorrect: !!isCorrect,
        correctOption: q.correctOption,
        explanation: q.explanation
      });
    }

    // Compute scores out of 100 scale
    const totalQuestions = testQuestions.length || 1;
    const rawScore = (correctAnswers / totalQuestions) * 100;
    const totalScore = Math.round(rawScore);

    // Section percentages
    const sectionScores = {
      aptitude: sectionCounts.aptitude > 0 ? Math.round((sectionCorrect.aptitude / sectionCounts.aptitude) * 100) : 0,
      logical: sectionCounts.logical > 0 ? Math.round((sectionCorrect.logical / sectionCounts.logical) * 100) : 0,
      verbal: sectionCounts.verbal > 0 ? Math.round((sectionCorrect.verbal / sectionCounts.verbal) * 100) : 0,
      technical: sectionCounts.technical > 0 ? Math.round((sectionCorrect.technical / sectionCounts.technical) * 100) : 0
    };

    const status = totalScore >= test.passingMarks ? 'Pass' : 'Fail';

    // Compute relative percentile rank compared to previous test takers
    const previousAttempts = await TestResult.find({ mockTest: test._id });
    let percentile = 100;
    if (previousAttempts.length > 0) {
      const lowerScoresCount = previousAttempts.filter(attempt => attempt.totalScore < totalScore).length;
      percentile = Math.round((lowerScoresCount / previousAttempts.length) * 100);
    }

    // Save test result
    const testResult = await TestResult.create({
      user: req.user._id,
      mockTest: test._id,
      sectionScores,
      totalScore,
      correctAnswers,
      incorrectAnswers,
      answers: answerDetails.map(a => ({
        questionId: a.questionId,
        chosenOption: a.chosenOption,
        isCorrect: a.isCorrect
      })),
      percentile,
      status,
      timeTaken
    });

    // Update user stats
    const user = await User.findById(req.user._id);
    if (user) {
      // Incrementally update user's profile average placement score
      if (sectionCounts.aptitude > 0) {
        user.aptitudeScore = user.aptitudeScore > 0 ? Math.round((user.aptitudeScore + sectionScores.aptitude) / 2) : sectionScores.aptitude;
      }
      // If mock test contained verbal or logical, we can factor them into user's overall aptitude
      if (sectionCounts.logical > 0 || sectionCounts.verbal > 0) {
        const cognitiveAverage = Math.round((sectionScores.logical + sectionScores.verbal) / 2);
        user.aptitudeScore = user.aptitudeScore > 0 ? Math.round((user.aptitudeScore + cognitiveAverage) / 2) : cognitiveAverage;
      }
      
      // Update placement readiness score
      await user.save();
    }

    // Return results WITH solutions
    res.status(201).json({
      success: true,
      result: {
        _id: testResult._id,
        totalScore,
        correctAnswers,
        incorrectAnswers,
        percentile,
        status,
        timeTaken,
        sectionScores,
        answers: answerDetails // Send full details containing correct option & explanation for review screen
      }
    });
  } catch (error) {
    console.error('Error submitting mock test:', error);
    res.status(500).json({ success: false, message: 'Error processing test submission' });
  }
};

// 4. Get User test history
export const getTestHistory = async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  try {
    const history = await TestResult.find({ user: req.user._id })
      .populate('mockTest')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, history });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error retrieving test history' });
  }
};
