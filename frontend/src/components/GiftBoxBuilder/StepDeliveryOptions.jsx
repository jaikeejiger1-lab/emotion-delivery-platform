/**
 * StepDeliveryOptions.jsx — Step 8 (Special Delivery & Privacy Options)
 *
 * Allows users to toggle:
 *  - Midnight Delivery (+₹299)
 *  - Anonymous Gift Mode (Free)
 *  - Secret Surprise Timer Reveal Mode (Free)
 */

'use client';
import React from 'react';
import { motion } from 'framer-motion';
import { FiMoon, FiShield, FiClock } from 'react-icons/fi';
import { useCart } from '../../context/CartContext';

const StepDeliveryOptions = () => {
  const {
    midnightDelivery = false,
    anonymousGift = false,
    secretSurpriseMode = false,
    dispatch,
  } = useCart();

  return (
    <div className="glass-card p-6 md:p-8">
      <div className="mb-6">
        <h2 className="text-white text-2xl font-bold font-display">Special Delivery Options</h2>
        <p className="text-white/40 text-sm mt-1">Customize timing and sender privacy</p>
      </div>

      <div className="space-y-4">
        {/* Midnight Delivery Option */}
        <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/[0.08] flex items-center justify-between hover:border-white/20 transition-colors">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-xl shrink-0 mt-0.5">
              <FiMoon />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-white font-semibold text-base">Midnight Special Delivery 🌙</h4>
                <span className="text-xs font-bold text-indigo-300 bg-indigo-500/30 px-2 py-0.5 rounded-full">+₹299</span>
              </div>
              <p className="text-white/50 text-xs mt-1 leading-relaxed">
                We will dispatch and deliver exact at 12:00 AM on your chosen date. Perfect for birthdays & anniversaries!
              </p>
            </div>
          </div>
          <button
            id="midnight-toggle"
            onClick={() => dispatch({ type: 'TOGGLE_MIDNIGHT' })}
            className={`toggle shrink-0 ${midnightDelivery ? 'bg-indigo-500' : 'bg-white/10'}`}
          >
            <span className={`toggle-thumb ${midnightDelivery ? 'translate-x-5' : 'translate-x-1'}`} />
          </button>
        </div>

        {/* Anonymous Gift Mode Option */}
        <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/[0.08] flex items-center justify-between hover:border-white/20 transition-colors">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xl shrink-0 mt-0.5">
              <FiShield />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-white font-semibold text-base">Anonymous Gift Mode 👤</h4>
                <span className="text-xs font-bold text-emerald-300 bg-emerald-500/30 px-2 py-0.5 rounded-full">Free</span>
              </div>
              <p className="text-white/50 text-xs mt-1 leading-relaxed">
                Hides your name, address, and phone number from all shipping labels, outer boxes, and invoices. Absolute privacy guaranteed.
              </p>
            </div>
          </div>
          <button
            id="anonymous-toggle"
            onClick={() => dispatch({ type: 'TOGGLE_ANONYMOUS' })}
            className={`toggle shrink-0 ${anonymousGift ? 'bg-emerald-500' : 'bg-white/10'}`}
          >
            <span className={`toggle-thumb ${anonymousGift ? 'translate-x-5' : 'translate-x-1'}`} />
          </button>
        </div>

        {/* Surprise Timer Option */}
        <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/[0.08] flex items-center justify-between hover:border-white/20 transition-colors">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center text-xl shrink-0 mt-0.5">
              <FiClock />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-white font-semibold text-base">Secret Surprise Timer Reveal ⏰</h4>
                <span className="text-xs font-bold text-amber-300 bg-amber-500/30 px-2 py-0.5 rounded-full">Free</span>
              </div>
              <p className="text-white/50 text-xs mt-1 leading-relaxed">
                The gift box comes sealed with an SMS/Email countdown timer sent to the recipient. They can only reveal the digital tracking & message when the timer hits zero!
              </p>
            </div>
          </div>
          <button
            id="timer-toggle"
            onClick={() => dispatch({ type: 'TOGGLE_SECRET_SURPRISE' })}
            className={`toggle shrink-0 ${secretSurpriseMode ? 'bg-amber-500' : 'bg-white/10'}`}
          >
            <span className={`toggle-thumb ${secretSurpriseMode ? 'translate-x-5' : 'translate-x-1'}`} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default StepDeliveryOptions;
