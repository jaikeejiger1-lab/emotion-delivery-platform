/**
 * MilestoneCard.jsx
 *
 * Displays a single upcoming milestone (birthday/anniversary/etc.)
 * with a visual countdown and the "One-Click Reorder" CTA.
 */

'use client';
import React from 'react';
import { motion } from 'framer-motion';
import { FiRefreshCw, FiCalendar, FiClock } from 'react-icons/fi';

// Relation → emoji map
const RELATION_EMOJI = {
  Mom: '🤱', Dad: '👨', Girlfriend: '💑', Boyfriend: '💑',
  Wife: '💍', Husband: '💍', Sister: '👧', Brother: '👦',
  Friend: '🤝', Colleague: '💼', Boss: '🧑‍💼', Child: '🧒',
  Grandparent: '👴', Other: '💝',
};

// Urgency colours based on days until
const getUrgencyStyle = (days) => {
  if (days <= 3)  return { bar: 'bg-red-500',    badge: 'bg-red-500/20 text-red-300',    text: 'text-red-400' };
  if (days <= 7)  return { bar: 'bg-amber-500',  badge: 'bg-amber-500/20 text-amber-300', text: 'text-amber-400' };
  if (days <= 14) return { bar: 'bg-yellow-400', badge: 'bg-yellow-500/20 text-yellow-300', text: 'text-yellow-400' };
  return          { bar: 'bg-green-500',  badge: 'bg-green-500/20 text-green-300',   text: 'text-green-400' };
};

const MilestoneCard = ({ milestone, onReorder, isReordering }) => {
  const { nickname, relation, label, date, daysUntil, budgetRange } = milestone;
  const urgency = getUrgencyStyle(daysUntil);
  const emoji = RELATION_EMOJI[relation] || '💝';

  const formattedDate = new Date(date).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'long',
  });

  return (
    <motion.div
      whileHover={{ y: -4, boxShadow: '0 20px 40px rgba(232,93,154,0.15)' }}
      transition={{ duration: 0.25 }}
      className="glass-card p-6 h-full flex flex-col group cursor-default
                 hover:border-brand-500/30 transition-colors duration-300"
    >
      {/* ── Top row ── */}
      <div className="flex items-start justify-between mb-5">
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-500/30 to-purple-500/30
                          flex items-center justify-center text-2xl select-none">
            {emoji}
          </div>
          <div>
            <p className="text-white font-semibold text-base leading-tight">{nickname}</p>
            <p className="text-white/40 text-xs mt-0.5">{relation}</p>
          </div>
        </div>

        {/* Countdown badge */}
        <div className={`px-3 py-1.5 rounded-xl text-xs font-bold ${urgency.badge}`}>
          {daysUntil === 0 ? '🎉 Today!' : `${daysUntil}d`}
        </div>
      </div>

      {/* ── Occasion ── */}
      <div className="flex items-center gap-2 mb-3">
        <FiCalendar className="text-white/30" size={13} />
        <span className="text-white/80 font-semibold text-sm">{label}</span>
        <span className="text-white/40 text-xs">• {formattedDate}</span>
      </div>

      {/* ── Progress bar (days urgency) ── */}
      <div className="relative h-1.5 bg-white/5 rounded-full mb-4 overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${Math.max(5, 100 - (daysUntil / 30) * 100)}%` }}
          transition={{ duration: 1, delay: 0.3, ease: 'easeOut' }}
          className={`h-full rounded-full ${urgency.bar}`}
        />
      </div>

      {/* ── Budget tag ── */}
      {budgetRange && (
        <div className="flex items-center gap-1.5 mb-5">
          <span className="text-white/30 text-xs">Budget:</span>
          <span className="text-gold-400 text-xs font-semibold">
            ₹{budgetRange.min.toLocaleString()} – ₹{budgetRange.max.toLocaleString()}
          </span>
        </div>
      )}

      {/* Spacer */}
      <div className="flex-1" />

      {/* ── One-Click Reorder CTA ── */}
      <motion.button
        id={`reorder-${milestone.milestoneId}`}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.97 }}
        onClick={onReorder}
        disabled={isReordering}
        className="w-full btn-primary py-2.5 text-sm disabled:opacity-60"
      >
        {isReordering ? (
          <>
            <FiRefreshCw className="animate-spin" size={15} />
            Finding perfect gift…
          </>
        ) : (
          <>
            🎁 One-Click Gift for {nickname}
          </>
        )}
      </motion.button>
    </motion.div>
  );
};

export default MilestoneCard;
