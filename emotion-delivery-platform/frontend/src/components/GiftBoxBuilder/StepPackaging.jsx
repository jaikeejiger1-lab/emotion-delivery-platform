/**
 * StepPackaging.jsx — Step 2
 *
 * Lets users select packaging tier and customise box colour and ribbon.
 */

'use client';
import React from 'react';
import { motion } from 'framer-motion';
import { FiCheck } from 'react-icons/fi';
import { useCart } from '../../context/CartContext';

const PACKAGING_TIERS = [
  {
    id: 'standard',
    name: 'Standard',
    emoji: '📦',
    price: 0,
    description: 'Clean kraft paper box with branded sticker',
    features: ['Kraft paper box', 'Branded seal sticker', 'Tissue paper lining'],
    color: 'from-zinc-500/20 to-zinc-600/10',
    borderColor: 'border-zinc-500/30',
    activeBorder: 'border-zinc-400',
  },
  {
    id: 'premium',
    name: 'Premium',
    emoji: '🎀',
    price: 199,
    description: 'Rigid gift box with satin ribbon and shredded filler',
    features: ['Rigid gift box', 'Satin ribbon', 'Gold tissue paper', 'Shredded kraft filler'],
    color: 'from-brand-500/20 to-purple-500/10',
    borderColor: 'border-brand-500/30',
    activeBorder: 'border-brand-500',
    badge: 'Most Popular',
  },
  {
    id: 'luxury',
    name: 'Luxury',
    emoji: '✨',
    price: 499,
    description: 'Velvet-finish magnetic closure box with gold foiling',
    features: ['Velvet-finish magnetic box', 'Gold foil print', 'Silk ribbon', 'Wax seal', 'Champagne filler'],
    color: 'from-gold-500/20 to-amber-500/10',
    borderColor: 'border-gold-500/30',
    activeBorder: 'border-gold-500',
    badge: '✦ Exclusive',
  },
];

const BOX_COLORS = [
  { id: 'kraft',   label: 'Kraft',   hex: '#C19A6B' },
  { id: 'black',   label: 'Midnight',hex: '#1A1A2E' },
  { id: 'blush',   label: 'Blush',   hex: '#F4C2C2' },
  { id: 'white',   label: 'Pearl',   hex: '#F8F8F8' },
  { id: 'sage',    label: 'Sage',    hex: '#87AE8C' },
  { id: 'navy',    label: 'Navy',    hex: '#2C3E7A' },
];

const StepPackaging = () => {
  const { packaging, dispatch } = useCart();

  const selectTier = (tier) => {
    dispatch({
      type: 'SET_PACKAGING',
      payload: {
        tier: tier.id,
        packagingPrice: tier.price,
      },
    });
  };

  return (
    <div className="glass-card p-6 md:p-8">
      <div className="mb-7">
        <h2 className="text-white text-2xl font-bold font-display">Dress the Box</h2>
        <p className="text-white/40 text-sm mt-1">First impressions are everything</p>
      </div>

      {/* ── Packaging tiers ── */}
      <div className="grid md:grid-cols-3 gap-4 mb-8">
        {PACKAGING_TIERS.map((tier) => {
          const isActive = packaging.tier === tier.id;
          return (
            <motion.button
              key={tier.id}
              id={`packaging-${tier.id}`}
              whileHover={{ y: -3 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => selectTier(tier)}
              className={`relative text-left p-5 rounded-2xl border-2 transition-all duration-300
                          bg-gradient-to-br ${tier.color}
                          ${isActive ? tier.activeBorder + ' shadow-[0_0_24px_rgba(232,93,154,0.2)]' : tier.borderColor}
                          `}
            >
              {/* Badge */}
              {tier.badge && (
                <div className="absolute top-3 right-3 text-[10px] font-bold px-2 py-0.5 rounded-full
                               bg-brand-500/30 text-brand-300 border border-brand-500/40">
                  {tier.badge}
                </div>
              )}

              {/* Active check */}
              {isActive && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute top-3 left-3 w-5 h-5 rounded-full bg-brand-500 flex items-center justify-center"
                >
                  <FiCheck size={12} className="text-white" />
                </motion.div>
              )}

              <div className="text-3xl mb-3 mt-3">{tier.emoji}</div>
              <h3 className="text-white font-bold text-lg mb-1">{tier.name}</h3>
              <p className="text-white/50 text-xs mb-3 leading-relaxed">{tier.description}</p>

              <ul className="space-y-1 mb-4">
                {tier.features.map((f) => (
                  <li key={f} className="flex items-center gap-1.5 text-white/60 text-xs">
                    <FiCheck size={10} className="text-green-400 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>

              <p className={`font-bold text-base ${tier.price === 0 ? 'text-green-400' : 'text-white'}`}>
                {tier.price === 0 ? 'Free' : `+₹${tier.price}`}
              </p>
            </motion.button>
          );
        })}
      </div>

      {/* ── Box colour selector ── */}
      <div className="mb-6">
        <p className="text-white/60 text-sm font-medium mb-3">Box Colour</p>
        <div className="flex flex-wrap gap-3">
          {BOX_COLORS.map((c) => (
            <motion.button
              key={c.id}
              id={`color-${c.id}`}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => dispatch({ type: 'SET_PACKAGING', payload: { color: c.id } })}
              title={c.label}
              className={`relative w-9 h-9 rounded-full border-3 transition-all duration-200 ${
                packaging.color === c.id ? 'border-white scale-110' : 'border-transparent'
              }`}
              style={{ backgroundColor: c.hex }}
            >
              {packaging.color === c.id && (
                <div className="absolute inset-0 rounded-full border-2 border-white/40 scale-125" />
              )}
            </motion.button>
          ))}
        </div>
        <p className="text-white/30 text-xs mt-2">
          Selected: {BOX_COLORS.find((c) => c.id === packaging.color)?.label}
        </p>
      </div>

      {/* ── Ribbon toggle ── */}
      <div className="flex items-center justify-between p-4 rounded-xl bg-white/[0.04] border border-white/[0.08]">
        <div>
          <p className="text-white font-medium text-sm">Add Satin Ribbon 🎀</p>
          <p className="text-white/40 text-xs">Complete the look with a beautiful bow</p>
        </div>
        <button
          id="ribbon-toggle"
          onClick={() => dispatch({ type: 'SET_PACKAGING', payload: { ribbon: !packaging.ribbon } })}
          className={`toggle ${packaging.ribbon ? 'bg-brand-500' : 'bg-white/10'}`}
        >
          <span
            className={`toggle-thumb ${packaging.ribbon ? 'translate-x-5' : 'translate-x-1'}`}
          />
        </button>
      </div>
    </div>
  );
};

export default StepPackaging;
