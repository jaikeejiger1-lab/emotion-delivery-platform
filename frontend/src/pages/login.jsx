/**
 * login.jsx — High-Fidelity Glassmorphic Authentication & Twilio SMS OTP Reset Portal
 *
 * This is the Next.js React component for handling User Sign In, Registration,
 * and Twilio SMS OTP Password Recovery.
 */
import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter, useSearchParams } from 'next/navigation';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import {
  FiMail,
  FiLock,
  FiUser,
  FiPhone,
  FiCheck,
  FiArrowRight,
  FiShield,
  FiAlertCircle,
  FiKey,
  FiMessageSquare,
  FiRefreshCw,
  FiArrowLeft,
  FiEye,
  FiEyeOff,
} from 'react-icons/fi';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, register, forgotPassword, verifyOtpReset, isAuthenticated, user } = useAuth();

  // Navigation modes: 'login' | 'register' | 'forgot' | 'reset-otp'
  const [mode, setMode] = useState('login');
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    role: 'customer',
    otp: '',
    newPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Handle verified query parameter redirect from email link
  useEffect(() => {
    if (searchParams && searchParams.get('verified') === 'true') {
      toast.success('Email verified successfully! You can now log in. 🎉', { duration: 6000 });
    }
  }, [searchParams]);

  // Redirect if already authenticated
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
      if (numericVal.length <= 6) {
        setFormData((prev) => ({ ...prev, otp: numericVal }));
      }
      setErrorMsg('');
      return;
    }
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrorMsg('');
  };

  // 1. Handle Login
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

  // 2. Handle Registration (Disabled by Admin)
  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.password) {
      setErrorMsg('Please fill in all required fields.');
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
        setMode('login');
        setFormData((prev) => ({ ...prev, password: '' }));
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || err.message || 'Public registration is disabled.');
    } finally {
      setLoading(false);
    }
  };

  // 3. Handle Twilio OTP Request (Forgot Password)
  const handleForgotPasswordSubmit = async (e) => {
    e.preventDefault();
    if (!formData.phone) {
      setErrorMsg('Please enter your registered phone number.');
      return;
    }
    setLoading(true);
    setErrorMsg('');
    try {
      // ✅ FIXED: Clean Base URL directly mapped to Render
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

  // 4. Handle Twilio OTP Verification & Password Reset
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
      // ✅ FIXED: Clean Base URL directly mapped to Render
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
        <title>Sign In / Reset Password — Emotion Delivery Platform</title>
      </Head>

      <Navbar />

      <main className="flex-grow flex items-center justify-center py-16 px-4 relative overflow-hidden">
        {/* Ambient Glow Backgrounds */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-brand-500/15 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-purple-600/15 blur-[120px] pointer-events-none" />

        <div className="max-w-md w-full bg-white/90 dark:bg-[#14142B]/80 backdrop-blur-2xl border border-gray-200 dark:border-white/15 p-8 sm:p-10 rounded-3xl shadow-2xl relative z-10 transition-all duration-300">
          
          {/* Header Section */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-brand-500 to-purple-600 flex items-center justify-center text-2xl mx-auto mb-4 shadow-lg shadow-brand-500/30">
              {mode === 'login' && '👋'}
              {mode === 'register' && '🎁'}
              {mode === 'forgot' && '📱'}
              {mode === 'reset-otp' && '🔐'}
            </div>

            <h1 className="font-display text-2xl sm:text-3xl font-extrabold bg-gradient-to-r from-white via-pink-200 to-pink-400 bg-clip-text text-transparent">
              {mode === 'login' && 'Welcome Back'}
              {mode === 'register' && 'Create Your Account'}
              {mode === 'forgot' && 'Forgot Password?'}
              {mode === 'reset-otp' && 'Enter Twilio OTP'}
            </h1>

            <p className="text-xs sm:text-sm text-gray-500 dark:text-white/60 mt-2 leading-relaxed">
              {mode === 'login' && 'Sign in to access your custom gift builds and live GPS tracking.'}
              {mode === 'register' && 'Join India’s premier emotion delivery and memory curation platform.'}
              {mode === 'forgot' && 'Enter your registered phone number to receive a secure 6-digit SMS code.'}
              {mode === 'reset-otp' && `We sent a 6-digit verification code to ${formData.phone || 'your phone'}.`}
            </p>
          </div>

          {/* Verification Alert Banner */}
          {mode === 'login' && (
            <div className="mb-6 p-4 rounded-2xl bg-brand-500/10 border border-brand-500/30 flex items-start gap-3">
              <FiShield className="text-brand-400 shrink-0 mt-0.5 text-base" />
              <p className="text-[11px] leading-relaxed text-gray-700 dark:text-white/80">
                <strong>Email Verification Required:</strong> For your security, unverified accounts cannot sign in. Please verify via the link sent to your inbox.
              </p>
            </div>
          )}

          {/* Error Message Box */}
          {errorMsg && (
            <div className="mb-6 p-4 rounded-2xl bg-red-500/15 border border-red-500/30 text-red-300 flex items-start gap-3 animate-shake">
              <FiAlertCircle className="shrink-0 mt-0.5 text-base text-red-400" />
              <span className="text-xs leading-relaxed font-semibold">{errorMsg}</span>
            </div>
          )}

          {/* ────────────────── 1. LOGIN MODE ────────────────── */}
          {mode === 'login' && (
            <form onSubmit={handleLoginSubmit} className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold tracking-wider text-gray-500 dark:text-white/60 uppercase block">Email Address</label>
                <div className="relative">
                  <FiMail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40 text-sm" />
                  <input
                    type="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="name@example.com"
                    className="w-full bg-white/[0.04] border border-white/15 rounded-xl py-3 pl-10 pr-4 text-xs text-white placeholder-white/30 focus:border-brand-500 focus:bg-white/[0.08] transition-all outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-[11px] font-bold tracking-wider text-gray-500 dark:text-white/60 uppercase block">Password</label>
                  <button
                    type="button"
                    onClick={() => { setMode('forgot'); setErrorMsg(''); }}
                    className="text-xs text-brand-400 font-bold hover:text-brand-300 hover:underline transition-colors flex items-center gap-1"
                  >
                    <FiKey size={12} /> Forgot Password?
                  </button>
                </div>
                <div className="relative">
                  <FiLock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40 text-sm" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    required
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="••••••••"
                    className="w-full bg-white/[0.04] border border-white/15 rounded-xl py-3 pl-10 pr-10 text-xs text-white placeholder-white/30 focus:border-brand-500 focus:bg-white/[0.08] transition-all outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors"
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-brand-500 to-purple-600 text-white font-extrabold text-xs tracking-wide uppercase shadow-lg shadow-brand-500/30 hover:scale-[1.01] hover:shadow-brand-500/40 transition-all flex items-center justify-center gap-2 mt-2 disabled:opacity-50"
              >
                {loading ? 'Signing In...' : <>Sign In <FiArrowRight /></>}
              </button>

              <div className="pt-4 border-t border-white/10 mt-6">
                <button
                  type="button"
                  onClick={() => { setMode('forgot'); setErrorMsg(''); }}
                  className="w-full py-3 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 text-purple-300 font-bold text-xs flex items-center justify-center gap-2 transition-all group shadow-sm"
                >
                  <FiMessageSquare className="group-hover:scale-110 transition-transform" />
                  <span>Reset Password via Twilio SMS OTP</span>
                </button>
              </div>

              <div className="text-center pt-4 mt-2">
                <p className="text-xs text-gray-600 dark:text-white/60">
                  Don&apos;t have an account?{' '}
                  <button
                    type="button"
                    onClick={() => { setMode('register'); setErrorMsg(''); }}
                    className="font-bold text-brand-500 hover:text-brand-400 transition-colors"
                  >
                    Sign Up
                  </button>
                </p>
              </div>
            </form>
          )}

          {/* ────────────────── 2. REGISTER MODE ────────────────── */}
          {mode === 'register' && (
            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold tracking-wider text-white/60 uppercase block">First Name</label>
                  <div className="relative">
                    <FiUser className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" size={13} />
                    <input
                      type="text"
                      name="firstName"
                      required
                      value={formData.firstName}
                      onChange={handleInputChange}
                      placeholder="John"
                      className="w-full bg-white/[0.04] border border-white/15 rounded-xl py-2.5 pl-9 pr-3 text-xs text-white placeholder-white/30 focus:border-brand-500 focus:bg-white/[0.08] transition-all outline-none"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold tracking-wider text-white/60 uppercase block">Last Name</label>
                  <input
                    type="text"
                    name="lastName"
                    required
                    value={formData.lastName}
                    onChange={handleInputChange}
                    placeholder="Doe"
                    className="w-full bg-white/[0.04] border border-white/15 rounded-xl py-2.5 px-3 text-xs text-white placeholder-white/30 focus:border-brand-500 focus:bg-white/[0.08] transition-all outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold tracking-wider text-white/60 uppercase block">Email Address</label>
                <div className="relative">
                  <FiMail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
                  <input
                    type="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="name@domain.com"
                    className="w-full bg-white/[0.04] border border-white/15 rounded-xl py-2.5 pl-10 pr-4 text-xs text-white placeholder-white/30 focus:border-brand-500 focus:bg-white/[0.08] transition-all outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold tracking-wider text-white/60 uppercase block">Phone Number (For OTP)</label>
                <div className="relative">
                  <FiPhone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
                  <input
                    type="tel"
                    name="phone"
                    required
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="+919876543210"
                    className="w-full bg-white/[0.04] border border-white/15 rounded-xl py-2.5 pl-10 pr-4 text-xs text-white placeholder-white/30 focus:border-brand-500 focus:bg-white/[0.08] transition-all outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold tracking-wider text-white/60 uppercase block">Password</label>
                <div className="relative">
                  <FiLock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    required
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="Min 8 characters"
                    className="w-full bg-white/[0.04] border border-white/15 rounded-xl py-2.5 pl-10 pr-10 text-xs text-white placeholder-white/30 focus:border-brand-500 focus:bg-white/[0.08] transition-all outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors"
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold tracking-wider text-white/60 uppercase block">Account Type</label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleInputChange}
                  className="w-full bg-white/[0.04] border border-white/15 rounded-xl py-2.5 px-3.5 text-xs text-white focus:border-brand-500 focus:bg-white/[0.08] transition-all outline-none appearance-none"
                >
                  <option className="bg-[#14142B]" value="customer">Client (Send Gifts & Memories)</option>
                  <option className="bg-[#14142B]" value="delivery">Delivery Agent (Courier Services)</option>
                </select>
              </div>

              {/* ✅ FIXED: Completed the button and missing closing tags */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-brand-500 to-purple-600 text-white font-extrabold text-xs tracking-wide uppercase shadow-lg shadow-brand-500/30 hover:scale-[1.01] hover:shadow-brand-