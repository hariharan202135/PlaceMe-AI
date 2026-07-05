import { Response } from 'express';
import crypto from 'crypto';
import Razorpay from 'razorpay';
import User from '../models/User';
import Payment from '../models/Payment';
import { AuthRequest } from '../middlewares/auth';

const KEY_ID = process.env.RAZORPAY_KEY_ID || 'rzp_test_mock_key';
const KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || 'mock_secret_key';

// Initialize Razorpay SDK safely
const getRazorpayInstance = () => {
  if (KEY_ID === 'rzp_test_mock_key' || KEY_SECRET === 'mock_secret_key') {
    return null;
  }
  return new Razorpay({
    key_id: KEY_ID,
    key_secret: KEY_SECRET
  });
};

// 1. Initiate Subscription
export const createSubscription = async (req: AuthRequest, res: Response) => {
  const { plan } = req.body; // 'Monthly' | 'Yearly'

  if (!plan || !['Monthly', 'Yearly'].includes(plan)) {
    return res.status(400).json({ success: false, message: 'Invalid plan selected. Choose Monthly or Yearly.' });
  }

  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  try {
    const amount = plan === 'Monthly' ? 25 : 80;
    const razorpay = getRazorpayInstance();

    if (!razorpay) {
      console.warn('⚠️ Razorpay keys are default mock templates. Initializing simulated subscription.');
      const mockSubId = `sub_mock_${Math.random().toString(36).substring(2, 12)}`;
      
      return res.status(201).json({
        success: true,
        isMock: true,
        key: KEY_ID,
        subscriptionId: mockSubId,
        amount: amount * 100, // in paisa
        planName: `${plan} Premium Plan`,
        message: 'Mock subscription created. Proceed to verify-payment with mock variables.'
      });
    }

    // Standard Razorpay subscription requires a Plan ID pre-configured on dashboard.
    // If not configured, we create a direct payment Order instead for easier setup!
    // Direct payment orders are highly reliable and do not block due to missing subscription plan IDs.
    const order = await razorpay.orders.create({
      amount: amount * 100, // convert to paisa
      currency: 'INR',
      receipt: `receipt_user_${req.user._id.toString().substring(18)}_${Date.now().toString().slice(8)}`,
      notes: { plan, userId: req.user._id.toString() }
    });

    res.status(201).json({
      success: true,
      isMock: false,
      key: KEY_ID,
      orderId: order.id,
      amount: order.amount,
      planName: `${plan} Premium Plan`
    });

  } catch (error: any) {
    console.error('Razorpay subscription initiation failed:', error);
    res.status(500).json({ success: false, message: 'Error initiating checkout process' });
  }
};

// 2. Verify Payment & Activate Plan
export const verifyPayment = async (req: AuthRequest, res: Response) => {
  const { 
    razorpay_payment_id, 
    razorpay_order_id, 
    razorpay_subscription_id, 
    razorpay_signature,
    plan // 'Monthly' | 'Yearly'
  } = req.body;

  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  try {
    const isMock = razorpay_subscription_id && razorpay_subscription_id.startsWith('sub_mock_');
    const amount = plan === 'Monthly' ? 25 : 80;

    if (isMock) {
      // Complete mock payment validation
      const user = await User.findById(req.user._id);
      if (!user) return res.status(404).json({ success: false, message: 'User not found' });

      // Update subscription duration
      const durationDays = plan === 'Monthly' ? 30 : 365;
      const expiry = new Date();
      expiry.setDate(expiry.getDate() + durationDays);

      user.subscription = {
        plan,
        status: 'active',
        razorpaySubscriptionId: razorpay_subscription_id,
        currentPeriodEnd: expiry
      };

      await user.save();

      // Log Payment transaction
      await Payment.create({
        user: user._id,
        subscriptionId: razorpay_subscription_id,
        amount,
        status: 'Success'
      });

      return res.status(200).json({
        success: true,
        message: 'Mock subscription activated successfully!',
        user
      });
    }

    // Cryptographic validation for real Razorpay responses
    const secret = KEY_SECRET;
    let expectedSignature = '';
    
    if (razorpay_subscription_id) {
      // Signature verification for real recurring subscription models
      expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(razorpay_payment_id + '|' + razorpay_subscription_id)
        .digest('hex');
    } else if (razorpay_order_id) {
      // Signature verification for payment order models
      expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(razorpay_order_id + '|' + razorpay_payment_id)
        .digest('hex');
    }

    if (expectedSignature !== razorpay_signature) {
      // log failure
      await Payment.create({
        user: req.user._id,
        orderId: razorpay_order_id,
        paymentId: razorpay_payment_id,
        amount,
        status: 'Failed'
      });
      return res.status(400).json({ success: false, message: 'Payment verification failed: Signature mismatch' });
    }

    // Activate subscription
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const durationDays = plan === 'Monthly' ? 30 : 365;
    const expiry = new Date();
    expiry.setDate(expiry.getDate() + durationDays);

    user.subscription = {
      plan,
      status: 'active',
      razorpaySubscriptionId: razorpay_subscription_id || `order_${razorpay_order_id}`,
      currentPeriodEnd: expiry
    };

    await user.save();

    // Log success transaction
    await Payment.create({
      user: user._id,
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      subscriptionId: razorpay_subscription_id,
      signature: razorpay_signature,
      amount,
      status: 'Success'
    });

    res.status(200).json({
      success: true,
      message: 'Subscription successfully activated!',
      user
    });

  } catch (error) {
    console.error('Payment verification error:', error);
    res.status(500).json({ success: false, message: 'Error verifying subscription transaction' });
  }
};

// 3. Cancel Subscription
export const cancelSubscription = async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    if (user.subscription.status !== 'active') {
      return res.status(400).json({ success: false, message: 'No active subscription found to cancel.' });
    }

    // Standard Razorpay subscription cancel API:
    // const razorpay = getRazorpayInstance();
    // if (razorpay && user.subscription.razorpaySubscriptionId) {
    //   await razorpay.subscriptions.cancel(user.subscription.razorpaySubscriptionId);
    // }

    user.subscription.status = 'cancelled';
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Your plan has been cancelled. Premium access remains until the period expires.',
      user
    });
  } catch (error) {
    console.error('Cancel subscription error:', error);
    res.status(500).json({ success: false, message: 'Error cancelling subscription' });
  }
};
