/**
 * StepVideoQR.jsx — Step 4
 *
 * Allows users to upload a video message.
 * Generates a QR code preview by calling the backend.
 * The QR is printed on a card inside the gift box.
 */

'use client';
import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiUploadCloud, FiVideo, FiX, FiCheck } from 'react-icons/fi';
import { useCart } from '../../context/CartContext';
import axiosClient from '../../api/axiosClient';
import toast from 'react-hot-toast';

const MAX_FILE_SIZE_MB = 50;

const StepVideoQR = () => {
  const { videoMessage, dispatch } = useCart();
  const fileInputRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);

  const update = (payload) => dispatch({ type: 'SET_VIDEO_MESSAGE', payload });

  const handleFile = async (file) => {
    if (!file) return;
    if (!file.type.startsWith('video/')) {
      toast.error('Please upload a video file (MP4, MOV, WEBM)');
      return;
    }
    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      toast.error(`Video must be under ${MAX_FILE_SIZE_MB}MB`);
      return;
    }

    // Local preview
    const localUrl = URL.createObjectURL(file);
    setPreviewUrl(localUrl);

    // In production: upload to S3 and get a CDN URL.
    // For MVP: we simulate the upload and use a placeholder URL.
    setUploading(true);
    try {
      await new Promise((r) => setTimeout(r, 1200)); // Simulate upload delay

      const mockVideoUrl = `https://cdn.emotiondelivery.app/videos/${Date.now()}.mp4`;
      update({ enabled: true, videoUrl: mockVideoUrl });
      toast.success('Video uploaded! QR code will be generated at checkout 🎥', { duration: 3000 });
    } catch {
      toast.error('Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    handleFile(e.dataTransfer.files[0]);
  };

  const removeVideo = () => {
    setPreviewUrl(null);
    update({ enabled: false, videoUrl: '', qrCodeUrl: '' });
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="glass-card p-6 md:p-8">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="text-white text-2xl font-bold font-display">Video Message QR</h2>
          <p className="text-white/40 text-sm mt-1">
            Record a moment · Printed QR on gift card · +₹149
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-white/50 text-sm">Enable</span>
          <button
            id="video-toggle"
            onClick={() => update({ enabled: !videoMessage.enabled })}
            className={`toggle ${videoMessage.enabled ? 'bg-brand-500' : 'bg-white/10'}`}
          >
            <span className={`toggle-thumb ${videoMessage.enabled ? 'translate-x-5' : 'translate-x-1'}`} />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {videoMessage.enabled && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            {/* Upload zone */}
            {!previewUrl ? (
              <motion.div
                onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                animate={{
                  borderColor: dragging ? 'rgba(232,93,154,0.8)' : 'rgba(255,255,255,0.1)',
                  backgroundColor: dragging ? 'rgba(232,93,154,0.06)' : 'rgba(255,255,255,0.02)',
                }}
                className="border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer
                           transition-colors duration-200 mb-5"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="video/*"
                  className="hidden"
                  id="video-file-input"
                  onChange={(e) => handleFile(e.target.files[0])}
                />

                {uploading ? (
                  <div className="flex flex-col items-center">
                    <div className="w-14 h-14 rounded-2xl bg-brand-500/20 flex items-center justify-center mb-4">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                      >
                        <FiUploadCloud size={28} className="text-brand-400" />
                      </motion.div>
                    </div>
                    <p className="text-white/60">Uploading your video…</p>
                    <div className="w-32 h-1 bg-white/10 rounded-full mt-3 overflow-hidden">
                      <motion.div
                        initial={{ width: '0%' }}
                        animate={{ width: '100%' }}
                        transition={{ duration: 1.2, ease: 'easeInOut' }}
                        className="h-full bg-gradient-brand rounded-full"
                      />
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="w-16 h-16 rounded-2xl bg-brand-500/15 flex items-center justify-center mx-auto mb-4">
                      <FiVideo size={32} className="text-brand-400" />
                    </div>
                    <p className="text-white font-semibold mb-1">Drop your video here</p>
                    <p className="text-white/40 text-sm mb-3">MP4, MOV, WEBM · Max 50MB</p>
                    <span className="btn-ghost text-xs border border-white/10 rounded-xl px-4 py-2">
                      Or browse files
                    </span>
                  </>
                )}
              </motion.div>
            ) : (
              /* Video preview */
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative rounded-2xl overflow-hidden mb-5 bg-black/40"
              >
                <video
                  src={previewUrl}
                  controls
                  className="w-full max-h-56 object-cover"
                  style={{ borderRadius: '1rem' }}
                />
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={removeVideo}
                  id="remove-video-btn"
                  className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/60 flex items-center justify-center
                             text-white hover:bg-red-500 transition-colors"
                >
                  <FiX size={14} />
                </motion.button>

                {/* Uploaded badge */}
                <div className="absolute bottom-3 left-3 badge-green">
                  <FiCheck size={10} className="mr-1" />
                  Video ready
                </div>
              </motion.div>
            )}

            {/* QR mock-up explanation */}
            <div className="grid md:grid-cols-2 gap-4">
              {/* How it works */}
              <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/[0.08]">
                <p className="text-white font-semibold text-sm mb-3">How It Works</p>
                <ol className="space-y-2">
                  {[
                    'You upload a personal video message',
                    'We host it securely and generate a QR code',
                    'The QR is printed on a premium card inside the gift box',
                    'Recipient scans it to play your video instantly',
                  ].map((step, i) => (
                    <li key={i} className="flex gap-2 text-white/50 text-xs">
                      <span className="w-4 h-4 rounded-full bg-brand-500/30 text-brand-400 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                        {i + 1}
                      </span>
                      {step}
                    </li>
                  ))}
                </ol>
              </div>

              {/* QR placeholder preview */}
              <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/[0.08] flex flex-col items-center justify-center text-center">
                {videoMessage.videoUrl ? (
                  <>
                    <div className="w-24 h-24 rounded-xl bg-white p-2 mb-3 shadow-lg">
                      {/* QR placeholder pattern */}
                      <svg viewBox="0 0 100 100" className="w-full h-full">
                        <rect x="10" y="10" width="30" height="30" fill="none" stroke="#1A1A2E" strokeWidth="8" rx="3"/>
                        <rect x="18" y="18" width="14" height="14" fill="#1A1A2E" rx="2"/>
                        <rect x="60" y="10" width="30" height="30" fill="none" stroke="#1A1A2E" strokeWidth="8" rx="3"/>
                        <rect x="68" y="18" width="14" height="14" fill="#1A1A2E" rx="2"/>
                        <rect x="10" y="60" width="30" height="30" fill="none" stroke="#1A1A2E" strokeWidth="8" rx="3"/>
                        <rect x="18" y="68" width="14" height="14" fill="#1A1A2E" rx="2"/>
                        <rect x="50" y="50" width="8" height="8" fill="#1A1A2E"/>
                        <rect x="62" y="50" width="8" height="8" fill="#1A1A2E"/>
                        <rect x="74" y="50" width="8" height="8" fill="#1A1A2E"/>
                        <rect x="50" y="62" width="8" height="8" fill="#1A1A2E"/>
                        <rect x="74" y="62" width="8" height="8" fill="#1A1A2E"/>
                        <rect x="50" y="74" width="8" height="8" fill="#1A1A2E"/>
                        <rect x="62" y="74" width="8" height="8" fill="#1A1A2E"/>
                        <rect x="74" y="74" width="8" height="8" fill="#1A1A2E"/>
                      </svg>
                    </div>
                    <p className="text-white/60 text-xs">QR preview (generated at checkout)</p>
                    <p className="text-green-400 text-xs mt-1 font-medium">✓ Video uploaded</p>
                  </>
                ) : (
                  <>
                    <div className="text-5xl mb-3">📱</div>
                    <p className="text-white/40 text-sm">QR preview after upload</p>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {!videoMessage.enabled && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center py-12 text-center"
        >
          <div className="text-6xl mb-4 animate-float">🎥</div>
          <p className="text-white/40 text-base">Enable to add a video message QR code.</p>
          <p className="text-white/20 text-sm mt-1">Just ₹149 — makes the gift unforgettable</p>
        </motion.div>
      )}
    </div>
  );
};

export default StepVideoQR;
