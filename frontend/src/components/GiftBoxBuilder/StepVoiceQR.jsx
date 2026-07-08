/**
 * StepVoiceQR.jsx — Step 6 (Voice Message QR)
 *
 * Allows users to paste an audio/voice note recording link (Google Drive / Soundcloud / WhatsApp audio URL).
 * Generates a dedicated Voice Note QR code card inside the gift box (+₹99).
 */

'use client';
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiMic, FiLink, FiCheck } from 'react-icons/fi';
import { useCart } from '../../context/CartContext';

const StepVoiceQR = () => {
  const { voiceMessage = { enabled: false, audioUrl: '', price: 0 }, dispatch } = useCart();

  const update = (payload) => dispatch({ type: 'SET_VOICE_MESSAGE', payload });

  return (
    <div className="glass-card p-6 md:p-8">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="text-white text-2xl font-bold font-display">Voice Message QR</h2>
          <p className="text-white/40 text-sm mt-1">Embed a personal voice recording · +₹99</p>
        </div>

        {/* Enable toggle */}
        <div className="flex items-center gap-3">
          <span className="text-white/50 text-sm">Enable</span>
          <button
            id="voice-toggle"
            onClick={() => update({ enabled: !voiceMessage.enabled })}
            className={`toggle ${voiceMessage.enabled ? 'bg-brand-500' : 'bg-white/10'}`}
          >
            <span className={`toggle-thumb ${voiceMessage.enabled ? 'translate-x-5' : 'translate-x-1'}`} />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {voiceMessage.enabled && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden space-y-6"
          >
            <div>
              <label htmlFor="voice-url-input" className="text-white/60 text-sm font-medium mb-2 flex items-center gap-2">
                <FiLink size={14} /> Voice Recording Link
              </label>
              <input
                id="voice-url-input"
                type="url"
                placeholder="Paste voice recording link here (Google Drive, Dropbox, iCloud audio...)"
                className="glass-input w-full p-3 rounded-xl text-sm"
                value={voiceMessage.audioUrl || ''}
                onChange={(e) => update({ audioUrl: e.target.value })}
              />
              <p className="text-white/30 text-xs mt-2 leading-relaxed">
                Tip: Record a voice note on your phone, upload to Google Drive or iCloud, set sharing to 'Anyone with link', and paste the link above!
              </p>
            </div>

            {/* QR preview box */}
            <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/[0.08] flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-purple-500/20 text-purple-400 flex items-center justify-center text-2xl shrink-0">
                  🎙️
                </div>
                <div>
                  <p className="text-white font-semibold text-sm">Printed Audio Card</p>
                  <p className="text-white/40 text-xs mt-0.5">
                    {voiceMessage.audioUrl ? '✓ Link linked cleanly for QR printing' : 'Awaiting recording link...'}
                  </p>
                </div>
              </div>
              {voiceMessage.audioUrl && (
                <div className="badge-green px-3 py-1 text-xs">
                  <FiCheck className="mr-1 inline" /> Ready
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {!voiceMessage.enabled && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center py-10 text-center">
          <div className="text-5xl mb-3 animate-float">🎙️</div>
          <p className="text-white/40 text-base">Toggle on to include a scannable Voice QR Note.</p>
          <p className="text-white/20 text-sm mt-1">Let them hear your voice when opening the box · +₹99</p>
        </motion.div>
      )}
    </div>
  );
};

export default StepVoiceQR;
