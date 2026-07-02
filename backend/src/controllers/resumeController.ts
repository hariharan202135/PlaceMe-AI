import { Response } from 'express';
import pdf from 'pdf-parse';
import ResumeAnalysis from '../models/ResumeAnalysis';
import User from '../models/User';
import { AuthRequest } from '../middlewares/auth';
import { analyzeResumeText } from '../utils/gemini';

// 1. Upload & Analyze Resume
export const analyzeResume = async (req: AuthRequest, res: Response) => {
  const { file, fileName } = req.body; // file is base64 string

  if (!file || !fileName) {
    return res.status(400).json({ success: false, message: 'Please provide file base64 content and fileName' });
  }

  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  try {
    // Convert base64 to buffer
    const base64Data = file.replace(/^data:application\/pdf;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');

    // 1. Validate File Size (Max 5MB)
    if (buffer.length > 5 * 1024 * 1024) {
      return res.status(400).json({ success: false, message: 'File size exceeds maximum limit of 5MB.' });
    }

    // 2. Validate PDF Signature (Magic Bytes: %PDF)
    const isPdf = buffer.length >= 4 &&
      buffer[0] === 0x25 && // %
      buffer[1] === 0x50 && // P
      buffer[2] === 0x44 && // D
      buffer[3] === 0x46;   // F

    if (!isPdf) {
      return res.status(400).json({ success: false, message: 'Invalid file format. Only PDF files are allowed.' });
    }

    // Parse PDF text
    let resumeText = '';
    try {
      const parsedPdf = await pdf(buffer);
      resumeText = parsedPdf.text || '';
    } catch (parseError) {
      console.error('PDF parsing failed, utilizing string extraction fallback:', parseError);
      // Fallback: Use string buffer dump if PDF parsing fails
      resumeText = buffer.toString('utf-8').replace(/[^\x20-\x7E\n\r\t]/g, '');
    }

    if (!resumeText || resumeText.trim().length < 50) {
      return res.status(400).json({ 
        success: false, 
        message: 'Could not extract sufficient text from the PDF. Ensure it is a valid text-based PDF.' 
      });
    }

    // Call Gemini utility to evaluate ATS structure and details
    const analysisResult = await analyzeResumeText(resumeText);

    // Save to DB
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

    // Update user profile resumeScore
    const user = await User.findById(req.user._id);
    if (user) {
      user.resumeScore = analysisResult.atsScore;
      await user.save();
    }

    res.status(201).json({
      success: true,
      analysis: resumeAnalysis
    });
  } catch (error: any) {
    console.error('Resume analysis endpoint error:', error);
    res.status(500).json({ 
      success: false, 
      message: `Error processing resume analysis: ${error.message || error}` 
    });
  }
};

// 2. Fetch past resume logs
export const getResumeHistory = async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  try {
    const history = await ResumeAnalysis.find({ user: req.user._id })
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, history });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error retrieving resume history' });
  }
};

// 3. Clear resume history
export const clearResumeHistory = async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  try {
    await ResumeAnalysis.deleteMany({ user: req.user._id });
    
    // Also reset user profile resume score in their dashboard
    const user = await User.findById(req.user._id);
    if (user) {
      user.resumeScore = 0;
      await user.save();
    }

    res.status(200).json({ success: true, message: 'Resume analysis history cleared successfully.' });
  } catch (error) {
    console.error('Error clearing resume history:', error);
    res.status(500).json({ success: false, message: 'Error clearing resume history' });
  }
};

import UserResume from '../models/UserResume';

// 4. Save Resume Draft / Creator Document
export const saveUserResume = async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  const { id, template, name, role, email, phone, linkedin, github, photoUrl, summary, skills, experience, projects, education, achievements, certifications } = req.body;

  try {
    if (id) {
      // Update existing resume
      const existingResume = await UserResume.findOne({ _id: id, user: req.user._id });
      if (!existingResume) {
        return res.status(404).json({ success: false, message: 'Resume not found' });
      }

      existingResume.template = template || existingResume.template;
      existingResume.name = name || existingResume.name;
      existingResume.role = role || existingResume.role;
      existingResume.email = email || existingResume.email;
      existingResume.phone = phone || existingResume.phone;
      existingResume.linkedin = linkedin;
      existingResume.github = github;
      existingResume.photoUrl = photoUrl;
      existingResume.summary = summary || existingResume.summary;
      existingResume.skills = skills || existingResume.skills;
      existingResume.experience = experience || existingResume.experience;
      existingResume.projects = projects || existingResume.projects;
      existingResume.education = education || existingResume.education;
      existingResume.achievements = achievements || existingResume.achievements;
      existingResume.certifications = certifications || existingResume.certifications;

      await existingResume.save();

      return res.status(200).json({ success: true, message: 'Resume updated successfully', resume: existingResume });
    } else {
      // Create new resume
      const resumeCount = await UserResume.countDocuments({ user: req.user._id });
      const isPaid = resumeCount === 0; // First resume is free!

      const newResume = await UserResume.create({
        user: req.user._id,
        template: template || 'classic',
        name,
        role,
        email,
        phone,
        linkedin,
        github,
        photoUrl,
        summary,
        skills,
        experience,
        projects,
        education,
        achievements,
        certifications,
        isPaid
      });

      return res.status(201).json({ success: true, message: 'Resume created successfully', resume: newResume });
    }
  } catch (error: any) {
    console.error('Error saving user resume:', error);
    res.status(500).json({ success: false, message: 'Error saving resume details' });
  }
};

