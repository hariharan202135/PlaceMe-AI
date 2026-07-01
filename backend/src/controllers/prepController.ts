import { Response } from 'express';
import Question from '../models/Question';
import Category from '../models/Category';
import User from '../models/User';
import { AuthRequest } from '../middlewares/auth';
import { explainCodingProblem, generateAIInterviewerFollowUp } from '../utils/gemini';

// 1. Get Categories
export const getCategories = async (req: AuthRequest, res: Response) => {
  try {
    const categories = await Category.find().populate('parentCategory');
    res.status(200).json({ success: true, categories });
  } catch (error) {
    res.status(500).json({ success: true, message: 'Error fetching categories' });
  }
};

// 2. Get Questions (Paginated, Filtered)
export const getQuestions = async (req: AuthRequest, res: Response) => {
  const { categoryId, topic, difficulty, type, search, company, solved, unsolved, bookmarked, limit = '100', skip = '0' } = req.query;

  const query: any = {};

  if (categoryId) query.category = categoryId;
  if (topic) query.topic = topic as string;
  if (difficulty) query.difficulty = difficulty as string;
  if (type) query.type = type as string;

  if (company && company !== 'All') {
    const cleanCompany = (company as string).replace(' Coding', '');
    query.companyTags = { $in: [cleanCompany] };
  }

  if (search) {
    query.$or = [
      { questionText: { $regex: search as string, $options: 'i' } },
      { topic: { $regex: search as string, $options: 'i' } },
      { companyTags: { $regex: search as string, $options: 'i' } }
    ];
  }

  try {
    const parsedLimit = parseInt(limit as string);
    const parsedSkip = parseInt(skip as string);

    let bookmarkedIds: string[] = [];
    let solvedIds: string[] = [];
    let attemptedIds: string[] = [];
    let viewedIds: string[] = [];
    let lastViewed: any = null;

    if (req.user) {
      const user = await User.findById(req.user._id)
        .populate({
          path: 'lastViewedQuestion',
          select: 'topic difficulty type questionText companyTags'
        });
      if (user) {
        bookmarkedIds = (user.bookmarks || []).map(id => id.toString());
        solvedIds = (user.solvedQuestions || []).map(id => id.toString());
        attemptedIds = (user.attemptedQuestions || []).map(id => id.toString());
        viewedIds = (user.viewedQuestions || []).map(id => id.toString());
        if (user.lastViewedQuestion) {
          lastViewed = {
            question: user.lastViewedQuestion,
            company: user.lastViewedCompany || 'General Coding'
          };
        }
      }
    }

    // Apply solved/unsolved/bookmarked filters to the database query
    if (bookmarked === 'true') {
      query._id = { $in: bookmarkedIds };
    }
    if (solved === 'true') {
      query._id = { $in: solvedIds };
    } else if (unsolved === 'true') {
      query._id = { $nin: solvedIds };
    }

    const questions = await Question.find(query)
      .populate('category')
      .limit(parsedLimit)
      .skip(parsedSkip)
      .sort({ createdAt: -1 });

    const total = await Question.countDocuments(query);

    const decoratedQuestions = questions.map(q => {
      const qObj = q.toObject();
      return {
        ...qObj,
        isBookmarked: bookmarkedIds.includes(q._id.toString()),
        isSolved: solvedIds.includes(q._id.toString()),
        isAttempted: attemptedIds.includes(q._id.toString()),
        isViewed: viewedIds.includes(q._id.toString())
      };
    });

    // Compute stats
    const allCodingCount = await Question.countDocuments({ type: 'Coding' });
    const solvedCount = solvedIds.length;
    const bookmarksCount = bookmarkedIds.length;

    res.status(200).json({
      success: true,
      total,
      limit: parsedLimit,
      skip: parsedSkip,
      questions: decoratedQuestions,
      lastViewed,
      stats: {
        allCodingCount,
        solvedCount,
        bookmarksCount
      }
    });
  } catch (error) {
    console.error('Error fetching questions:', error);
    res.status(500).json({ success: false, message: 'Error fetching questions' });
  }
};

