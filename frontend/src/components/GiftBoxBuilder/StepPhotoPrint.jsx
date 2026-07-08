/**
 * StepPhotoPrint.jsx — Step 7 (Photo Print Insert)
 *
 * Allows users to add a high-gloss printed Polaroid/4x6 photo inside the box (+₹79).
 * Features an AI Photo Generator calling POST /api/media/generate-image (or mock fallback)
 * plus custom file upload option.
 */

'use client';
import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiImage, FiUpload, FiStar, FiCheck, FiX } from 'react-icons/fi';
import { useCart } from '../../context/CartContext';
import axiosClient from '../../api/axiosClient';
import toast from 'react-hot-toast';

const StepPhotoPrint = () => {
  const { photoPrint = { enabled: false, imageUrl: '', prompt: '', price: 0 }, dispatch } = useCart();
  const [generating, setGenerating] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const update = (payload) => dispatch({ type: 'SET_PHOTO_PRINT', payload });

  const handleGenerateAI = async () => {
    if (!photoPrint.prompt || !photoPrint.prompt.trim()) {
      toast.error('Please enter a description for AI generation!');
      return;
    }
    setGenerating(true);
    try {
      const res = await axiosClient.post('/media/generate-image', {
        prompt: photoPrint.prompt,
      });
      if (res.data?.imageUrl) {
        update({ enabled: true, imageUrl: res.data.imageUrl });
        toast.success(res.data.generated ? '✨ AI Photo generated via DALL-E!' : '✨ AI Photo generated!', { duration: 3000 });
      } else {
        throw new Error('No image returned');
      }
    } catch (err) {
      toast.error('Could not generate AI photo. Try uploading one instead!');
    } finally {
      setGenerating(false);
    }
  };

  const handleFileUpload = (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file (JPG, PNG, WEBP)');
      return;
    }
    setUploading(true);
    // Convert to local object URL for instant preview & simulation
    const localUrl = URL.createObjectURL(file);
    setTimeout(() => {
      update({ enabled: true, imageUrl: localUrl });
      setUploading(false);
      toast.success('Photo uploaded for printing! 📸');
    }, 600);
  };

  return (
    <div className="glass-card p-6 md:p-8">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="text-white text-2xl font-bold font-display">Photo Print Insert</h2>
          <p className="text-white/40 text-sm mt-1">High-gloss 4x6 photo keepsake · +₹79</p>
        </div>

        {/* Enable toggle */}
        <div className="flex items-center gap-3">
          <span className="text-white/50 text-sm">Enable</span>
          <button
            id="photo-toggle"
            onClick={() => update({ enabled: !photoPrint.enabled })}
            className={`toggle ${photoPrint.enabled ? 'bg-brand-500' : 'bg-white/10'}`}
          >
            <span className={`toggle-thumb ${photoPrint.enabled ? 'translate-x-5' : 'translate-x-1'}`} />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {photoPrint.enabled && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden space-y-6"
          >
            {/* Options grid: AI vs Upload */}
            <div className="grid md:grid-cols-2 gap-4">
              {/* AI Photo Generator Box */}
              <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/[0.08] flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 text-brand-400 font-semibold text-sm mb-2">
                    <FiStar /> AI Photo Generator
                  </div>
                  <p className="text-white/40 text-xs mb-3">
                    Describe a scene or aesthetic, and our AI will illustrate a custom art print:
                  </p>
                  <input
                    type="text"
                    placeholder="e.g. A romantic sunset over Paris Eiffel Tower in watercolor..."
                    className="glass-input w-full p-2.5 rounded-xl text-xs mb-3"
                    value={photoPrint.prompt || ''}
                    onChange={(e) => update({ prompt: e.target.value })}
                  />
                </div>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleGenerateAI}
                  disabled={generating}
                  className="w-full py-2 rounded-xl bg-brand-500/20 border border-brand-500/40 text-brand-300 font-semibold text-xs hover:bg-brand-500 hover:text-white transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  {generating ? 'Illustrating...' : '✨ Generate AI Photo'}
                </motion.button>
              </div>

              {/* Custom Image Upload Box */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="p-5 rounded-2xl bg-white/[0.03] border border-dashed border-white/15 hover:border-white/30 cursor-pointer flex flex-col items-center justify-center text-center transition-colors group"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleFileUpload(e.target.files[0])}
                />
                <div className="w-12 h-12 rounded-2xl bg-white/5 group-hover:bg-brand-500/20 flex items-center justify-center mb-2 text-xl text-white/60 group-hover:text-brand-400 transition-colors">
                  <FiUpload />
                </div>
                <p className="text-white font-medium text-sm">Upload Custom Photo</p>
                <p className="text-white/40 text-xs mt-1">JPG, PNG, WEBP from your device</p>
              </div>
            </div>

            {/* Photo Preview Card */}
            {photoPrint.imageUrl && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-5 rounded-2xl bg-white/[0.04] border border-white/10 relative flex flex-col sm:flex-row items-center gap-5"
              >
                <div className="w-36 h-36 sm:w-44 sm:h-44 rounded-xl overflow-hidden bg-black/40 border border-white/20 shadow-xl shrink-0 relative">
                  <img
                    src={photoPrint.imageUrl}
                    alt="Selected gift print"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 text-center sm:text-left">
                  <div className="badge-green inline-flex mb-2">
                    <FiCheck className="mr-1" /> Ready for High-Gloss Print
                  </div>
                  <h4 className="text-white font-semibold text-sm mb-1">Custom Photo Keepsake</h4>
                  <p className="text-white/50 text-xs leading-relaxed mb-3">
                    We will print this image on premium 300 GSM photo paper and nest it safely on top of your gift items.
                  </p>
                  <button
                    onClick={() => update({ imageUrl: '' })}
                    className="text-red-400 hover:text-red-300 text-xs flex items-center gap-1 mx-auto sm:mx-0"
                  >
                    <FiX size={14} /> Remove / Change photo
                  </button>
                </div>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {!photoPrint.enabled && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center py-10 text-center">
          <div className="text-5xl mb-3 animate-float">📸</div>
          <p className="text-white/40 text-base">Toggle on to include a printed photo inside the box.</p>
          <p className="text-white/20 text-sm mt-1">Generate AI artwork or upload a cherished memory · +₹79</p>
        </motion.div>
      )}
    </div>
  );
};

export default StepPhotoPrint;