// 5. Get all User Resumes
export const getUserResumes = async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  try {
    const resumes = await UserResume.find({ user: req.user._id }).sort({ updatedAt: -1 });
    res.status(200).json({ success: true, resumes });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error retrieving your resumes' });
  }
};

// 6. Pay for Resume (Simulated checkout of 5 rupees)
export const payForResume = async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  const { id } = req.params;

  try {
    const resume = await UserResume.findOne({ _id: id, user: req.user._id });
    if (!resume) {
      return res.status(404).json({ success: false, message: 'Resume not found' });
    }

    resume.isPaid = true;
    await resume.save();

    res.status(200).json({ success: true, message: 'Payment of ₹5 verified successfully. Resume unlocked.', resume });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating resume payment status' });
  }
};

// 7. Delete User Resume
export const deleteUserResume = async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  const { id } = req.params;

  try {
    await UserResume.deleteOne({ _id: id, user: req.user._id });
    res.status(200).json({ success: true, message: 'Resume deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error deleting resume' });
  }
};

// 8. Check Download Permission
export const checkDownloadPermission = async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  const { resumeId } = req.body;

  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const hasActiveSubscription = user.subscription && 
                                  user.subscription.plan !== 'Free' && 
                                  user.subscription.status === 'active';

    if (hasActiveSubscription) {
      return res.status(200).json({ success: true, payRequired: false });
    }

    // 1. If a specific resume is requested, check if it is already paid/unlocked
    if (resumeId) {
      const resume = await UserResume.findOne({ _id: resumeId, user: req.user._id });
      if (resume && resume.isPaid) {
        return res.status(200).json({ success: true, payRequired: false });
      }
    }

    // 2. Check if user has active paid download balance
    if (user.paidResumeDownloadsBalance > 0) {
      return res.status(200).json({ success: true, payRequired: false });
    }

    // 3. Check if this is the user's first resume download (resumeDownloadsCount is 0)
    if (user.resumeDownloadsCount === 0) {
      return res.status(200).json({ success: true, payRequired: false });
    }

    // 4. Fallback: If they have only 1 resume in total, it must be free
    const totalResumes = await UserResume.countDocuments({ user: req.user._id });
    if (totalResumes <= 1) {
      return res.status(200).json({ success: true, payRequired: false });
    }

    // 5. Ultimate Fallback: If they have NO resumes marked as isPaid: true, they have never successfully downloaded any resume!
    const hasAnyPaidResume = await UserResume.exists({ user: req.user._id, isPaid: true });
    if (!hasAnyPaidResume) {
      return res.status(200).json({ success: true, payRequired: false });
    }

    return res.status(200).json({ success: false, payRequired: true });
  } catch (error) {
    console.error('Error checking download permission:', error);
    res.status(500).json({ success: false, message: 'Server error check permission' });
  }
};

// 9. Confirm Successful Download (Deducts balance / updates count only after action is fired)
export const confirmDownloadSuccess = async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  const { resumeId } = req.body;

  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const hasActiveSubscription = user.subscription && 
                                  user.subscription.plan !== 'Free' && 
                                  user.subscription.status === 'active';

    if (hasActiveSubscription) {
      return res.status(200).json({ success: true });
    }

    if (resumeId) {
      const resume = await UserResume.findOne({ _id: resumeId, user: req.user._id });
      if (resume) {
        if (resume.isPaid) {
          return res.status(200).json({ success: true });
        }

        // Consume free download
        if (user.resumeDownloadsCount === 0) {
          user.resumeDownloadsCount = 1;
          await user.save();
          resume.isPaid = true;
          await resume.save();
          return res.status(200).json({ success: true, message: 'First free download confirmed.' });
        }

        // Consume paid balance
        if (user.paidResumeDownloadsBalance > 0) {
          user.paidResumeDownloadsBalance -= 1;
          await user.save();
          resume.isPaid = true;
          await resume.save();
          return res.status(200).json({ success: true, message: 'Paid download confirmed.' });
        }

        // Check if there are no paid resumes at all, grant as free download
        const hasAnyPaidResume = await UserResume.exists({ user: req.user._id, isPaid: true });
        if (!hasAnyPaidResume) {
          user.resumeDownloadsCount = 1;
          await user.save();
          resume.isPaid = true;
          await resume.save();
          return res.status(200).json({ success: true, message: 'First free download confirmed via override.' });
        }
      }
    }

    res.status(400).json({ success: false, message: 'No valid download credit or resume found.' });
  } catch (error) {
    console.error('Error confirming download success:', error);
    res.status(500).json({ success: false, message: 'Server error confirming download' });
  }
};

// 9. Process Download Payment (₹5)
export const processDownloadPayment = async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.paidResumeDownloadsBalance += 1;
    await user.save();

    res.status(200).json({ success: true, message: 'Simulated payment of ₹5 to 9894995725 successful.', balance: user.paidResumeDownloadsBalance });
  } catch (error) {
    console.error('Error processing download payment:', error);
    res.status(500).json({ success: false, message: 'Server error processing payment' });
  }
};
