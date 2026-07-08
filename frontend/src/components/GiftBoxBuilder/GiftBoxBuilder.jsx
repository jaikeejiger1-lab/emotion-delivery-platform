/**
 * GiftBoxBuilder.jsx
 *
 * Full-featured interactive 2-column Gift Box Builder:
 *  Left Column: Accordion/Tabs for all 8 customization sections:
 *    1. Products (Pick your gifts)
 *    2. Packaging & Box Design (Tier, Color, Ribbon)
 *    3. Greeting Card (+₹49, with AI Generator)
 *    4. Handwritten Letter (+₹99, pen-plotter preview)
 *    5. Video QR Message (+₹149, URL or upload)
 *    6. Voice Message QR (+₹99, audio link)
 *    7. Photo Print Insert (+₹79, AI DALL-E or custom upload)
 *    8. Special Delivery Options (Midnight +₹299, Anonymous, Surprise Timer)
 *
 *  Right Column (Sticky):
 *    - Live Colored Gift Box Visualizer with badges
 *    - Itemized Fee Breakdown & Order Summary
 *    - Proceed to Checkout button
 */

'use client';
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiArrowRight, FiCheck, FiChevronRight, FiChevronDown, FiTrash2 } from 'react-icons/fi';
import { useCart } from '../../context/CartContext';
import { useRouter } from 'next/router';

import StepProductSelect from './StepProductSelect';
import StepPackaging from './StepPackaging';
import StepGreetingCard from './StepGreetingCard';
import StepHandwrittenLetter from './StepHandwrittenLetter';
import StepVideoQR from './StepVideoQR';
import StepVoiceQR from './StepVoiceQR';
import StepPhotoPrint from './StepPhotoPrint';
import StepDeliveryOptions from './StepDeliveryOptions';

const BUILDER_SECTIONS = [
  { id: 1, key: 'products',   label: 'Select Gift Items',       icon: '🛍️', desc: 'Pick AI-curated items for your box' },
  { id: 2, key: 'packaging',  label: 'Packaging & Box Design',  icon: '📦', desc: 'Box tier, accent color & satin ribbon' },
  { id: 3, key: 'greeting',   label: 'Greeting Card Add-on',    icon: '💌', desc: '+₹49 · AI message generator included' },
  { id: 4, key: 'letter',     label: 'Handwritten Letter',      icon: '✍️', desc: '+₹99 · Real pen-like ink & custom fonts' },
  { id: 5, key: 'video',      label: 'Video Message QR',        icon: '🎥', desc: '+₹149 · Embed a personal video memory' },
  { id: 6, key: 'voice',      label: 'Voice Message QR',        icon: '🎙️', desc: '+₹99 · Scannable voice note recording' },
  { id: 7, key: 'photo',      label: 'Photo Print Insert',      icon: '📸', desc: '+₹79 · AI illustrated or uploaded photo' },
  { id: 8, key: 'delivery',   label: 'Special Delivery & Privacy', icon: '🌙', desc: 'Midnight delivery, anonymous mode & timer' },
];

const BOX_COLOR_HEX = {
  kraft: '#C19A6B',
  black: '#1A1A2E',
  blush: '#F4C2C2',
  white: '#F8F8F8',
  sage:  '#87AE8C',
  navy:  '#2C3E7A',
};

