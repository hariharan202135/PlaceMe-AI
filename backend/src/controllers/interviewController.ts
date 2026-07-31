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
    
    // Evaluate answer via Gemini / Scoring Engine
    const evaluation = await evaluateHRAnswer(interview.jobRole, questionToEvaluate.question, answer);

    // Save evaluated values
    interview.questions[questionIndex].answer = answer;
    interview.questions[questionIndex].score = evaluation.overallScore;
    interview.questions[questionIndex].technicalScore = evaluation.technicalScore;
    interview.questions[questionIndex].communicationScore = evaluation.communicationScore;
    interview.questions[questionIndex].grammarScore = evaluation.grammarScore;
    interview.questions[questionIndex].confidenceScore = evaluation.confidenceScore;
    interview.questions[questionIndex].relevanceScore = evaluation.relevanceScore;
    interview.questions[questionIndex].problemSolvingScore = evaluation.problemSolvingScore;
    interview.questions[questionIndex].professionalismScore = evaluation.professionalismScore;
    interview.questions[questionIndex].strengths = evaluation.strengths;
    interview.questions[questionIndex].weaknesses = evaluation.weaknesses;
    interview.questions[questionIndex].feedback = evaluation.feedback;
    interview.questions[questionIndex].improvedAnswer = evaluation.improvedAnswer;
    interview.questions[questionIndex].recommendation = evaluation.recommendation;
    interview.questions[questionIndex].learningSuggestions = evaluation.learningSuggestions;
    interview.questions[questionIndex].idealAnswer = evaluation.improvedAnswer;

    // Use markModified for subdocument updates
    interview.markModified('questions');
    await interview.save();

    res.status(200).json({
      success: true,
      questionIndex,
      evaluation
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
    let totalOverall = 0;
    let totalTech = 0;
    let totalComm = 0;
    let totalGrammar = 0;
    let totalConfidence = 0;
    let totalRelevance = 0;
    let totalProblem = 0;
    let totalProf = 0;
    let answeredCount = 0;
    const allStrengths: string[] = [];
    const allWeaknesses: string[] = [];
    const allSuggestions: string[] = [];

    interview.questions.forEach(q => {
      if (q.answer && q.answer.trim().length > 0) {
        totalOverall += q.score || 0;
        totalTech += q.technicalScore || 0;
        totalComm += q.communicationScore || 0;
        totalGrammar += q.grammarScore || 0;
        totalConfidence += q.confidenceScore || 0;
        totalRelevance += q.relevanceScore || 0;
        totalProblem += q.problemSolvingScore || 0;
        totalProf += q.professionalismScore || 0;
        answeredCount++;
        if (q.strengths) allStrengths.push(...q.strengths);
        if (q.weaknesses) allWeaknesses.push(...q.weaknesses);
        if (q.learningSuggestions) allSuggestions.push(...q.learningSuggestions);
      }
    });

    const avgOverall = answeredCount > 0 ? Number((totalOverall / answeredCount).toFixed(1)) : 0;
    const avgTech = answeredCount > 0 ? Number((totalTech / answeredCount).toFixed(1)) : 0;
    const avgComm = answeredCount > 0 ? Number((totalComm / answeredCount).toFixed(1)) : 0;
    const avgGrammar = answeredCount > 0 ? Number((totalGrammar / answeredCount).toFixed(1)) : 0;
    const avgConfidence = answeredCount > 0 ? Number((totalConfidence / answeredCount).toFixed(1)) : 0;
    const avgRelevance = answeredCount > 0 ? Number((totalRelevance / answeredCount).toFixed(1)) : 0;
    const avgProblem = answeredCount > 0 ? Number((totalProblem / answeredCount).toFixed(1)) : 0;
    const avgProf = answeredCount > 0 ? Number((totalProf / answeredCount).toFixed(1)) : 0;

    const recommendation: 'Pass' | 'Borderline' | 'Fail' =
      avgOverall >= 8.0 ? 'Pass' : avgOverall >= 5.0 ? 'Borderline' : 'Fail';

    interview.overallScore = avgOverall;
    interview.technicalScore = avgTech;
    interview.communicationScore = avgComm;
    interview.grammarScore = avgGrammar;
    interview.confidenceScore = avgConfidence;
    interview.relevanceScore = avgRelevance;
    interview.problemSolvingScore = avgProblem;
    interview.professionalismScore = avgProf;
    interview.recommendation = recommendation;
    interview.strengths = Array.from(new Set(allStrengths)).slice(0, 6);
    interview.weaknesses = Array.from(new Set(allWeaknesses)).slice(0, 6);
    interview.learningSuggestions = Array.from(new Set(allSuggestions)).slice(0, 6);
    interview.status = 'completed';

    await interview.save();

    // Sync user profile hrScore
    const user = await User.findById(req.user._id);
    if (user) {
      const scaledHrScore = Math.round(avgOverall * 10);
      user.hrScore = user.hrScore > 0 ? Math.round((user.hrScore + scaledHrScore) / 2) : scaledHrScore;
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

// 5. Upload Resume (PDF, DOC, DOCX) for Personalized HR Questions
export const uploadResumeForInterview = async (req: AuthRequest, res: Response) => {
  const { file, fileName } = req.body;

  if (!file || !fileName) {
    return res.status(400).json({ success: false, message: 'Please provide resume base64 file content and fileName' });
  }

  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  try {
    const base64Data = file.replace(/^data:[^;]+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');

    if (buffer.length > 5 * 1024 * 1024) {
      return res.status(400).json({ success: false, message: 'File size exceeds maximum limit of 5MB.' });
    }

    const { extractTextFromBuffer } = await import('../utils/documentParser.js');
    const { analyzeResumeText } = await import('../utils/gemini.js');

    // Extract text from PDF, DOC, or DOCX
    const { text, fileType } = await extractTextFromBuffer(buffer, fileName);

    // Analyze extracted text with Gemini
    const analysisResult = await analyzeResumeText(text);

    // Save to DB so startInterview picks up customQuestions
    const resumeAnalysis = await ResumeAnalysis.create({
      user: req.user._id,
      fileName,
      atsScore: analysisResult.atsScore,
      skillsIdentified: analysisResult.skillsIdentified,
      education: analysisResult.education,
      projects: analysisResult.projects,
      internships: analysisResult.internships,
      certifications: analysisResult.certifications,
      strengths: analysisResult.strengths,
      weaknesses: analysisResult.weaknesses,
      missingSkills: analysisResult.missingSkills,
      suggestions: analysisResult.suggestions,
      interviewQuestions: analysisResult.interviewQuestions
    });

    res.status(201).json({
      success: true,
      message: `Resume (${fileType.toUpperCase()}) uploaded and parsed successfully! Personalized HR questions generated.`,
      analysis: resumeAnalysis
    });
  } catch (error: any) {
    console.error('Interview resume upload error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error parsing resume file'
    });
  }
};
