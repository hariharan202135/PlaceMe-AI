'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { 
  CreditCard, CheckCircle2, ShieldCheck, AlertCircle, Info, 
  RefreshCw, Check, Sparkles, AlertTriangle, ShieldAlert
} from 'lucide-react';

export default function BillingPage() {
  const { user, refreshUser } = useAuth();
  
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Mock checkout simulation overlay
  const [mockOverlay, setMockOverlay] = useState<{ active: boolean; plan: 'Monthly' | 'Yearly'; subscriptionId: string } | null>(null);
  const [utrNo, setUtrNo] = useState('');
  const [selectedUpiApp, setSelectedUpiApp] = useState<'phonepe' | 'gpay' | 'paytm' | 'navi' | 'supermoney'>('phonepe');

  // Script loader helper for Razorpay
  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleSubscribe = async (plan: 'Monthly' | 'Yearly') => {
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await api.post('/payments/create-subscription', { plan });
      if (res.data.success) {
        const checkoutData = res.data;

        if (checkoutData.isMock) {
          // Trigger local mock simulator
          setMockOverlay({
            active: true,
            plan,
            subscriptionId: checkoutData.subscriptionId
          });
          setLoading(false);
          return;
        }

        // Real Razorpay Checkout flow
        const scriptLoaded = await loadRazorpayScript();
        if (!scriptLoaded) {
          setErrorMsg('Failed to load payment checkout SDK. Check network connection.');
          setLoading(false);
          return;
        }

        const options = {
          key: checkoutData.key,
          amount: checkoutData.amount,
          currency: 'INR',
          name: 'PlaceMe AI',
          description: checkoutData.planName,
          order_id: checkoutData.orderId,
          handler: async (response: any) => {
            setLoading(true);
            try {
              const verifyRes = await api.post('/payments/verify', {
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_signature: response.razorpay_signature,
                plan
              });
              if (verifyRes.data.success) {
                setSuccessMsg('Your premium subscription is now active! Enjoy unlimited features.');
                await refreshUser();
              } else {
                setErrorMsg('Signature verification failed.');
              }
            } catch (err: any) {
              setErrorMsg(err.response?.data?.message || 'Payment verification endpoint failed.');
            } finally {
              setLoading(false);
            }
          },
          prefill: {
            name: user?.name,
            email: user?.email
          },
          theme: {
            color: '#6366f1'
          }
        };

        const paymentWindow = (window as any).Razorpay(options);
        paymentWindow.open();
      }
    } catch (err: any) {
      console.error('Checkout error:', err);
      setErrorMsg('Checkout service is currently unconfigured. Standard Razorpay setup required.');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmMockPayment = async (status: 'Success' | 'Failed') => {
    if (!mockOverlay) return;
    setLoading(true);
    const { plan, subscriptionId } = mockOverlay;
    setMockOverlay(null);
    setUtrNo('');

    if (status === 'Failed') {
      setErrorMsg('Payment simulation cancelled by user.');
      setLoading(false);
      return;
    }

    try {
      const verifyRes = await api.post('/payments/verify', {
        razorpay_subscription_id: subscriptionId,
        plan
      });
      if (verifyRes.data.success) {
        setSuccessMsg('Mock payment successful! Premium features unlocked.');
        await refreshUser();
      }
    } catch (err: any) {
      setErrorMsg('Mock verification failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    setLoading(true);
    try {
      const res = await api.post('/payments/cancel');
      if (res.data.success) {
        setSuccessMsg('Subscription cancelled successfully. You will not be billed next cycle.');
        await refreshUser();
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Failed to cancel plan.');
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  const isActive = user.subscription?.status === 'active';
  const planName = user.subscription?.plan || 'Free';
  const renewalDate = user.subscription?.currentPeriodEnd 
    ? new Date(user.subscription.currentPeriodEnd).toLocaleDateString()
    : null;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Overlay Simulator */}
      {mockOverlay && (() => {
        const payAmount = mockOverlay.plan === 'Monthly' ? 29 : 199;
        const upiMapping = {
          phonepe: { name: 'PhonePe', vpa: '9894995725@ybl', color: 'border-purple-500 text-purple-400 bg-purple-500/10' },
          gpay: { name: 'GPay', vpa: '9894995725@okaxis', color: 'border-blue-500 text-blue-400 bg-blue-500/10' },
          paytm: { name: 'Paytm', vpa: '9894995725@paytm', color: 'border-cyan-500 text-cyan-400 bg-cyan-500/10' },
          navi: { name: 'Navi', vpa: '9894995725@navi', color: 'border-emerald-500 text-emerald-400 bg-emerald-500/10' },
          supermoney: { name: 'Super.money', vpa: '9894995725@upi', color: 'border-yellow-500 text-yellow-400 bg-yellow-500/10' }
        };
        const activeApp = upiMapping[selectedUpiApp];
        const upiUri = `upi://pay?pa=${activeApp.vpa}&pn=PlaceMe%20AI&am=${payAmount}&cu=INR`;
        const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(upiUri)}`;

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/85 backdrop-blur-sm p-4 overflow-y-auto">
            <div className="max-w-md w-full border border-border bg-card p-5 rounded-2xl space-y-4 shadow-2xl relative my-8">
              <div className="space-y-1 text-center">
                <Sparkles className="w-8 h-8 text-primary mx-auto animate-pulse" />
                <h3 className="text-lg font-bold">UPI Payments Portal</h3>
                <p className="text-xs text-muted-foreground">
                  Pay <strong>₹{payAmount}</strong> for the <strong>{mockOverlay.plan} Plan</strong>
                </p>
              </div>

              {/* UPI App Selection Tabs */}
              <div className="space-y-1.5">
                <label className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider block text-left">
                  Select UPI Application:
                </label>
                <div className="grid grid-cols-5 gap-1">
                  {(Object.keys(upiMapping) as Array<keyof typeof upiMapping>).map((key) => (
                    <button
                      key={key}
                      onClick={() => setSelectedUpiApp(key)}
                      className={`py-1.5 px-1 rounded-lg text-[9px] font-bold border transition text-center ${
                        selectedUpiApp === key
                          ? upiMapping[key].color
                          : 'border-border text-muted-foreground hover:bg-muted/50'
                      }`}
                    >
                      {upiMapping[key].name}
                    </button>
                  ))}
                </div>
              </div>

              {/* QR Code & Pay Link */}
              <div className="flex flex-col items-center justify-center bg-white/5 p-4 rounded-xl border border-border/60 space-y-3">
                <div className="bg-white p-2 rounded-lg inline-block">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={qrCodeUrl}
                    alt="Scan to Pay"
                    className="w-40 h-40 object-contain"
                  />
                </div>
                <div className="text-center space-y-1">
                  <div className="text-[10px] text-muted-foreground">VPA: <span className="font-mono text-foreground font-semibold select-all">{activeApp.vpa}</span></div>
                  <a
                    href={upiUri}
                    className="inline-flex items-center space-x-1.5 bg-primary hover:bg-primary/90 text-primary-foreground font-extrabold text-[11px] py-1.5 px-4 rounded-xl transition shadow"
                  >
                    <span>Click to Pay via App</span>
                  </a>
                </div>
              </div>

              {/* UTR Input Form */}
              <div className="space-y-2 text-left">
                <label className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider block">
                  Verify Transaction Details:
                </label>
                <input
                  type="text"
                  required
                  placeholder="Enter 12-digit UTR Ref / Transaction ID"
                  value={utrNo}
                  onChange={(e) => setUtrNo(e.target.value)}
                  className="w-full p-2.5 bg-background border border-border rounded-lg outline-none font-mono text-[11px] focus:ring-1 focus:ring-primary text-foreground text-center"
                />
              </div>

              {/* Action buttons */}
              <div className="flex space-x-3 text-xs pt-1">
                <button
                  onClick={() => handleConfirmMockPayment('Failed')}
                  className="flex-1 py-2 border border-border rounded-xl font-bold hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleConfirmMockPayment('Success')}
                  disabled={!utrNo.trim()}
                  className="flex-1 py-2 bg-primary text-primary-foreground font-bold rounded-xl hover:bg-primary/95 disabled:opacity-35"
                >
                  Confirm Payment
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Billing & Subscriptions</h1>
        <p className="text-sm text-muted-foreground">
          Manage your account plans. Active premium plans unlock AI resume evaluation metrics and detailed HR feedback files.
        </p>
      </div>

      {successMsg && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 rounded-xl p-3 text-sm flex items-center space-x-2">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-500 rounded-xl p-3 text-sm flex items-center space-x-2">
          <ShieldAlert className="w-5 h-5 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Subscription Info Card */}
      <div className="p-6 border border-border bg-card/35 rounded-2xl relative overflow-hidden">
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-primary/10 rounded-full blur-3xl" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left relative z-10">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block">Active Plan</span>
            <h3 className="text-xl font-bold text-foreground">{planName} Subscription</h3>
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase block w-fit mt-1.5 ${
              isActive ? 'bg-emerald-500/10 text-emerald-500' : 'bg-muted text-muted-foreground'
            }`}>
              {isActive ? 'Active' : 'Unsubscribed'}
            </span>
          </div>

          <div className="text-xs space-y-1.5">
            <div>
              <span className="text-muted-foreground">Premium features: </span>
              <span className="font-bold text-foreground">{isActive ? 'Unlocked' : 'Locked'}</span>
            </div>
            {renewalDate && (
              <div>
                <span className="text-muted-foreground">Next billing date: </span>
                <span className="font-bold text-foreground">{renewalDate}</span>
              </div>
            )}
          </div>

          {/* Cancel button */}
          {isActive && (
            <div className="flex items-center">
              <button
                disabled={loading}
                onClick={handleCancelSubscription}
                className="px-4 py-2 border border-red-500/30 text-red-500 hover:bg-red-500/10 font-bold rounded-xl text-xs transition"
              >
                Cancel Subscription
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Pricing Cards */}
      {!isActive && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto pt-6">
          {/* Monthly */}
          <div className="p-6 border border-border bg-card/30 rounded-2xl space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <span className="text-[10px] font-bold text-primary uppercase tracking-widest bg-primary/10 px-2.5 py-0.5 rounded-full block w-fit">
                Complete access
              </span>
              <h3 className="text-lg font-bold">Monthly Premium Plan</h3>
              <div className="flex items-baseline">
                <span className="text-3xl font-extrabold text-foreground">₹29</span>
                <span className="text-muted-foreground text-xs"> / month</span>
              </div>
              <ul className="space-y-2 text-xs text-muted-foreground pt-2">
                <li className="flex items-center space-x-2">
                  <Check className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                  <span>Unlimited Gemini resume screenings</span>
                </li>
                <li className="flex items-center space-x-2">
                  <Check className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                  <span>Unlimited HR mock evaluations</span>
                </li>
                <li className="flex items-center space-x-2">
                  <Check className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                  <span>All 9 company syllabus packages</span>
                </li>
              </ul>
            </div>

            <button
              disabled={loading}
              onClick={() => handleSubscribe('Monthly')}
              className="w-full bg-primary hover:bg-primary/95 text-primary-foreground font-bold py-2.5 rounded-xl text-xs transition flex items-center justify-center space-x-1.5"
            >
              {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <CreditCard className="w-3.5 h-3.5" />}
              <span>Subscribe Monthly</span>
            </button>
          </div>

          {/* Yearly */}
          <div className="p-6 border border-primary bg-card/30 rounded-2xl space-y-4 flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-[8px] font-extrabold uppercase px-2.5 py-1 rounded-bl-xl tracking-wider">
              Save 40%
            </div>
            
            <div className="space-y-3">
              <span className="text-[10px] font-bold text-primary uppercase tracking-widest bg-primary/10 px-2.5 py-0.5 rounded-full block w-fit">
                Best value
              </span>
              <h3 className="text-lg font-bold">Yearly Premium Plan</h3>
              <div className="flex items-baseline">
                <span className="text-3xl font-extrabold text-foreground">₹199</span>
                <span className="text-muted-foreground text-xs"> / year</span>
              </div>
              <ul className="space-y-2 text-xs text-muted-foreground pt-2">
                <li className="flex items-center space-x-2">
                  <Check className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                  <span>All monthly features included</span>
                </li>
                <li className="flex items-center space-x-2">
                  <Check className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                  <span>Best student budget matching rate</span>
                </li>
                <li className="flex items-center space-x-2">
                  <Check className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                  <span>Priority email support tickets</span>
                </li>
              </ul>
            </div>

            <button
              disabled={loading}
              onClick={() => handleSubscribe('Yearly')}
              className="w-full bg-primary hover:bg-primary/95 text-primary-foreground font-bold py-2.5 rounded-xl text-xs transition flex items-center justify-center space-x-1.5"
            >
              {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <CreditCard className="w-3.5 h-3.5" />}
              <span>Subscribe Yearly</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