// 3. Get Single Question
export const getQuestionById = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { companyContext } = req.query;
  try {
    const question = await Question.findById(id).populate('category');
    if (!question) {
      return res.status(404).json({ success: false, message: 'Question not found' });
    }

    let isBookmarked = false;
    if (req.user) {
      const user = await User.findById(req.user._id);
      if (user) {
        isBookmarked = (user.bookmarks || []).some(bId => bId.toString() === question._id.toString());
        
        // Track viewed progress
        if (!user.viewedQuestions.includes(question._id)) {
          user.viewedQuestions.push(question._id);
        }
        user.lastViewedQuestion = question._id;
        if (companyContext) {
          user.lastViewedCompany = companyContext as string;
        } else if (question.companyTags && question.companyTags.length > 0) {
          user.lastViewedCompany = question.companyTags[0];
        }
        await user.save();
      }
    }

    res.status(200).json({
      success: true,
      question: {
        ...question.toObject(),
        isBookmarked
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching question' });
  }
};

// 4. Toggle Bookmark
export const toggleBookmark = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  try {
    const question = await Question.findById(id);
    if (!question) {
      return res.status(404).json({ success: false, message: 'Question not found' });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const index = user.bookmarks.findIndex(bId => bId.toString() === id);
    let bookmarked = false;

    if (index >= 0) {
      // Remove bookmark
      user.bookmarks.splice(index, 1);
    } else {
      // Add bookmark
      user.bookmarks.push(question._id);
      bookmarked = true;
    }

    await user.save();
    res.status(200).json({ success: true, bookmarked, message: bookmarked ? 'Bookmarked' : 'Unbookmarked' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error toggling bookmark' });
  }
};

// 5. Get Company-Specific curriculum guidelines
export const getCompanyPrepDetails = async (req: AuthRequest, res: Response) => {
  const { companyName } = req.params;
  const company = companyName.toLowerCase();

  const mockGuides: Record<string, any> = {
    tcs: {
      name: 'TCS (Tata Consultancy Services)',
      rounds: [
        { name: 'Numerical Ability (Aptitude)', count: 20, time: '25 mins' },
        { name: 'Verbal Ability (English)', count: 20, time: '20 mins' },
        { name: 'Reasoning Ability (Logical)', count: 20, time: '25 mins' },
        { name: 'Advanced Coding (Hands-on)', count: 2, time: '45 mins' }
      ],
      description: 'Prep syllabus for TCS NQT (National Qualifier Test) covering cognitive, technical MCQ, and coding tests.',
      difficulty: 'Medium',
      focusAreas: ['Data Interpretation', 'Probability & P&C', 'Data Structures (Trees/Graphs)', 'Grammar & Sentences', 'C/C++/Java/Python basics']
    },
    infosys: {
      name: 'Infosys (InfyTQ / SP / DSE)',
      rounds: [
        { name: 'Mathematical Ability', count: 15, time: '20 mins' },
        { name: 'Analytical Reasoning', count: 15, time: '25 mins' },
        { name: 'Verbal Ability', count: 20, time: '20 mins' },
        { name: 'Pseudocode Assessment', count: 5, time: '10 mins' },
        { name: 'Coding Assessment', count: 2, time: '40 mins' }
      ],
      description: 'Preparation tracker for Infosys Specialist Programmer and Digital Specialist Engineer assessment rounds.',
      difficulty: 'Medium to Hard',
      focusAreas: ['Dynamic Programming', 'Logical deduction', 'Object-Oriented Design', 'Code translation', 'DBMS query evaluation']
    },
    wipro: {
      name: 'Wipro (Elite National Talent Hunt)',
      rounds: [
        { name: 'Aptitude Test', count: 30, time: '30 mins' },
        { name: 'Written Communication (Essay)', count: 1, time: '20 mins' },
        { name: 'Coding (Basic-Intermediate)', count: 2, time: '45 mins' }
      ],
      description: 'Wipro Elite NLTH exam syllabus, testing cognitive capacity, essay writing, and elementary algorithms.',
      difficulty: 'Easy to Medium',
      focusAreas: ['Time & Work', 'Blood Relations', 'Formal grammar writing', 'String reversals', 'Array manipulation']
    },
    accenture: {
      name: 'Accenture (Cognitive & Technical)',
      rounds: [
        { name: 'Cognitive (Aptitude & Logical)', count: 50, time: '50 mins' },
        { name: 'Technical (MCQs on Network/OS/Cloud)', count: 40, time: '40 mins' },
        { name: 'Coding assessment', count: 2, time: '45 mins' },
        { name: 'Communication round (AI-Voice)', count: 6, time: '20 mins' }
      ],
      description: 'Accenture recruitment evaluation curriculum covering networking, cloud, coding, and verbal pronunciation tests.',
      difficulty: 'Medium',
      focusAreas: ['Cloud Fundamentals', 'Computer Networks', 'MS Office tools', 'Pseudo code reasoning', 'Grammar listening']
    },
    deloitte: {
      name: 'Deloitte (NLA / Consulting)',
      rounds: [
        { name: 'Quantitative Aptitude', count: 15, time: '20 mins' },
        { name: 'Logical Reasoning', count: 15, time: '20 mins' },
        { name: 'Verbal Ability', count: 15, time: '15 mins' },
        { name: 'Technical Assessment (MCQ)', count: 20, time: '25 mins' },
        { name: 'Coders Round', count: 1, time: '30 mins' }
      ],
      description: 'Comprehensive curriculum for Deloitte Consulting and Advisory analyst positions.',
      difficulty: 'Medium',
      focusAreas: ['Profit & Loss', 'Syllogisms', 'Reading Comprehension', 'SQL queries', 'Sorting & Searching']
    }
  };

  const defaultGuide = {
    name: companyName.charAt(0).toUpperCase() + companyName.slice(1) + ' Prep',
    rounds: [
      { name: 'General Aptitude', count: 25, time: '30 mins' },
      { name: 'Technical Theory', count: 20, time: '25 mins' },
      { name: 'Coding Practice', count: 2, time: '40 mins' }
    ],
    description: `Placement guidelines and mock templates for ${companyName}.`,
    difficulty: 'Medium',
    focusAreas: ['Aptitude', 'Data Structures', 'OOPs', 'System Design']
  };

  const details = mockGuides[company] || defaultGuide;
  res.status(200).json({ success: true, company: details });
};

// 6. Get Coding AI Explanation
export const getCodingAIExplanation = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  try {
    const question = await Question.findById(id);
    if (!question) {
      return res.status(404).json({ success: false, message: 'Question not found' });
    }

    const explanation = await explainCodingProblem(question.topic, question.questionText);
    res.status(200).json({ success: true, explanation });
  } catch (error) {
    console.error('Error fetching coding AI explanation:', error);
    res.status(500).json({ success: false, message: 'Error generating AI explanation' });
  }
};

// 7. Ask AI Interviewer Doubt / Follow-up
export const askAIInterviewer = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { chatHistory } = req.body; // Array of { role: 'user'|'model', parts: string }

  try {
    const question = await Question.findById(id);
    if (!question) {
      return res.status(404).json({ success: false, message: 'Question not found' });
    }

    const responseText = await generateAIInterviewerFollowUp(
      question.topic,
      question.questionText,
      chatHistory || []
    );

    res.status(200).json({ success: true, response: responseText });
  } catch (error) {
    console.error('Error in AI interviewer communication:', error);
    res.status(500).json({ success: false, message: 'Error in AI interviewer dialogue' });
  }
};

// 8. Get Daily Challenge
export const getDailyChallenge = async (req: AuthRequest, res: Response) => {
  try {
    // Select a deterministic question of the day from coding questions
    const codingQuestions = await Question.find({ type: 'Coding' });
    if (codingQuestions.length === 0) {
      return res.status(404).json({ success: false, message: 'No coding questions available' });
    }

    // Use current date seed
    const daySeed = new Date().getDate();
    const index = daySeed % codingQuestions.length;
    const dailyQuestion = codingQuestions[index];

    res.status(200).json({
      success: true,
      question: dailyQuestion
    });
  } catch (error) {
    console.error('Error fetching daily challenge:', error);
    res.status(500).json({ success: false, message: 'Server error daily challenge' });
  }
};
