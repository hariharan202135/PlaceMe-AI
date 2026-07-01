import { Response } from 'express';
import MockTest from '../models/MockTest';
import TestResult from '../models/TestResult';
import Question from '../models/Question';
import { getGenAIClient } from '../utils/gemini';
import { AuthRequest } from '../middlewares/auth';

// 1. Start or resume a Mock Test Attempt
export const startMockTestAttempt = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  try {
    const mockTest = await MockTest.findById(id).populate('questions');
    if (!mockTest) {
      return res.status(404).json({ success: false, message: 'Mock test not found' });
    }

    // Check premium restriction
    if (mockTest.isPremium) {
      const isSubscribed = req.user.subscription && 
        req.user.subscription.plan !== 'Free' && 
        req.user.subscription.status === 'active';
        
      if (!isSubscribed) {
        return res.status(403).json({ 
          success: false, 
          message: 'Premium subscription required to access this mock test. Please upgrade your plan.' 
        });
      }
    }

    // Check for an active pending attempt
    let attempt = await TestResult.findOne({
      user: req.user._id,
      mockTest: mockTest._id,
      status: 'Pending'
    }).populate({
      path: 'mockTest',
      populate: { path: 'questions' }
    });

    if (attempt) {
      return res.status(200).json({
        success: true,
        message: 'Resuming active session.',
        attempt,
        questions: mockTest.questions
      });
    }

    // Create a new pending attempt
    const initialAnswers = mockTest.questions.map((q: any) => ({
      questionId: q._id,
      chosenOption: undefined,
      isCorrect: false
    }));

    attempt = await TestResult.create({
      user: req.user._id,
      mockTest: mockTest._id,
      sectionScores: { aptitude: 0, logical: 0, verbal: 0, technical: 0 },
      totalScore: 0,
      correctAnswers: 0,
      incorrectAnswers: 0,
      answers: initialAnswers,
      percentile: 72, // default simulated starter percentile
      status: 'Pending',
      timeTaken: 0,
      remainingTime: mockTest.duration * 60, // in seconds
      bookmarks: []
    });

    // Fetch newly created attempt with populated test data
    const fullAttempt = await TestResult.findById(attempt._id).populate({
      path: 'mockTest',
      populate: { path: 'questions' }
    });

    return res.status(201).json({
      success: true,
      message: 'New attempt session started.',
      attempt: fullAttempt,
      questions: mockTest.questions
    });
  } catch (err: any) {
    console.error('Error starting mock test attempt:', err);
    return res.status(500).json({ success: false, message: 'Failed to initiate mock test' });
  }
};

// 2. Save active mock test state
export const saveMockTestAttempt = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { answers, bookmarks, remainingTime, timeTaken } = req.body;

  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  try {
    const attempt = await TestResult.findOne({
      _id: id,
      user: req.user._id,
      status: 'Pending'
    });

    if (!attempt) {
      return res.status(404).json({ success: false, message: 'Active pending attempt not found' });
    }

    if (answers) attempt.answers = answers;
    if (bookmarks) attempt.bookmarks = bookmarks;
    if (remainingTime !== undefined) attempt.remainingTime = remainingTime;
    if (timeTaken !== undefined) attempt.timeTaken = timeTaken;

    await attempt.save();

    return res.status(200).json({ success: true, message: 'Progress saved successfully.' });
  } catch (err: any) {
    console.error('Error saving mock test state:', err);
    return res.status(500).json({ success: false, message: 'Failed to save test progress' });
  }
};

