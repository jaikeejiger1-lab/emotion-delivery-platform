/**
 * StepHandwrittenLetter.jsx — Step 3
 *
 * Enables/disables the handwritten letter add-on.
 * User can type a personal message and pick a font style.
 * Displays a live preview of how the letter will look.
 */

'use client';
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiEdit3, FiType } from 'react-icons/fi';
import { useCart } from '../../context/CartContext';

const MAX_CHARS = 600;

const FONT_STYLES = [
  { id: 'cursive',    label: 'Cursive',    preview: 'font-cursive',    sample: 'With all my love…' },
  { id: 'print',      label: 'Print',      preview: 'font-sans',       sample: 'From the heart.' },
  { id: 'calligraphy',label: 'Calligraphy',preview: 'font-display italic', sample: 'Forever yours…' },
];

const StepHandwrittenLetter = () => {
  const { handwrittenLetter, dispatch } = useCart();

  const update = (payload) => dispatch({ type: 'SET_LETTER', payload });

  const charCount = handwrittenLetter.message?.length || 0;
  const charPercent = (charCount / MAX_CHARS) * 100;

  return (
    <div className="glass-card p-6 md:p-8">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="text-white text-2xl font-bold font-display">Handwritten Letter</h2>
          <p className="text-white/40 text-sm mt-1">Printed in real pen-like ink · +₹99</p>
        </div>

        {/* Enable toggle */}
        <div className="flex items-center gap-3">
          <span className="text-white/50 text-sm">Enable</span>
          <button
            id="letter-toggle"
            onClick={() => update({ enabled: !handwrittenLetter.enabled })}
            className={`toggle ${handwrittenLetter.enabled ? 'bg-brand-500' : 'bg-white/10'}`}
          >
            <span className={`toggle-thumb ${handwrittenLetter.enabled ? 'translate-x-5' : 'translate-x-1'}`} />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {handwrittenLetter.enabled && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            {/* Font style selector */}
            <div className="mb-5">
              <p className="text-white/60 text-sm font-medium mb-3 flex items-center gap-2">
                <FiType size={14} /> Choose Font Style
              </p>
              <div className="grid grid-cols-3 gap-3">
                {FONT_STYLES.map((fs) => (
                  <motion.button
                    key={fs.id}
                    id={`font-${fs.id}`}
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => update({ fontStyle: fs.id })}
                    className={`p-4 rounded-xl border-2 text-center transition-all duration-200 ${
                      handwrittenLetter.fontStyle === fs.id
                        ? 'border-brand-500 bg-brand-500/10'
                        : 'border-white/10 bg-white/[0.03] hover:border-white/20'
                    }`}
                  >
                    <p className={`text-white text-lg mb-1 ${fs.preview}`}>{fs.sample}</p>
                    <p className="text-white/50 text-xs">{fs.label}</p>
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Message input */}
            <div className="mb-5">
              <label className="text-white/60 text-sm font-medium mb-2 flex items-center gap-2 block">
                <FiEdit3 size={14} /> Your Message
              </label>
              <div className="relative">
                <textarea
                  id="letter-message"
                  rows={6}
                  maxLength={MAX_CHARS}
                  placeholder="Dear Mama,

Every day I am grateful for your endless love and the sacrifices you've made. This small gift is a token of how much you mean to me.

With all my love,
Your little one ❤️"
                  className="textarea-field text-sm leading-relaxed"
                  value={handwrittenLetter.message}
                  onChange={(e) => update({ message: e.target.value })}
                />

                {/* Char counter */}
                <div className="absolute bottom-3 right-3 flex items-center gap-2">
                  <div className="w-24 h-1 bg-white/10 rounded-full overflow-hidden">
                    <motion.div
                      animate={{ width: `${charPercent}%` }}
                      className={`h-full rounded-full transition-colors duration-300 ${
                        charPercent > 90 ? 'bg-red-400' : 'bg-brand-500'
                      }`}
                    />
                  </div>
                  <span className={`text-xs ${charPercent > 90 ? 'text-red-400' : 'text-white/30'}`}>
                    {charCount}/{MAX_CHARS}
                  </span>
                </div>
              </div>
            </div>

            {/* Live preview panel */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="p-6 rounded-2xl bg-amber-50 border border-amber-200/30 relative overflow-hidden"
            >
              {/* Paper texture overlay */}
              <div className="absolute inset-0 opacity-20"
                style={{
                  backgroundImage: 'repeating-linear-gradient(transparent, transparent 27px, rgba(0,0,0,0.06) 28px)',
                  backgroundSize: '100% 28px',
                }}
              />
              <div className="relative z-10">
                <p className="text-amber-800/50 text-xs uppercase tracking-widest mb-4 font-semibold">
                  ✉ Letter Preview
                </p>
                <p
                  className={`text-amber-900 text-sm leading-relaxed whitespace-pre-wrap ${
                    handwrittenLetter.fontStyle === 'cursive'
                      ? 'font-cursive text-base'
                      : handwrittenLetter.fontStyle === 'calligraphy'
                      ? 'font-display italic text-base'
                      : 'font-sans'
                  }`}
                >
                  {handwrittenLetter.message || 'Your heartfelt message will appear here…'}
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Disabled state placeholder */}
      {!handwrittenLetter.enabled && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center py-12 text-center"
        >
          <div className="text-6xl mb-4 animate-float">✍️</div>
          <p className="text-white/40 text-base">
            Toggle on to add a personal handwritten letter.
          </p>
          <p className="text-white/20 text-sm mt-1">Printed in real pen-like ink for just ₹99</p>
        </motion.div>
      )}
    </div>
  );
};

export default StepHandwrittenLetter;
