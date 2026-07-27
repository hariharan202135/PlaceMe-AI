import { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
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

  let savedPhotoUrl = photoUrl;

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
      existingResume.photoUrl = savedPhotoUrl;
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
      if (resumeCount >= 1) {
        return res.status(400).json({ success: false, message: 'You can only create and save one resume. Please edit your existing resume.' });
      }
      const isPaid = true; // First and only resume is free and unlocked!

      const newResume = await UserResume.create({
        user: req.user._id,
        template: template || 'classic',
        name,
        role,
        email,
        phone,
        linkedin,
        github,
        photoUrl: savedPhotoUrl,
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
    // Downloads are now completely free and unlimited for all users!
    return res.status(200).json({ success: true, payRequired: false });
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

// 10. Serve Resume Photo as binary stream for Word compatibility
export const getResumePhoto = async (req: Request, res: Response) => {
  try {
    const resume = await UserResume.findById(req.params.id);
    if (!resume || !resume.photoUrl) {
      return res.status(404).send('Not Found');
    }

    if (resume.photoUrl.startsWith('data:image/')) {
      const matches = resume.photoUrl.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      if (matches && matches.length === 3) {
        const contentType = matches[1];
        const dataBuffer = Buffer.from(matches[2], 'base64');
        res.contentType(contentType);
        return res.send(dataBuffer);
      }
    }

    return res.redirect(resume.photoUrl);
  } catch (error) {
    console.error('Error retrieving resume photo:', error);
    res.status(500).send('Server Error');
  }
};

// 11. Generate Production A4 PDF using Puppeteer Chromium Engine
export const downloadResumePDF = async (req: AuthRequest, res: Response) => {
  const { html, filename } = req.body;

  if (!html) {
    return res.status(400).json({ success: false, message: 'Please provide resume HTML content' });
  }

  console.log('=== DEBUG: RECEIVED RESUME HTML ===');
  console.log('HTML Total Length:', html.length);

  // Save received HTML temporarily as debug.html
  const debugHtmlPath = path.join(__dirname, '../../debug.html');
  try {
    fs.writeFileSync(debugHtmlPath, html, 'utf-8');
    console.log('Saved debug.html to:', debugHtmlPath);
  } catch (e) {}

  let browser: any = null;
  try {
    // 1. Try @sparticuz/chromium + puppeteer-core (for Render / Linux / Cloud container environments)
    try {
      const chromiumModule = await import('@sparticuz/chromium');
      const puppeteerCoreModule = await import('puppeteer-core');

      const chromium = chromiumModule.default || (chromiumModule as any);
      const puppeteerCore = puppeteerCoreModule.default || (puppeteerCoreModule as any);

      const execPath = await chromium.executablePath();
      if (execPath) {
        console.log('Launching Puppeteer Core via @sparticuz/chromium executablePath:', execPath);
        browser = await puppeteerCore.launch({
          args: [...(chromium.args || []), '--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
          defaultViewport: (chromium as any).defaultViewport,
          executablePath: execPath,
          headless: (chromium as any).headless === 'shell' ? 'shell' : true
        });
        console.log('Successfully launched browser via @sparticuz/chromium!');
      }
    } catch (sparticuzErr: any) {
      console.warn('Sparticuz Chromium launch notice (switching to standard puppeteer):', sparticuzErr?.message || sparticuzErr);
    }

    // 2. Fallback to standard puppeteer (for Windows local dev or standard Linux environments)
    if (!browser) {
      const puppeteerModule = await import('puppeteer');
      const puppeteer = puppeteerModule.default || (puppeteerModule as any);

      const launchOptions: any = {
        headless: 'new',
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
          '--no-first-run',
          '--no-zygote',
          '--single-process'
        ]
      };

      if (process.env.PUPPETEER_EXECUTABLE_PATH) {
        launchOptions.executablePath = process.env.PUPPETEER_EXECUTABLE_PATH;
      }

      console.log('Launching standard Puppeteer with options:', launchOptions);
      browser = await puppeteer.launch(launchOptions);
      console.log('Successfully launched browser via standard puppeteer!');
    }

    if (!browser) {
      throw new Error('Could not launch Chromium browser instance.');
    }

    const page = await browser.newPage();

    await page.setViewport({ width: 1200, height: 1600, deviceScaleFactor: 2 });

    // Set HTML content and wait until network is idle
    await page.setContent(html, {
      waitUntil: 'networkidle0' as any,
      timeout: 30000
    });

    // Inject fail-safe CSS overrides to strictly enforce 90px profile photo dimensions and 794px A4 container layout
    await page.addStyleTag({
      content: `
        @page {
          size: A4 portrait;
          margin: 0;
        }
        html, body {
          background-color: #ffffff !important;
          color: #111827 !important;
          margin: 0 !important;
          padding: 0 !important;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        #printable-resume-preview {
          width: 794px !important;
          min-height: 1123px !important;
          max-width: 794px !important;
          margin: 0 auto !important;
          padding: 32px !important;
          background: #ffffff !important;
          box-sizing: border-box !important;
          transform: none !important;
          box-shadow: none !important;
          border: none !important;
        }
        #printable-resume-preview img {
          width: 90px !important;
          height: 90px !important;
          min-width: 90px !important;
          min-height: 90px !important;
          max-width: 90px !important;
          max-height: 90px !important;
          object-fit: cover !important;
          border-radius: 50% !important;
          flex-shrink: 0 !important;
          display: block !important;
        }
      `
    });

    // Wait for printable resume preview element to be visible
    try {
      await page.waitForSelector("#printable-resume-preview", {
        visible: true,
        timeout: 10000
      });
      console.log('Selector #printable-resume-preview found and visible!');
    } catch (e) {
      console.error('Selector #printable-resume-preview NOT visible or timeout:', e);
    }

    // Evaluate lengths and rect inside Chromium
    const metrics = await page.evaluate(() => {
      const bodyHtmlLength = document.body.innerHTML.length;
      const previewEl = document.querySelector("#printable-resume-preview") as HTMLElement;
      const previewHtmlLength = previewEl ? previewEl.outerHTML.length : 0;
      const rect = previewEl ? {
        width: previewEl.offsetWidth,
        height: previewEl.offsetHeight,
        top: previewEl.getBoundingClientRect().top,
        left: previewEl.getBoundingClientRect().left
      } : null;

      return {
        bodyHtmlLength,
        previewHtmlLength,
        rect
      };
    });

    console.log('document.body.innerHTML.length:', metrics.bodyHtmlLength);
    console.log('document.querySelector("#printable-resume-preview")?.outerHTML.length:', metrics.previewHtmlLength);
    console.log('Preview element rect:', metrics.rect);

    // Ensure all images are loaded completely
    await page.evaluate(async () => {
      const imgs = Array.from(document.querySelectorAll('img'));
      await Promise.all(
        imgs.map((img) => {
          if (img.complete) return Promise.resolve();
          return new Promise((resolve) => {
            img.onload = resolve;
            img.onerror = resolve;
          });
        })
      );
    });

    // Emulate screen media type so @media print rules do not hide elements or alter styles
    await page.emulateMediaType('screen');

    // Capture screenshot debug.png before generating PDF
    const debugPngPath = path.join(__dirname, '../../debug.png');
    try {
      await page.screenshot({
        path: debugPngPath,
        fullPage: true
      });
      console.log('Captured debug screenshot to:', debugPngPath);
    } catch (e) {}

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      preferCSSPageSize: false,
      margin: {
        top: '10mm',
        bottom: '10mm',
        left: '10mm',
        right: '10mm'
      }
    });

    await browser.close();

    const safeFilename = (filename || 'Resume').replace(/[^a-zA-Z0-9_-]/g, '_');

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${safeFilename}.pdf"`);
    res.setHeader('Content-Length', pdfBuffer.length);

    return res.send(Buffer.from(pdfBuffer));
  } catch (error: any) {
    if (browser) {
      try {
        await browser.close();
      } catch (e) {}
    }
    console.error('=== FULL PUPPETEER PDF STACK TRACE ERROR ===');
    console.error(error.stack || error);
    return res.status(500).json({
      success: false,
      message: `Failed to generate PDF: ${error.message || error}`,
      stack: process.env.NODE_ENV !== 'production' ? error.stack : undefined
    });
  }
};