// 3. Finalize and submit Mock Test Attempt
export const submitMockTestAttempt = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { answers, remainingTime, timeTaken } = req.body;

  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  try {
    const attempt = await TestResult.findOne({
      _id: id,
      user: req.user._id,
      status: 'Pending'
    }).populate('mockTest');

    if (!attempt) {
      return res.status(404).json({ success: false, message: 'Active pending attempt not found' });
    }

    const mockTest: any = attempt.mockTest;
    const questions = await Question.find({ _id: { $in: mockTest.questions } });

    // Validate current answers payload or fallback to existing database model answers
    const activeAnswers = answers || attempt.answers;

    let correctCount = 0;
    let incorrectCount = 0;
    
    // Segment sub-scores
    let aptitudeCorrect = 0;
    let logicalCorrect = 0;
    let verbalCorrect = 0;

    const evaluatedAnswers = activeAnswers.map((ans: any) => {
      const dbQ = questions.find(q => q._id.toString() === ans.questionId.toString());
      const isCorrect = dbQ ? dbQ.correctOption === ans.chosenOption : false;
      
      if (ans.chosenOption !== undefined && ans.chosenOption !== null) {
        if (isCorrect) {
          correctCount++;
          if (dbQ?.topic === 'Logical Reasoning') logicalCorrect++;
          else if (dbQ?.topic === 'Verbal Ability') verbalCorrect++;
          else aptitudeCorrect++; // everything else is under Quantitative
        } else {
          incorrectCount++;
        }
      }

      return {
        questionId: ans.questionId,
        chosenOption: ans.chosenOption,
        isCorrect
      };
    });

    const totalQuestionsCount = questions.length;
    const totalScore = correctCount * 10;
    const maxScore = totalQuestionsCount * 10;
    const passPercentage = maxScore > 0 ? (totalScore / maxScore) * 100 : 0;
    const finalStatus = passPercentage >= 60 ? 'Pass' : 'Fail';

    attempt.answers = evaluatedAnswers;
    attempt.correctAnswers = correctCount;
    attempt.incorrectAnswers = incorrectCount;
    attempt.totalScore = totalScore;
    attempt.status = finalStatus;
    if (remainingTime !== undefined) attempt.remainingTime = remainingTime;
    if (timeTaken !== undefined) attempt.timeTaken = timeTaken;

    // Set segment score objects
    attempt.sectionScores = {
      aptitude: aptitudeCorrect * 10,
      logical: logicalCorrect * 10,
      verbal: verbalCorrect * 10,
      technical: 0 // placeholder
    };

    // Calculate percentile
    attempt.percentile = Math.round(55 + (passPercentage * 0.4));

    await attempt.save();

    // 4. Generate AI SWOT Feedback using Gemini
    let aiFeedbackText = '';
    const client = getGenAIClient();
    if (client) {
      try {
        const model = client.getGenerativeModel({ model: 'gemini-1.5-flash' });
        const prompt = `You are a placement preparation trainer. Evaluate the following candidate mock test performance:
        - Mock Test Title: ${mockTest.title}
        - Total Score: ${totalScore}/${maxScore} (${passPercentage.toFixed(1)}%)
        - Correct Answers: ${correctCount}
        - Incorrect Answers: ${incorrectCount}
        - Quantitative Aptitude Correct: ${aptitudeCorrect}
        - Logical Reasoning Correct: ${logicalCorrect}
        - Verbal Ability Correct: ${verbalCorrect}

        Provide a concise SWOT analysis report (Strengths, Weaknesses, Opportunities, Threats) and a brief 3-step action item preparation schedule. Write in clean markdown without any surrounding backticks.`;

        const result = await model.generateContent(prompt);
        aiFeedbackText = result.response.text().trim();
      } catch (geminiErr) {
        console.error('Error generating mock test feedback via Gemini:', geminiErr);
      }
    }

    if (!aiFeedbackText) {
      // High-quality fallback template SWOT breakdown
      const weakAreas = [];
      const strongAreas = [];
      if (aptitudeCorrect < 3) weakAreas.push('Quantitative Aptitude (Number Systems, Percentages)');
      else strongAreas.push('Quantitative Aptitude');
      if (logicalCorrect < 1) weakAreas.push('Logical Analytical Reasoning (Deductions)');
      else strongAreas.push('Logical Reasoning');
      if (verbalCorrect < 1) weakAreas.push('Verbal Grammatical Structures');
      else strongAreas.push('Verbal Ability');

      aiFeedbackText = `### SWOT Analysis

*   **Strengths (S):** Demonstrated acceptable competency in: ${strongAreas.join(', ') || 'General Foundation'}.
*   **Weaknesses (W):** Low accuracy noticed in: ${weakAreas.join(', ') || 'None identified'}.
*   **Opportunities (O):** Dedicate 20 minutes daily to high-yield formulas and practice test sheets.
*   **Threats (T):** Unfinished answers or rushing through logical puzzles may drop overall percentile during active NQT tests.

### Recommended 3-Step Action Plan:
1. Revise weak topic rules (e.g. percentages or sentence configurations).
2. Practice speed tests under 1-minute constraints.
3. Solve previous company papers before taking the next simulated mock test.`;
    }

    return res.status(200).json({
      success: true,
      message: 'Test submitted and graded successfully.',
      result: attempt,
      feedback: aiFeedbackText
    });
  } catch (err: any) {
    console.error('Error submitting mock test attempt:', err);
    return res.status(500).json({ success: false, message: 'Failed to submit test' });
  }
};
