/**
 * GiftBoxBuilder.jsx
 *
 * Four-step multi-step form for building a personalised gift box:
 *  Step 1 — Select products (from AI recommendations)
 *  Step 2 — Choose packaging (standard / premium / luxury)
 *  Step 3 — Handwritten letter message
 *  Step 4 — Upload video for QR code generation
 *
 * All state is managed through CartContext.
 */

'use client';
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiArrowRight, FiArrowLeft, FiCheck } from 'react-icons/fi';
import { useCart } from '../../context/CartContext';
import { useRouter } from 'next/navigation';
import StepProductSelect from './StepProductSelect';
import StepPackaging from './StepPackaging';
import StepHandwrittenLetter from './StepHandwrittenLetter';
import StepVideoQR from './StepVideoQR';

// ── Step definitions ──────────────────────────────────────────────
const STEPS = [
  { id: 1, label: 'Products',  icon: '🛍',  description: 'Pick your gifts' },
  { id: 2, label: 'Packaging', icon: '📦',  description: 'Dress the box' },
  { id: 3, label: 'Letter',    icon: '✍️', description: 'Write from the heart' },
  { id: 4, label: 'Video QR',  icon: '🎥',  description: 'Record a memory' },
];

// ── Step indicator ────────────────────────────────────────────────
const StepIndicator = ({ steps, currentStep }) => (
  <div className="flex items-center justify-center gap-0 mb-12">
    {steps.map((step, idx) => (
      <React.Fragment key={step.id}>
        {/* Step dot */}
        <div className="flex flex-col items-center">
          <motion.div
            animate={
              currentStep > step.id
                ? { scale: [1, 1.2, 1] }
                : {}
            }
            className={`step-dot ${
              currentStep === step.id
                ? 'step-dot-active'
                : currentStep > step.id
                ? 'step-dot-completed'
                : 'step-dot-inactive'
            }`}
          >
            {currentStep > step.id ? (
              <FiCheck size={16} />
            ) : (
              <span>{step.icon}</span>
            )}
          </motion.div>
          <p className={`text-xs mt-1.5 font-medium transition-colors duration-300 ${
            currentStep >= step.id ? 'text-white' : 'text-white/30'
          }`}>
            {step.label}
          </p>
        </div>

        {/* Connector line */}
        {idx < steps.length - 1 && (
          <div className="w-16 md:w-24 h-px mx-1 mb-5 relative overflow-hidden bg-white/10">
            <motion.div
              initial={{ width: '0%' }}
              animate={{ width: currentStep > step.id ? '100%' : '0%' }}
              transition={{ duration: 0.4, ease: 'easeInOut' }}
              className="h-full bg-gradient-to-r from-brand-500 to-purple-500"
            />
          </div>
        )}
      </React.Fragment>
    ))}
  </div>
);

// ── Slide animation variants ──────────────────────────────────────
const slideVariants = {
  enter: (direction) => ({
    x: direction > 0 ? 80 : -80,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
    transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] },
  },
  exit: (direction) => ({
    x: direction > 0 ? -80 : 80,
    opacity: 0,
    transition: { duration: 0.3 },
  }),
};

// ── Main component ────────────────────────────────────────────────
const GiftBoxBuilder = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [direction, setDirection] = useState(1);
  const { items, pricing } = useCart();
  const router = useRouter();

  const goNext = () => {
    if (currentStep < 4) {
      setDirection(1);
      setCurrentStep((s) => s + 1);
    }
  };

  const goPrev = () => {
    if (currentStep > 1) {
      setDirection(-1);
      setCurrentStep((s) => s - 1);
    }
  };

  const handleProceedToCheckout = () => {
    router.push('/checkout');
  };

  const canProceed = () => {
    if (currentStep === 1) return items.length > 0;
    return true; // Other steps are optional
  };

  const stepComponents = {
    1: <StepProductSelect onNext={goNext} />,
    2: <StepPackaging />,
    3: <StepHandwrittenLetter />,
    4: <StepVideoQR />,
  };

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="max-w-4xl mx-auto">

        {/* ── Page header ── */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass-card border-brand-500/20 mb-4">
            <span className="text-lg">🎁</span>
            <span className="text-white/60 text-sm font-medium">Gift Box Builder</span>
          </div>
          <h1 className="section-title">Craft Something Magical</h1>
          <p className="section-subtitle">Personalise every detail of your gift</p>
        </motion.div>

        {/* ── Step indicator ── */}
        <StepIndicator steps={STEPS} currentStep={currentStep} />

        {/* ── Step content (animated slide) ── */}
        <div className="relative overflow-hidden min-h-[460px]">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={currentStep}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
            >
              {stepComponents[currentStep]}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* ── Navigation footer ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-8 flex items-center justify-between glass-card p-5"
        >
          {/* Back */}
          <button
            onClick={goPrev}
            disabled={currentStep === 1}
            className="btn-ghost disabled:opacity-30"
            id="step-back-btn"
          >
            <FiArrowLeft size={18} />
            Back
          </button>

          {/* Cart summary */}
          <div className="text-center">
            <p className="text-white/40 text-xs">
              {items.length} {items.length === 1 ? 'item' : 'items'} · Step {currentStep} of 4
            </p>
            <p className="text-white font-bold text-lg">
              ₹{pricing.subtotal.toLocaleString('en-IN')}
            </p>
          </div>

          {/* Next / Checkout */}
          {currentStep < 4 ? (
            <motion.button
              whileHover={{ scale: canProceed() ? 1.03 : 1 }}
              whileTap={{ scale: canProceed() ? 0.97 : 1 }}
              onClick={goNext}
              disabled={!canProceed()}
              className="btn-primary disabled:opacity-40"
              id="step-next-btn"
            >
              {currentStep === 1 && items.length === 0 ? 'Select a product' : 'Continue'}
              <FiArrowRight size={18} />
            </motion.button>
          ) : (
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={handleProceedToCheckout}
              disabled={items.length === 0}
              className="btn-primary disabled:opacity-40"
              id="proceed-checkout-btn"
            >
              Go to Checkout 🛒
              <FiArrowRight size={18} />
            </motion.button>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default GiftBoxBuilder;
