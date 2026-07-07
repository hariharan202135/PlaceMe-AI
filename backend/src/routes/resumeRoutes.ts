import express from 'express';
import { 
  analyzeResume, 
  getResumeHistory, 
  clearResumeHistory,
  saveUserResume,
  getUserResumes,
  payForResume,
  deleteUserResume,
  checkDownloadPermission,
  confirmDownloadSuccess,
  processDownloadPayment,
  getResumePhoto
} from '../controllers/resumeController';
import { protect } from '../middlewares/auth';

const router = express.Router();

router.post('/analyze', protect, analyzeResume);
router.get('/history', protect, getResumeHistory);
router.delete('/history', protect, clearResumeHistory);

// Creator routes
router.post('/create', protect, saveUserResume);
router.get('/my-resumes', protect, getUserResumes);
router.post('/:id/pay', protect, payForResume);
router.delete('/:id', protect, deleteUserResume);
router.get('/photo/:id', getResumePhoto);

router.post('/download-started', protect, checkDownloadPermission);
router.post('/download-completed', protect, confirmDownloadSuccess);
router.post('/pay-download', protect, processDownloadPayment);

export default router;
