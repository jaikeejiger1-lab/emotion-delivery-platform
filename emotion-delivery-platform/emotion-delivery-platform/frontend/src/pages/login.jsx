/**
 * login.jsx — Authentication & Twilio SMS OTP Reset Portal
 */
import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter, useSearchParams } from 'next/navigation';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import {
  FiMail, FiLock, FiUser, FiPhone, FiCheck, FiArrowRight,
  FiShield, FiAlertCircle, FiKey, FiMessageSquare, FiArrowLeft,
  FiEye, FiEyeOff,
} from 'react-icons/fi';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, register, forgotPassword, verifyOtpReset, isAuthenticated, user } = useAuth();

  const [mode, setMode] = useState('login');
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '', lastName: '', email: '', phone: '',
    password: '', role: 'customer', otp: '', newPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (searchParams && searchParams.get('verified') === 'true') {
      toast.success('Email verified successfully! You can now log in. 🎉', { duration: 6000 });
    }
  }, [searchParams]);

  useEffect(() => {
    if (isAuthenticated && user) {
      if (['admin', 'superadmin'].includes(user.role)) {
        router.push('/admin');
      } else if (['delivery', 'delivery_partner', 'delivery_agent'].includes(user.role)) {
        router.push('/delivery');
      } else {
        router.push('/');
      }
    }
  }, [isAuthenticated, user, router]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === 'otp') {
      const numericVal = value.replace(/\D/g, '');
      if (numericVal.length <= 6) setFormData((prev) => ({ ...prev, otp: numericVal }));
      setErrorMsg('');
      return;
    }
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrorMsg('');
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    if (!formData.email || !formData.password) {
      setErrorMsg('Please enter both email and password.');
      return;
    }
    setLoading(true);
    setErrorMsg('');
    try {
      await login(formData.email, formData.password);
    } catch (err) {
      setErrorMsg(err.response?.data?.message || err.message || 'Login failed. Please verify your email and password.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.password) {
      setErrorMsg('Please fill in all required fields.');
      return;
    }
    if (formData.password.length < 8) {
      setErrorMsg('Password must be at least 8 characters long.');
      return;
    }
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await register({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone || undefined,
        password: formData.password,
        role: formData.role,
      });
      if (res.success) {
        toast.success('Account created! You are now logged in. 🎉');
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPasswordSubmit = async (e) => {
    e.preventDefault();
    if (!formData.phone) {
      setErrorMsg('Please enter your registered phone number.');
      return;
    }
    setLoading(true);
    setErrorMsg('');
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'https://emotion-delivery-platform.onrender.com/api';
      const res = await fetch(`${baseUrl}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: formData.phone }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to send Twilio OTP SMS.');
      toast.success('6-Digit OTP sent via Twilio SMS!', { icon: '📱' });
      setMode('reset-otp');
    } catch (err) {
      setErrorMsg(err.message || 'Failed to send Twilio OTP SMS.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPasswordSubmit = async (e) => {
    e.preventDefault();
    if (!formData.otp || !formData.newPassword) {
      setErrorMsg('Please enter the 6-digit OTP code and your new password.');
      return;
    }
    if (formData.newPassword.length < 8) {
      setErrorMsg('Password must be at least 8 characters long.');
      return;
    }
    setLoading(true);
    setErrorMsg('');
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'https://emotion-delivery-platform.onrender.com/api';
      const res = await fetch(`${baseUrl}/auth/verify-otp-reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: formData.phone, otp: formData.otp, newPassword: formData.newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to verify OTP or reset password.');
      toast.success('Password reset successfully! Please log in with your new password.');
      setMode('login');
      setFormData((prev) => ({ ...prev, password: '', otp: '', newPassword: '' }));
    } catch (err) {
      setErrorMsg(err.message || 'Failed to verify OTP or reset password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 text-gray-900 dark:bg-[#0D0D1A] dark:text-white selection:bg-brand-500 selection:text-white transition-colors duration-300">
      <Head>
        <title>Sign In / Sign Up — Emotion Delivery Platform</title>
      </Head>

      <Navbar />

      <main className="flex-grow flex items-center justify-center py-16 px-4 relative overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-brand-500/15 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-purple-600/15 blur-[120px] pointer-events-none" />

        <div className="max-w-md w-full bg-white/90 dark:bg-[#14142B]/80 backdrop-blur-2xl border border-gray-200 dark:border-white/15 p-8 sm:p-10 rounded-3xl shadow-2xl relative z-10 transition-all duration-300">

          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-brand-500 to-purple-600 flex items-center justify-center text-2xl mx-auto mb-4 shadow-lg shadow-brand-500/30">
              {mode === 'login' && '👋'}
              {mode === 'register' && '🎁'}
              {mode === 'forgot' && '📱'}
              {mode === 'reset-otp' && '🔐'}
            </div>

            <h1 className="font-display text-2xl sm:text-3xl font-extrabold bg-gradient-to-r from-gray-900 dark:from-white via-pink-500 dark:via-pink-200 to-pink-600 dark:to-pink-400 bg-clip-text text-transparent">
              {mode === 'login' && 'Welcome Back'}
              {mode === 'register' && 'Create Your Account'}
              {mode === 'forgot' && 'Forgot Password?'}
              {mode === 'reset-otp' && 'Enter Twilio OTP'}
            </h1>

            <p className="text-xs sm:text-sm text-gray-500 dark:text-white/60 mt-2 leading-relaxed">
              {mode === 'login' && 'Sign in to access your custom gift builds and live GPS tracking.'}
              {mode === 'register' && 'Create your account to get started — it only takes a minute.'}
              {mode === 'forgot' && 'Enter your registered phone number to receive a secure 6-digit SMS code.'}
              {mode === 'reset-otp' && `We sent a 6-digit verification code to ${formData.phone || 'your phone'}.`}
            </p>
          </div>

          {errorMsg && (
            <div className="mb-6 p-4 rounded-2xl bg-red-500/15 border border-red-500/30 text-red-500 dark:text-red-300 flex items-start gap-3">
              <FiAlertCircle className="shrink-0 mt-0.5 text-base text-red-400" />
              <span className="text-xs leading-relaxed font-semibold">{errorMsg}</span>
            </div>
          )}

          {mode === 'login' && (
            <form onSubmit={handleLoginSubmit} className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold tracking-wider text-gray-500 dark:text-white/60 uppercase block">Email Address</label>
                <div className="relative">
                  <FiMail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-white/40 text-sm" />
                  <input
                    type="email" name="email" required value={formData.email}
                    onChange={handleInputChange} placeholder="name@example.com"
                    className="w-full bg-black/[0.03] dark:bg-white/[0.04] border border-gray-200 dark:border-white/15 rounded-xl py-3 pl-10 pr-4 text-xs text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-white/30 focus:border-brand-500 focus:bg-white dark:focus:bg-white/[0.08] transition-all outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-[11px] font-bold tracking-wider text-gray-500 dark:text-white/60 uppercase block">Password</label>
                  <button type="button" onClick={() => { setMode('forgot'); setErrorMsg(''); }}
                    className="text-xs text-brand-400 font-bold hover:text-brand-300 hover:underline transition-colors flex items-center gap-1">
                    <FiKey size={12} /> Forgot Password?
                  </button>
                </div>
                <div className="relative">
                  <FiLock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-white/40 text-sm" />
                  <input
                    type={showPassword ? 'text' : 'password'} name="password" required
                    value={formData.password} onChange={handleInputChange} placeholder="••••••••"
                    className="w-full bg-black/[0.03] dark:bg-white/[0.04] border border-gray-200 dark:border-white/15 rounded-xl py-3 pl-10 pr-10 text-xs text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-white/30 focus:border-brand-500 focus:bg-white dark:focus:bg-white/[0.08] transition-all outline-none"
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-white/40 hover:text-gray-700 dark:hover:text-white transition-colors">
                    {showPassword ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                  </button>
                </div>
              </div>

              <button type="submit" disabled={loading}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-brand-500 to-purple-600 text-white font-extrabold text-xs tracking-wide uppercase shadow-lg shadow-brand-500/30 hover:scale-[1.01] hover:shadow-brand-500/40 transition-all flex items-center justify-center gap-2 mt-2 disabled:opacity-50">
                {loading ? 'Signing In...' : <>Sign In <FiArrowRight /></>}
              </button>

              <div className="pt-4 border-t border-gray-200 dark:border-white/10 mt-6">
                <button type="button" onClick={() => { setMode('forgot'); setErrorMsg(''); }}
                  className="w-full py-3 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 text-purple-600 dark:text-purple-300 font-bold text-xs flex items-center justify-center gap-2 transition-all group shadow-sm">
                  <FiMessageSquare className="group-hover:scale-110 transition-transform" />
                  <span>Reset Password via Twilio SMS OTP</span>
                </button>
              </div>

              <div className="text-center pt-4 mt-2">
                <p className="text-xs text-gray-600 dark:text-white/60">
                  Don't have an account?{' '}
                  <button type="button" onClick={() => { setMode('register'); setErrorMsg(''); }}
                    className="font-bold text-brand-500 hover:text-brand-400 transition-colors">
                    Sign Up
                  </button>
                </p>
              </div>
            </form>
          )}

          {mode === 'register' && (
            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold tracking-wider text-gray-500 dark:text-white/60 uppercase block">First Name</label>
                  <div className="relative">
                    <FiUser className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-white/40" size={13} />
                    <input type="text" name="firstName" required value={formData.firstName}
                      onChange={handleInputChange} placeholder="John"
                      className="w-full bg-black/[0.03] dark:bg-white/[0.04] border border-gray-200 dark:border-white/15 rounded-xl py-2.5 pl-9 pr-3 text-xs text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-white/30 focus:border-brand-500 focus:bg-white dark:focus:bg-white/[0.08] transition-all outline-none" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold tracking-wider text-gray-500 dark:text-white/60 uppercase block">Last Name</label>
                  <input type="text" name="lastName" required value={formData.lastName}
                    onChange={handleInputChange} placeholder="Doe"
                    className="w-full bg-black/[0.03] dark:bg-white/[0.04] border border-gray-200 dark:border-white/15 rounded-xl py-2.5 px-3 text-xs text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-white/30 focus:border-brand-500 focus:bg-white dark:focus:bg-white/[0.08] transition-all outline-none" />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold tracking-wider text-gray-500 dark:text-white/60 uppercase block">Email Address</label>
                <div className="relative">
                  <FiMail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-white/40" />
                  <input type="email" name="email" required value={formData.email}
                    onChange={handleInputChange} placeholder="name@domain.com"
                    className="w-full bg-black/[0.03] dark:bg-white/[0.04] border border-gray-200 dark:border-white/15 rounded-xl py-2.5 pl-10 pr-4 text-xs text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-white/30 focus:border-brand-500 focus:bg-white dark:focus:bg-white/[0.08] transition-all outline-none" />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold tracking-wider text-gray-500 dark:text-white/60 uppercase block">Phone Number</label>
                <div className="relative">
                  <FiPhone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-white/40" />
                  <input type="tel" name="phone" required value={formData.phone}
                    onChange={handleInputChange} placeholder="+919876543210"
                    className="w-full bg-black/[0.03] dark:bg-white/[0.04] border border-gray-200 dark:border-white/15 rounded-xl py-2.5 pl-10 pr-4 text-xs text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-white/30 focus:border-brand-500 focus:bg-white dark:focus:bg-white/[0.08] transition-all outline-none" />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold tracking-wider text-gray-500 dark:text-white/60 uppercase block">Password</label>
                <div className="relative">
                  <FiLock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-white/40" />
                  <input type={showPassword ? 'text' : 'password'} name="password" required
                    value={formData.password} onChange={handleInputChange} placeholder="Min 8 characters"
                    className="w-full bg-black/[0.03] dark:bg-white/[0.04] border border-gray-200 dark:border-white/15 rounded-xl py-2.5 pl-10 pr-10 text-xs text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-white/30 focus:border-brand-500 focus:bg-white dark:focus:bg-white/[0.08] transition-all outline-none" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-white/40 hover:text-gray-700 dark:hover:text-white transition-colors">
                    {showPassword ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                  </button>
                </div>
              </div>

              <button type="submit" disabled={loading}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-brand-500 to-purple-600 text-white font-extrabold text-xs tracking-wide uppercase shadow-lg shadow-brand-500/30 hover:scale-[1.01] hover:shadow-brand-500/40 transition-all flex items-center justify-center gap-2 mt-4 disabled:opacity-50">
                {loading ? 'Creating Account...' : <>Sign Up <FiArrowRight /></>}
              </button>

              <div className="text-center pt-2">
                <button type="button" onClick={() => { setMode('login'); setErrorMsg(''); }}
                  className="text-xs text-gray-500 dark:text-white/50 hover:text-gray-800 dark:hover:text-white transition-colors flex items-center justify-center gap-1 mx-auto">
                  <FiArrowLeft /> Back to Sign In
                </button>
              </div>
            </form>
          )}

          {mode === 'forgot' && (
            <form onSubmit={handleForgotPasswordSubmit} className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold tracking-wider text-gray-500 dark:text-white/60 uppercase block">Phone Number</label>
                <div className="relative">
                  <FiPhone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-white/40 text-sm" />
                  <input type="tel" name="phone" required value={formData.phone}
                    onChange={handleInputChange} placeholder="+919876543210"
                    className="w-full bg-black/[0.03] dark:bg-white/[0.04] border border-gray-200 dark:border-white/15 rounded-xl py-3 pl-10 pr-4 text-xs text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-white/30 focus:border-brand-500 focus:bg-white dark:focus:bg-white/[0.08] transition-all outline-none" />
                </div>
              </div>

              <button type="submit" disabled={loading}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-brand-500 to-purple-600 text-white font-extrabold text-xs tracking-wide uppercase shadow-lg shadow-brand-500/30 hover:scale-[1.01] hover:shadow-brand-500/40 transition-all flex items-center justify-center gap-2 mt-2 disabled:opacity-50">
                {loading ? 'Sending OTP...' : <>Send SMS Code <FiArrowRight /></>}
              </button>

              <div className="text-center pt-4 border-t border-gray-200 dark:border-white/10 mt-6">
                <button type="button" onClick={() => { setMode('login'); setErrorMsg(''); }}
                  className="text-xs text-gray-500 dark:text-white/50 hover:text-gray-800 dark:hover:text-white transition-colors flex items-center justify-center gap-1 mx-auto">
                  <FiArrowLeft /> Back to Sign In
                </button>
              </div>
            </form>
          )}

          {mode === 'reset-otp' && (
            <form onSubmit={handleResetPasswordSubmit} className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold tracking-wider text-gray-500 dark:text-white/60 uppercase block">6-Digit SMS Code</label>
                <div className="relative">
                  <FiKey className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-white/40 text-sm" />
                  <input type="text" name="otp" required value={formData.otp}
                    onChange={handleInputChange} placeholder="123456"
                    className="w-full bg-black/[0.03] dark:bg-white/[0.04] border border-gray-200 dark:border-white/15 rounded-xl py-3 pl-10 pr-4 text-xs text-gray-900 dark:text-white tracking-widest placeholder-gray-400 dark:placeholder-white/30 focus:border-brand-500 focus:bg-white dark:focus:bg-white/[0.08] transition-all outline-none" />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold tracking-wider text-gray-500 dark:text-white/60 uppercase block">New Password</label>
                <div className="relative">
                  <FiLock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-white/40 text-sm" />
                  <input type={showNewPassword ? 'text' : 'password'} name="newPassword" required
                    value={formData.newPassword} onChange={handleInputChange} placeholder="Min 8 characters"
                    className="w-full bg-black/[0.03] dark:bg-white/[0.04] border border-gray-200 dark:border-white/15 rounded-xl py-3 pl-10 pr-10 text-xs text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-white/30 focus:border-brand-500 focus:bg-white dark:focus:bg-white/[0.08] transition-all outline-none" />
                  <button type="button" onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-white/40 hover:text-gray-700 dark:hover:text-white transition-colors">
                    {showNewPassword ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                  </button>
                </div>
              </div>

              <button type="submit" disabled={loading}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-brand-500 to-purple-600 text-white font-extrabold text-xs tracking-wide uppercase shadow-lg shadow-brand-500/30 hover:scale-[1.01] hover:shadow-brand-500/40 transition-all flex items-center justify-center gap-2 mt-2 disabled:opacity-50">
                {loading ? 'Resetting Password...' : <>Confirm New Password <FiCheck /></>}
              </button>

              <div className="text-center pt-4 border-t border-gray-200 dark:border-white/10 mt-6">
                <button type="button" onClick={() => { setMode('login'); setErrorMsg(''); }}
                  className="text-xs text-gray-500 dark:text-white/50 hover:text-gray-800 dark:hover:text-white transition-colors flex items-center justify-center gap-1 mx-auto">
                  <FiArrowLeft /> Cancel and Return to Login
                </button>
              </div>
            </form>
          )}

        </div>
      </main>

      <Footer />
    </div>
  );
}