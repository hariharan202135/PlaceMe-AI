import { Response } from 'express';
import Question from '../models/Question';
import CodingSubmission from '../models/CodingSubmission';
import User from '../models/User';
import { AuthRequest } from '../middlewares/auth';
import { executeCode } from '../utils/codeRunner';

// 1. Get Coding Problems
export const getCodingProblems = async (req: AuthRequest, res: Response) => {
  try {
    const { domain, setIndex } = req.query;
    const filter: any = { type: 'Coding' };
    if (domain) filter.codingDomain = domain;
    if (setIndex) filter.codingSetIndex = Number(setIndex);

    const problems = await Question.find(filter)
      .populate('category')
      .select('-codingTestCases'); // Hide test cases for summary listing

    let unlockedSets: string[] = [];
    if (req.user) {
      const user = await User.findById(req.user._id);
      if (user) {
        unlockedSets = user.unlockedCodingSets || [];
      }
    }

    res.status(200).json({ success: true, problems, unlockedSets });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error retrieving coding challenges' });
  }
};

// 2. Get Single Problem details (Exposes only visible test cases)
export const getCodingProblemById = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  try {
    const problem = await Question.findById(id).populate('category');
    if (!problem || problem.type !== 'Coding') {
      return res.status(404).json({ success: false, message: 'Coding challenge not found' });
    }

    // Filter test cases to only return visible ones
    const visibleTestCases = problem.codingTestCases 
      ? problem.codingTestCases.filter(t => !t.isHidden)
      : [];

    const problemObj = problem.toObject();
    delete problemObj.codingTestCases; // strip all test cases

    res.status(200).json({
      success: true,
      problem: {
        ...problemObj,
        visibleTestCases // Only attach visible ones
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error retrieving challenge details' });
  }
};

// 3. Run trial code (Run against a custom input or the first test case)
export const runCodingTest = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { code, language, customInput } = req.body;

  if (!code || !language) {
    return res.status(400).json({ success: false, message: 'Missing code or language' });
  }

  try {
    const problem = await Question.findById(id);
    if (!problem || problem.type !== 'Coding') {
      return res.status(404).json({ success: false, message: 'Coding challenge not found' });
    }

    // Get input & expected output
    let runInput = '';
    let expectedOutput = '';

    if (customInput !== undefined) {
      runInput = customInput;
    } else if (problem.codingTestCases && problem.codingTestCases.length > 0) {
      runInput = problem.codingTestCases[0].input;
      expectedOutput = problem.codingTestCases[0].output;
    }

    const runResult = await executeCode(code, language, runInput, expectedOutput);

    res.status(200).json({
      success: true,
      runResult: {
        status: runResult.status,
        stdout: runResult.stdout,
        stderr: runResult.stderr,
        timeTaken: runResult.timeTaken
      }
    });
  } catch (error) {
    console.error('Error running test code:', error);
    res.status(500).json({ success: false, message: 'Error during code execution' });
  }
};

// 4. Submit code (Runs against all test cases - visible & hidden)
export const submitCodingSolution = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { code, language } = req.body;

  if (!code || !language) {
    return res.status(400).json({ success: false, message: 'Missing code or language' });
  }

  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  try {
    const problem = await Question.findById(id);
    if (!problem || problem.type !== 'Coding') {
      return res.status(404).json({ success: false, message: 'Coding challenge not found' });
    }

    const testCases = problem.codingTestCases || [];
    if (testCases.length === 0) {
      return res.status(400).json({ success: false, message: 'No test cases configured for this problem.' });
    }

    let finalStatus: any = 'Accepted';
    let failedTestCaseIndex = -1;
    let failedTestCaseDetails: any = null;
    let totalTimeTaken = 0;

    for (let i = 0; i < testCases.length; i++) {
      const tc = testCases[i];
      const runResult = await executeCode(code, language, tc.input, tc.output);
      totalTimeTaken += runResult.timeTaken;

      if (runResult.status !== 'Accepted') {
        finalStatus = runResult.status;
        failedTestCaseIndex = i;
        
        // Only return test details if it is a public visible test case
        if (!tc.isHidden) {
          failedTestCaseDetails = {
            input: tc.input,
            expectedOutput: tc.output,
            actualOutput: runResult.stdout,
            error: runResult.stderr
          };
        }
        break; // Stop evaluating on first failure
      }
    }

    const averageTime = Math.round(totalTimeTaken / testCases.length);

    // Score weight based on difficulty
    let scoreWeight = 10;
    if (problem.difficulty === 'Medium') scoreWeight = 20;
    if (problem.difficulty === 'Hard') scoreWeight = 30;

    const awardedScore = finalStatus === 'Accepted' ? scoreWeight : 0;

    // Create submission record
    const submission = await CodingSubmission.create({
      user: req.user._id,
      question: problem._id,
      code,
      language,
      status: finalStatus,
      errorDetails: failedTestCaseDetails ? failedTestCaseDetails.error : undefined,
      score: awardedScore
    });

    // Update user coding score & solved tracking lists
    const user = await User.findById(req.user._id);
    if (user) {
      if (finalStatus === 'Accepted') {
        user.codingScore = Math.min(100, user.codingScore + awardedScore);
        
        // Add to solved questions list if not already present
        if (!user.solvedQuestions.includes(problem._id)) {
          user.solvedQuestions.push(problem._id);
        }
        
        // Remove from attempted list since solved
        const attIdx = user.attemptedQuestions.indexOf(problem._id);
        if (attIdx >= 0) user.attemptedQuestions.splice(attIdx, 1);
      } else {
        // Add to attempted list if not already solved and not already in attempted list
        const isSolved = user.solvedQuestions.includes(problem._id);
        const isAlreadyAttempted = user.attemptedQuestions.includes(problem._id);
        if (!isSolved && !isAlreadyAttempted) {
          user.attemptedQuestions.push(problem._id);
        }
      }
      await user.save();
    }

    res.status(201).json({
      success: true,
      submission: {
        _id: submission._id,
        status: submission.status,
        score: submission.score,
        timeTaken: averageTime,
        failedTestCaseIndex,
        failedTestCaseDetails
      }
    });

  } catch (error) {
    console.error('Error submitting coding solution:', error);
    res.status(500).json({ success: false, message: 'Error processing code submission' });
  }
};

// 5. Get user submission history
export const getSubmissionHistory = async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  try {
    const history = await CodingSubmission.find({ user: req.user._id })
      .populate('question', 'questionText topic difficulty')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, history });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error retrieving submissions history' });
  }
};

// 6. Unlock Premium Coding Set (UTR Payment Verification)
export const unlockCodingSet = async (req: AuthRequest, res: Response) => {
  const { domain, setIndex, utr } = req.body;

  if (!domain || !setIndex || !utr) {
    return res.status(400).json({ success: false, message: 'Missing domain, setIndex, or UTR number' });
  }

  if (utr.trim().length !== 12 || isNaN(Number(utr.trim()))) {
    return res.status(400).json({ success: false, message: 'Invalid 12-digit UTR number format' });
  }

  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const setToken = `${domain}_Set ${setIndex}`;

    // Add to unlocked sets if not already present
    if (!user.unlockedCodingSets.includes(setToken)) {
      user.unlockedCodingSets.push(setToken);
      await user.save();
    }

    res.status(200).json({
      success: true,
      message: `Successfully unlocked ${setToken}`,
      unlockedSets: user.unlockedCodingSets
    });
  } catch (error) {
    console.error('Error unlocking coding set:', error);
    res.status(500).json({ success: false, message: 'Error unlocking coding set' });
  }
};
