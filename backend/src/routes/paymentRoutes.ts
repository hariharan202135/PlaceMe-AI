import express from 'express';
import { createSubscription, verifyPayment, cancelSubscription } from '../controllers/paymentController';
import { protect } from '../middlewares/auth';

const router = express.Router();

router.post('/create-subscription', protect, createSubscription);
router.post('/verify', protect, verifyPayment);
router.post('/cancel', protect, cancelSubscription);

export default router;
