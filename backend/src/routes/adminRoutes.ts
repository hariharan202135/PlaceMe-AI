import express from 'express';
import { getAdminStats, getAdminUsers, updateUserRoleOrPlan, adminCreateQuestion, adminUpdateQuestion, adminDeleteQuestion, getAdminPayments, deleteUser } from '../controllers/adminController';
import { protect, adminOnly } from '../middlewares/auth';

const router = express.Router();

// Apply admin gating middleware to all routes below
router.use(protect);
router.use(adminOnly);

router.get('/stats', getAdminStats);
router.get('/users', getAdminUsers);
router.put('/users/:id', updateUserRoleOrPlan);
router.delete('/users/:id', deleteUser);
router.post('/questions', adminCreateQuestion);
router.put('/questions/:id', adminUpdateQuestion);
router.delete('/questions/:id', adminDeleteQuestion);
router.get('/payments', getAdminPayments);

export default router;
