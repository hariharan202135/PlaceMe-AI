import { Response } from 'express';
import User from '../models/User';
import Question from '../models/Question';
import MockTest from '../models/MockTest';
import TestResult from '../models/TestResult';
import Payment from '../models/Payment';
import AdminLog from '../models/AdminLog';
import Category from '../models/Category';
import { AuthRequest } from '../middlewares/auth';

// Helper to log admin actions
const logAction = async (adminId: string, action: string, details: string, targetUserId?: string) => {
  try {
    await AdminLog.create({
      adminUser: adminId,
      action,
      details,
      targetUser: targetUserId
    });
  } catch (err) {
    console.error('Error writing admin audit log:', err);
  }
};

// 1. Overview Dashboard Statistics
export const getAdminStats = async (req: AuthRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ success: false, message: 'Unauthorized' });

  try {
    const totalUsers = await User.countDocuments();
    const premiumUsers = await User.countDocuments({ 'subscription.status': 'active' });
    const totalQuestions = await Question.countDocuments();
    const totalMockTests = await MockTest.countDocuments();
    const totalSubmissions = await TestResult.countDocuments();

    // Sum total revenue
    const revenueResult = await Payment.aggregate([
      { $match: { status: 'Success' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const totalRevenue = revenueResult.length > 0 ? revenueResult[0].total : 0;

    // Recent Payments
    const recentPayments = await Payment.find()
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .limit(5);

    // Recent Logs
    const recentLogs = await AdminLog.find()
      .populate('adminUser', 'name')
      .populate('targetUser', 'name email')
      .sort({ createdAt: -1 })
      .limit(5);

    res.status(200).json({
      success: true,
      stats: {
        totalUsers,
        premiumUsers,
        totalQuestions,
        totalMockTests,
        totalSubmissions,
        totalRevenue,
        recentPayments,
        recentLogs
      }
    });

  } catch (error) {
    console.error('Admin stats retrieval failed:', error);
    res.status(500).json({ success: false, message: 'Error retrieving admin stats' });
  }
};

// 2. Paginated User List with Search
export const getAdminUsers = async (req: AuthRequest, res: Response) => {
  const { search, limit = '10', skip = '0' } = req.query;
  const query: any = {};

  if (search) {
    query.$or = [
      { name: { $regex: search as string, $options: 'i' } },
      { email: { $regex: search as string, $options: 'i' } }
    ];
  }

  try {
    const parsedLimit = parseInt(limit as string);
    const parsedSkip = parseInt(skip as string);

    const users = await User.find(query)
      .limit(parsedLimit)
      .skip(parsedSkip)
      .sort({ createdAt: -1 });

    const total = await User.countDocuments(query);

    res.status(200).json({ success: true, total, users });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error listing users' });
  }
};

// 3. Update User Plan or Role
export const updateUserRoleOrPlan = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { role, plan, status } = req.body; // role: 'user'|'admin', plan: 'Free'|'Monthly'|'Yearly', status: 'active'|'inactive'
  
  if (!req.user) return res.status(401).json({ success: false, message: 'Unauthorized' });

  try {
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (role && ['user', 'admin'].includes(role)) {
      user.role = role;
    }

    if (plan && ['Free', 'Monthly', 'Yearly'].includes(plan)) {
      user.subscription.plan = plan;
      if (plan === 'Free') {
        user.subscription.status = 'inactive';
      } else {
        user.subscription.status = status || 'active';
        
        const duration = plan === 'Monthly' ? 30 : 365;
        const expiry = new Date();
        expiry.setDate(expiry.getDate() + duration);
        user.subscription.currentPeriodEnd = expiry;
      }
    }

    await user.save();

    await logAction(
      req.user._id.toString(), 
      'UPDATE_USER_PROFILE', 
      `Updated user role to ${user.role} and plan to ${user.subscription.plan}`,
      user._id.toString()
    );

    res.status(200).json({ success: true, message: 'User profile updated successfully', user });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating user configuration' });
  }
};

// 4. Create Question (MCQ / Coding)
export const adminCreateQuestion = async (req: AuthRequest, res: Response) => {
  const { categorySlug, topic, difficulty, type, questionText, options, correctOption, codingTestCases, explanation, companyTags } = req.body;

  if (!req.user) return res.status(401).json({ success: false, message: 'Unauthorized' });

  try {
    const category = await Category.findOne({ slug: categorySlug });
    if (!category) {
      return res.status(400).json({ success: false, message: `Category '${categorySlug}' does not exist` });
    }

    const question = await Question.create({
      category: category._id,
      topic,
      difficulty,
      type,
      questionText,
      options,
      correctOption,
      codingTestCases,
      explanation,
      companyTags
    });

    await logAction(
      req.user._id.toString(),
      'CREATE_QUESTION',
      `Created ${type} question on topic ${topic} inside ${categorySlug}`
    );

    res.status(201).json({ success: true, question });
  } catch (error: any) {
    console.error('Error creating question:', error);
    res.status(500).json({ success: false, message: error.message || 'Error creating question' });
  }
};

// 5. Update Question
export const adminUpdateQuestion = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const updates = req.body;

  if (!req.user) return res.status(401).json({ success: false, message: 'Unauthorized' });

  try {
    const question = await Question.findByIdAndUpdate(id, updates, { new: true });
    if (!question) {
      return res.status(404).json({ success: false, message: 'Question not found' });
    }

    await logAction(
      req.user._id.toString(),
      'UPDATE_QUESTION',
      `Modified question ${id}`
    );

    res.status(200).json({ success: true, question });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating question' });
  }
};

// 6. Delete Question
export const adminDeleteQuestion = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  if (!req.user) return res.status(401).json({ success: false, message: 'Unauthorized' });

  try {
    const question = await Question.findByIdAndDelete(id);
    if (!question) {
      return res.status(404).json({ success: false, message: 'Question not found' });
    }

    await logAction(
      req.user._id.toString(),
      'DELETE_QUESTION',
      `Deleted question ${id} with text preview: ${question.questionText.slice(0, 30)}...`
    );

    res.status(200).json({ success: true, message: 'Question successfully deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error deleting question' });
  }
};

// 7. Get Payment History Logs
export const getAdminPayments = async (req: AuthRequest, res: Response) => {
  try {
    const payments = await Payment.find()
      .populate('user', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, payments });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching billing lists' });
  }
};

// 8. Delete User account
export const deleteUser = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  if (!req.user) return res.status(401).json({ success: false, message: 'Unauthorized' });

  try {
    const user = await User.findByIdAndDelete(id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    await logAction(
      req.user._id.toString(),
      'DELETE_USER_ACCOUNT',
      `Permanently deleted user: ${user.name} (${user.email})`
    );

    res.status(200).json({ success: true, message: 'User successfully deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error deleting user account' });
  }
};
