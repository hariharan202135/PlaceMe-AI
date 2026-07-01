import { Response } from 'express';
import Interview, { IInterview } from '../models/Interview';
import User from '../models/User';
import ResumeAnalysis from '../models/ResumeAnalysis';
import { AuthRequest } from '../middlewares/auth';
import { generateHRQuestions, evaluateHRAnswer } from '../utils/gemini';

// 1. Start Interview Session
export const startInterview = async (req: AuthRequest, res: Response) => {
  const { jobRole } = req.body;
  if (!jobRole) {
    return res.status(400).json({ success: false, message: 'Job role is required' });
  }

  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  try {
    // Query latest resume analysis to extract custom personalized questions
    const latestResume = await ResumeAnalysis.findOne({ user: req.user._id })
      .sort({ createdAt: -1 });

    let customQuestions: string[] = [];
    if (latestResume && latestResume.interviewQuestions && latestResume.interviewQuestions.length > 0) {
      customQuestions = latestResume.interviewQuestions;
    }

    // Part 1: exactly 5 resume-based questions
    let part1ResumeQuestions = [...customQuestions];
    const defaultResumeQuestions = [
      "Walk me through a technical challenge you resolved in one of your listed projects.",
      "Which technology on your resume do you find most versatile, and why?",
      "Describe your experience with the development tools and IDEs mentioned on your resume.",
      "How did you implement the specific database schemas or API integrations listed in your projects?",
      "How do you keep your technical skills updated with the fast-moving tech listed in your summary?"
    ];
    while (part1ResumeQuestions.length < 5) {
      const nextIndex = part1ResumeQuestions.length;
      part1ResumeQuestions.push(defaultResumeQuestions[nextIndex]);
    }
    part1ResumeQuestions = part1ResumeQuestions.slice(0, 5);

    // Part 2: exactly 5 role-based questions
    const roleQuestions = await generateHRQuestions(jobRole);
    const part2RoleQuestions = roleQuestions.slice(0, 5);
    
    // Combine to exactly 10 questions (5 Resume + 5 Role)
    const combinedQuestions = [...part1ResumeQuestions, ...part2RoleQuestions];

    const questionsPayload = combinedQuestions.map(q => ({
      question: q,
      answer: '',
      score: 0,
      feedback: '',
      idealAnswer: ''
    }));

    const interview = await Interview.create({
      user: req.user._id,
      jobRole,
      questions: questionsPayload,
      overallScore: 0,
      status: 'pending'
    });

    res.status(201).json({
      success: true,
      interview: {
        _id: interview._id,
        jobRole: interview.jobRole,
        questions: interview.questions.map((q, idx) => ({ index: idx, question: q.question })),
        status: interview.status
      }
    });
  } catch (error) {
    console.error('Error starting interview:', error);
    res.status(500).json({ success: false, message: 'Error starting interview session' });
  }
};

// 2. Submit Individual Answer
export const submitInterviewAnswer = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { questionIndex, answer } = req.body;

  if (questionIndex === undefined || answer === undefined) {
    return res.status(400).json({ success: false, message: 'Missing questionIndex or answer' });
  }

  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  try {
    const interview = await Interview.findById(id);
    if (!interview) {
      return res.status(404).json({ success: false, message: 'Interview session not found' });
    }

    if (interview.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    if (questionIndex < 0 || questionIndex >= interview.questions.length) {
      return res.status(400).json({ success: false, message: 'Invalid question index' });
    }

    const questionToEvaluate = interview.questions[questionIndex];
    
    // Evaluate answer via Gemini
    const evaluation = await evaluateHRAnswer(interview.jobRole, questionToEvaluate.question, answer);

    // Save evaluated values
    interview.questions[questionIndex].answer = answer;
    interview.questions[questionIndex].score = evaluation.score;
    interview.questions[questionIndex].feedback = evaluation.evaluation.suggestions;
    interview.questions[questionIndex].idealAnswer = evaluation.idealAnswer;

    // Use markModified for subdocument updates
    interview.markModified('questions');
    await interview.save();

    res.status(200).json({
      success: true,
      questionIndex,
      evaluation: {
        score: evaluation.score,
        grammar: evaluation.evaluation.grammar,
        confidence: evaluation.evaluation.confidence,
        technical: evaluation.evaluation.technical,
        suggestions: evaluation.evaluation.suggestions,
        idealAnswer: evaluation.idealAnswer
      }
    });
  } catch (error) {
    console.error('Error submitting answer:', error);
    res.status(500).json({ success: false, message: 'Error saving and evaluating answer' });
  }
};

// 3. Complete Interview & Aggregate Final Report
export const completeInterview = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  try {
    const interview = await Interview.findById(id);
    if (!interview) {
      return res.status(404).json({ success: false, message: 'Interview session not found' });
    }

    if (interview.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    // Compute aggregate scores
    let totalScore = 0;
    let answeredQuestionsCount = 0;

    interview.questions.forEach(q => {
      if (q.answer && q.answer.trim().length > 0) {
        totalScore += q.score || 0;
        answeredQuestionsCount++;
      }
    });

    const averageScoreRaw = answeredQuestionsCount > 0 ? (totalScore / answeredQuestionsCount) : 0;
    const finalScore = Math.round(averageScoreRaw * 10); // scale out of 100 for user dashboard compatibility

    // Hardcode summary logic for evaluation metrics (or compute average profiles)
    interview.overallScore = finalScore;
    interview.status = 'completed';
    
    interview.evaluation = {
      grammar: finalScore >= 80 ? 'Excellent syntactic clarity and vocabulary.' : finalScore >= 60 ? 'Satisfactory grammar with occasional minor structure issues.' : 'Needs focus on verb agreement and sentence framing.',
      confidence: finalScore >= 80 ? 'Assertive tone, direct answers, and professional vocabulary.' : finalScore >= 60 ? 'Generally comfortable, can be more direct.' : 'Indicates hesitation, expand replies with positive statements.',
      technical: finalScore >= 80 ? 'Strong alignment with tech role duties and terminology.' : finalScore >= 60 ? 'Accurate conceptually but lacks deep domain specificity.' : 'Lacks technical references; needs revision of domain keynotes.',
      suggestions: 'Consistently apply the STAR method. Keep practicing mock HR interviews. Add specific metric results to project examples.'
    };

    await interview.save();

    // Sync to user profile
    const user = await User.findById(req.user._id);
    if (user) {
      user.hrScore = user.hrScore > 0 ? Math.round((user.hrScore + finalScore) / 2) : finalScore;
      await user.save();
    }

    res.status(200).json({ success: true, interview });
  } catch (error) {
    console.error('Error completing interview:', error);
    res.status(500).json({ success: false, message: 'Error compiling interview report' });
  }
};

// 4. Fetch past interview logs
export const getInterviewHistory = async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  try {
    const history = await Interview.find({ user: req.user._id, status: 'completed' })
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, history });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error retrieving interview logs' });
  }
};
