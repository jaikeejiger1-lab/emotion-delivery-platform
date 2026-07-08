/**
 * StepGreetingCard.jsx — Step 3 (Greeting Card + AI Generator)
 *
 * Allows users to enable a greeting card (+₹49), select an AI message category,
 * generate instant AI greetings or write custom text.
 */

'use client';
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiEdit3, FiStar, FiCheck } from 'react-icons/fi';
import { useCart } from '../../context/CartContext';
import axiosClient from '../../api/axiosClient';
import toast from 'react-hot-toast';

const AI_CATEGORIES = [
  { id: 'birthday', name: 'Birthday', emoji: '🎂' },
  { id: 'anniversary', name: 'Anniversary', emoji: '🥂' },
  { id: 'apology', name: 'Apology', emoji: '🥺' },
  { id: 'romantic', name: 'Romantic', emoji: '🌹' },
  { id: 'congratulate', name: 'Congratulate', emoji: '🏆' },
  { id: 'thankyou', name: 'Thank You', emoji: '🙏' },
];

const StepGreetingCard = () => {
  const { greetingCard = { enabled: false, message: '', aiCategory: 'birthday', price: 0 }, dispatch } = useCart();
  const [generating, setGenerating] = useState(false);

  const update = (payload) => dispatch({ type: 'SET_GREETING_CARD', payload });

  const handleGenerateAI = async () => {
    setGenerating(true);
    try {
      const res = await axiosClient.post('/recommendations/greeting', {
        category: greetingCard.aiCategory || 'birthday',
        relation: 'Loved One',
        occasion: greetingCard.aiCategory || 'Special Occasion',
      });
      if (res.data?.greeting) {
        update({ enabled: true, message: res.data.greeting });
        toast.success('✨ AI Greeting generated!', { duration: 2500 });
      } else {
        throw new Error('No greeting returned');
      }
    } catch (err) {
      toast.error('Failed to generate greeting. Try writing your own!');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="glass-card p-6 md:p-8">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="text-white text-2xl font-bold font-display">Greeting Card Add-on</h2>
          <p className="text-white/40 text-sm mt-1">Premium cardstock with foil printing · +₹49</p>
        </div>

        {/* Enable toggle */}
        <div className="flex items-center gap-3">
          <span className="text-white/50 text-sm">Enable</span>
          <button
            id="gcard-toggle"
            onClick={() => update({ enabled: !greetingCard.enabled })}
            className={`toggle ${greetingCard.enabled ? 'bg-brand-500' : 'bg-white/10'}`}
          >
            <span className={`toggle-thumb ${greetingCard.enabled ? 'translate-x-5' : 'translate-x-1'}`} />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {greetingCard.enabled && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden space-y-6"
          >
            {/* AI Greeting Generator Section */}
            <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/[0.08]">
              <div className="flex items-center justify-between mb-3">
                <span className="text-white/80 font-semibold text-sm flex items-center gap-2">
                  <FiStar className="text-brand-400" /> AI Greeting Generator
                </span>
                <span className="text-xs text-brand-300 font-medium bg-brand-500/20 px-2.5 py-0.5 rounded-full">
                  Aurora AI Assistant
                </span>
              </div>
              <p className="text-white/40 text-xs mb-4">
                Select an occasion below and let AI write a touching message for you:
              </p>

              <div className="flex flex-wrap gap-2 mb-4">
                {AI_CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => update({ aiCategory: cat.id })}
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all flex items-center gap-1.5 ${
                      greetingCard.aiCategory === cat.id
                        ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/30'
                        : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <span>{cat.emoji}</span> {cat.name}
                  </button>
                ))}
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleGenerateAI}
                disabled={generating}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-brand-500 to-purple-500 text-white font-semibold text-sm shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {generating ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                      className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                    />
                    Crafting greeting...
                  </>
                ) : (
                  <>
                    <FiStar /> Generate Message ✨
                  </>
                )}
              </motion.button>
            </div>

            {/* Custom Message Textarea */}
            <div>
              <label htmlFor="gcard-message" className="text-white/60 text-sm font-medium mb-2 flex items-center gap-2">
                <FiEdit3 size={14} /> Card Message
              </label>
              <textarea
                id="gcard-message"
                rows={4}
                maxLength={300}
                placeholder="Write or paste your custom greeting card message here..."
                className="textarea-field text-sm leading-relaxed"
                value={greetingCard.message}
                onChange={(e) => update({ message: e.target.value })}
              />
              <div className="flex justify-between items-center mt-2 text-xs text-white/30">
                <span>Will be printed cleanly on the front inside of your card.</span>
                <span>{(greetingCard.message || '').length}/300</span>
              </div>
            </div>

            {/* Live Card Preview */}
            <div className="p-6 rounded-2xl bg-gradient-to-br from-pink-500/10 via-purple-500/10 to-transparent border border-pink-500/20 text-center">
              <span className="text-xs uppercase tracking-widest text-pink-300/80 font-bold block mb-3">
                💌 Greeting Card Preview
              </span>
              <p className="text-white text-base font-display italic leading-relaxed px-4">
                {greetingCard.message || 'Your card message will appear right here...'}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {!greetingCard.enabled && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center py-10 text-center">
          <div className="text-5xl mb-3 animate-float">💌</div>
          <p className="text-white/40 text-base">Toggle on to add a custom printed greeting card.</p>
          <p className="text-white/20 text-sm mt-1">Includes instant AI greeting generation · Just ₹49</p>
        </motion.div>
      )}
    </div>
  );
};

export default StepGreetingCard;