const GiftBoxBuilder = () => {
  const [activeTab, setActiveTab] = useState(1);
  const {
    items,
    packaging = { tier: 'standard', color: 'kraft', ribbon: false, packagingPrice: 0 },
    greetingCard = { enabled: false, price: 0 },
    handwrittenLetter = { enabled: false, price: 0 },
    videoMessage = { enabled: false, price: 0 },
    voiceMessage = { enabled: false, price: 0 },
    photoPrint = { enabled: false, price: 0 },
    midnightDelivery = false,
    anonymousGift = false,
    secretSurpriseMode = false,
    pricing = { subtotal: 0, packagingFee: 0, greetingCardFee: 0, letterFee: 0, videoFee: 0, voiceFee: 0, photoFee: 0, midnightFee: 0, deliveryFee: 99, tax: 0, total: 0 },
    dispatch,
  } = useCart();
  const router = useRouter();

  const handleProceedToCheckout = () => {
    router.push('/checkout');
  };

  const getSectionStatus = (id) => {
    switch (id) {
      case 1: return items.length > 0 ? `${items.length} items selected` : 'Required';
      case 2: return `${packaging.tier.toUpperCase()} · ${packaging.color}`;
      case 3: return greetingCard.enabled ? 'Enabled (+₹49)' : 'Optional';
      case 4: return handwrittenLetter.enabled ? 'Enabled (+₹99)' : 'Optional';
      case 5: return videoMessage.enabled ? 'Enabled (+₹149)' : 'Optional';
      case 6: return voiceMessage.enabled ? 'Enabled (+₹99)' : 'Optional';
      case 7: return photoPrint.enabled ? 'Enabled (+₹79)' : 'Optional';
      case 8: return midnightDelivery ? 'Midnight (+₹299)' : 'Standard';
      default: return '';
    }
  };

  const isSectionActive = (id) => {
    switch (id) {
      case 1: return items.length > 0;
      case 2: return true;
      case 3: return greetingCard.enabled;
      case 4: return handwrittenLetter.enabled;
      case 5: return videoMessage.enabled;
      case 6: return voiceMessage.enabled;
      case 7: return photoPrint.enabled;
      case 8: return midnightDelivery || anonymousGift || secretSurpriseMode;
      default: return false;
    }
  };

  const currentBoxHex = BOX_COLOR_HEX[packaging.color] || '#C19A6B';

  return (
    <div className="min-h-screen py-10 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Page Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass-card border-brand-500/20 mb-3">
            <span className="text-lg">🎁</span>
            <span className="text-white/60 text-xs sm:text-sm font-medium">Aurora Platform</span>
          </div>
          <h1 className="section-title text-3xl sm:text-4xl font-extrabold font-display">
            Craft Your Custom Gift Box
          </h1>
          <p className="section-subtitle text-sm sm:text-base text-white/50 max-w-xl mx-auto mt-1">
            Build every layer from item selection to custom prints, QR video memories, and box aesthetics.
          </p>
        </div>

        {/* 2-Column Grid Layout */}
        <div className="grid lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT COLUMN: Accordion & Step Navigation (8 cols) */}
          <div className="lg:col-span-8 space-y-4">
            
            {/* Section Tab/Accordion Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
              {BUILDER_SECTIONS.map((sec) => {
                const isActiveTab = activeTab === sec.id;
                const activeFeature = isSectionActive(sec.id);
                return (
                  <button
                    key={sec.id}
                    onClick={() => setActiveTab(sec.id)}
                    className={`p-3 rounded-xl text-left border transition-all duration-200 relative flex flex-col justify-between ${
                      isActiveTab
                        ? 'bg-brand-500/15 border-brand-500 shadow-md shadow-brand-500/10'
                        : activeFeature
                        ? 'bg-white/[0.04] border-white/20 hover:border-white/40'
                        : 'bg-white/[0.02] border-white/8 hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full mb-1">
                      <span className="text-lg">{sec.icon}</span>
                      {activeFeature && (
                        <span className="w-2 h-2 rounded-full bg-brand-400 shrink-0 shadow-sm" />
                      )}
                    </div>
                    <div>
                      <p className={`text-xs font-bold truncate ${isActiveTab ? 'text-brand-300' : 'text-white'}`}>
                        {sec.id}. {sec.label}
                      </p>
                      <p className="text-[10px] text-white/40 truncate mt-0.5">
                        {getSectionStatus(sec.id)}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Active Step Content Container */}
            <div className="min-h-[500px]">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.3 }}
                >
                  {activeTab === 1 && <StepProductSelect />}
                  {activeTab === 2 && <StepPackaging />}
                  {activeTab === 3 && <StepGreetingCard />}
                  {activeTab === 4 && <StepHandwrittenLetter />}
                  {activeTab === 5 && <StepVideoQR />}
                  {activeTab === 6 && <StepVoiceQR />}
                  {activeTab === 7 && <StepPhotoPrint />}
                  {activeTab === 8 && <StepDeliveryOptions />}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Bottom Wizard Navigation Buttons */}
            <div className="flex items-center justify-between glass-card p-4 rounded-2xl">
              <button
                onClick={() => setActiveTab((prev) => Math.max(1, prev - 1))}
                disabled={activeTab === 1}
                className="btn-ghost disabled:opacity-30 text-sm px-4 py-2"
              >
                ← Previous Step
              </button>
              <span className="text-white/40 text-xs font-medium">
                Step {activeTab} of {BUILDER_SECTIONS.length}: {BUILDER_SECTIONS[activeTab - 1]?.label}
              </span>
              {activeTab < BUILDER_SECTIONS.length ? (
                <button
                  onClick={() => setActiveTab((prev) => Math.min(BUILDER_SECTIONS.length, prev + 1))}
                  className="btn-primary text-sm px-5 py-2"
                >
                  Next Section <FiChevronRight className="inline ml-1" />
                </button>
              ) : (
                <button
                  onClick={handleProceedToCheckout}
                  disabled={items.length === 0}
                  className="btn-primary text-sm px-6 py-2 disabled:opacity-40"
                >
                  Confirm & Checkout 🛒
                </button>
              )}
            </div>
          </div>

          {/* RIGHT COLUMN: Sticky Gift Box Preview & Order Summary (4 cols) */}
          <div className="lg:col-span-4 lg:sticky lg:top-24 space-y-4">
            
            {/* Live Gift Box Visualizer Box */}
            <div className="glass-card p-6 rounded-2xl">
              <h3 className="text-white font-bold text-lg font-display mb-4 flex items-center justify-between">
                <span>Gift Box Preview</span>
                <span className="text-xs font-normal text-white/40">Live Visualizer</span>
              </h3>

              {/* Box Graphic Visualizer */}
              <div className="relative h-44 rounded-2xl border border-white/10 bg-white/[0.02] flex items-center justify-center p-4 overflow-hidden mb-5">
                <div
                  className="w-32 h-24 rounded-2xl relative transition-all duration-500 shadow-[0_20px_50px_rgba(0,0,0,0.6)] flex items-center justify-center"
                  style={{
                    background: `linear-gradient(135deg, ${currentBoxHex}, ${currentBoxHex}77)`,
                    borderColor: `${currentBoxHex}`,
                    borderWidth: '3px',
                  }}
                >
                  {/* Ribbon Graphic */}
                  {packaging.ribbon && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-full h-1 bg-white/40 absolute" />
                      <div className="h-full w-1 bg-white/40 absolute" />
                      <div className="w-7 h-7 rounded-full border-2 border-white/60 bg-white/20 flex items-center justify-center text-xs shadow-md">
                        🎀
                      </div>
                    </div>
                  )}
                </div>

                {/* Active Feature Badges */}
                <div className="absolute top-3 right-3 flex flex-wrap gap-1.5 max-w-[150px] justify-end">
                  {greetingCard.enabled && (
                    <span className="text-[10px] px-2 py-0.5 rounded bg-pink-500/20 text-pink-300 border border-pink-500/30 font-medium">Card</span>
                  )}
                  {handwrittenLetter.enabled && (
                    <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-medium">Letter</span>
                  )}
                  {videoMessage.enabled && (
                    <span className="text-[10px] px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30 font-medium">Video QR</span>
                  )}
                  {voiceMessage.enabled && (
                    <span className="text-[10px] px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 font-medium">Voice QR</span>
                  )}
                  {photoPrint.enabled && (
                    <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-medium">Photo</span>
                  )}
                  {midnightDelivery && (
                    <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-medium">Midnight</span>
                  )}
                  {anonymousGift && (
                    <span className="text-[10px] px-2 py-0.5 rounded bg-teal-500/20 text-teal-300 border border-teal-500/30 font-medium">Anon</span>
                  )}
                  {secretSurpriseMode && (
                    <span className="text-[10px] px-2 py-0.5 rounded bg-orange-500/20 text-orange-300 border border-orange-500/30 font-medium">Timer</span>
                  )}
                </div>
              </div>

              {/* Selected Items Cart List inside Preview */}
              <div className="mb-4">
                <div className="flex items-center justify-between text-xs text-white/50 mb-2 font-semibold uppercase tracking-wider">
                  <span>Selected Gifts ({items.length})</span>
                  {items.length > 0 && (
                    <button
                      onClick={() => dispatch({ type: 'CLEAR_CART' })}
                      className="text-red-400 hover:text-red-300 flex items-center gap-1"
                    >
                      <FiTrash2 /> Clear
                    </button>
                  )}
                </div>
                {items.length === 0 ? (
                  <p className="text-xs text-white/30 text-center py-4 border border-dashed border-white/10 rounded-xl">
                    No gifts selected yet. Click 'Select Gift Items' above!
                  </p>
                ) : (
                  <div className="max-h-40 overflow-y-auto space-y-2 pr-1 scrollbar-thin">
                    {items.map((item) => (
                      <div key={item.productId} className="flex justify-between items-center text-xs bg-white/[0.03] p-2 rounded-lg border border-white/5">
                        <span className="text-white/80 font-medium truncate max-w-[160px]">
                          🎁 {item.name}
                        </span>
                        <span className="text-white/50 shrink-0">
                          {item.quantity} × ₹{item.price.toLocaleString('en-IN')}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Order Summary & Fee Breakdown Card */}
            <div className="glass-card p-6 rounded-2xl">
              <h3 className="text-white font-bold text-lg font-display mb-4">
                Order Summary
              </h3>

              <div className="space-y-2.5 text-xs sm:text-sm border-b border-white/10 pb-4 mb-4">
                <div className="flex justify-between text-white/70">
                  <span>Gift Items ({items.length})</span>
                  <span className="font-medium">₹{pricing.subtotal.toLocaleString('en-IN')}</span>
                </div>
                {pricing.packagingFee > 0 && (
                  <div className="flex justify-between text-white/70">
                    <span>Packaging ({packaging.tier})</span>
                    <span>+₹{pricing.packagingFee}</span>
                  </div>
                )}
                {pricing.greetingCardFee > 0 && (
                  <div className="flex justify-between text-pink-300">
                    <span>Greeting Card Add-on</span>
                    <span>+₹{pricing.greetingCardFee}</span>
                  </div>
                )}
                {pricing.letterFee > 0 && (
                  <div className="flex justify-between text-amber-300">
                    <span>Handwritten Letter</span>
                    <span>+₹{pricing.letterFee}</span>
                  </div>
                )}
                {pricing.videoFee > 0 && (
                  <div className="flex justify-between text-blue-300">
                    <span>Video Message QR</span>
                    <span>+₹{pricing.videoFee}</span>
                  </div>
                )}
                {pricing.voiceFee > 0 && (
                  <div className="flex justify-between text-purple-300">
                    <span>Voice Message QR</span>
                    <span>+₹{pricing.voiceFee}</span>
                  </div>
                )}
                {pricing.photoFee > 0 && (
                  <div className="flex justify-between text-emerald-300">
                    <span>Photo Print Insert</span>
                    <span>+₹{pricing.photoFee}</span>
                  </div>
                )}
                {pricing.midnightFee > 0 && (
                  <div className="flex justify-between text-indigo-300">
                    <span>Midnight Delivery</span>
                    <span>+₹{pricing.midnightFee}</span>
                  </div>
                )}
                <div className="flex justify-between text-white/50 text-xs">
                  <span>Standard Delivery Fee</span>
                  <span>+₹{pricing.deliveryFee}</span>
                </div>
                <div className="flex justify-between text-white/50 text-xs">
                  <span>Est. GST (18%)</span>
                  <span>+₹{pricing.tax.toLocaleString('en-IN')}</span>
                </div>
              </div>

              <div className="flex justify-between items-baseline font-bold text-lg mb-5">
                <span className="text-white">Estimated Total</span>
                <span className="text-brand-400 text-xl sm:text-2xl">
                  ₹{pricing.total.toLocaleString('en-IN')}
                </span>
              </div>

              <button
                onClick={handleProceedToCheckout}
                disabled={items.length === 0}
                className="btn-primary w-full py-3.5 rounded-xl font-bold text-sm sm:text-base flex items-center justify-center gap-2 disabled:opacity-40 shadow-lg shadow-brand-500/20"
              >
                <span>Proceed to Checkout</span>
                <FiArrowRight />
              </button>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
};

export default GiftBoxBuilder;
