/**
 * Hero.jsx — Dynamic Hero Section with Staggered Entrance & Subtle Motion
 */
'use client';
import React from 'react';
import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import { FiArrowRight, FiStar, FiGift, FiClock } from 'react-icons/fi';

const Hero = () => {
  const shouldReduceMotion = useReducedMotion();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: shouldReduceMotion ? 0 : 0.12,
        delayChildren: shouldReduceMotion ? 0 : 0.05,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: shouldReduceMotion ? 0 : 24 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] },
    },
  };

  return (
    <section className="relative pt-12 pb-24 px-4 overflow-hidden">
      
      {/* Background Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-gradient-to-tr from-brand-500/20 via-purple-500/20 to-blue-500/10 blur-[140px] pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
        
        {/* Left Column: Copy & CTAs */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="text-center lg:text-left space-y-6"
        >
          {/* Badge */}
          <motion.div
            variants={itemVariants}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.05] border border-white/10 text-brand-300 text-xs font-semibold backdrop-blur-md shadow-lg"
          >
            <FiStar className="text-brand-400" />
            <span>India&apos;s #1 Aurora SaaS Platform</span>
          </motion.div>

          {/* Title */}
          <motion.h1
            variants={itemVariants}
            className="font-display text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-tight"
          >
            Send Gifts That Convey Your <br />
            <span className="bg-gradient-to-r from-brand-400 via-purple-400 to-pink-300 bg-clip-text text-transparent">
              True Emotions.
            </span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            variants={itemVariants}
            className="text-white/60 text-base sm:text-lg max-w-xl mx-auto lg:mx-0 leading-relaxed"
          >
            Curate personalized gift boxes with authentic handwritten letters, embed video QR memories, and surprise loved ones with guaranteed midnight delivery & live GPS tracking.
          </motion.p>

          {/* Action Buttons */}
          <motion.div
            variants={itemVariants}
            className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-4"
          >
            <motion.div
              whileHover={shouldReduceMotion ? {} : { scale: 1.03, y: -2 }}
              whileTap={shouldReduceMotion ? {} : { scale: 0.98 }}
              className="w-full sm:w-auto"
            >
              <Link
                href="/build"
                className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-brand-500 to-purple-600 text-white font-bold text-sm shadow-xl shadow-brand-500/25 transition-colors flex items-center justify-center gap-2 group"
              >
                <span>Build Your Gift Box</span>
                <FiArrowRight className="group-hover:translate-x-1.5 transition-transform duration-300" />
              </Link>
            </motion.div>

            <motion.div
              whileHover={shouldReduceMotion ? {} : { scale: 1.02, y: -2 }}
              whileTap={shouldReduceMotion ? {} : { scale: 0.98 }}
              className="w-full sm:w-auto"
            >
              <Link
                href="/shop"
                className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-white/[0.06] border border-white/15 text-white font-semibold text-sm hover:bg-white/10 transition-colors flex items-center justify-center gap-2"
              >
                <span>Explore Catalog</span>
              </Link>
            </motion.div>
          </motion.div>

          {/* Key Metrics */}
          <motion.div
            variants={itemVariants}
            className="grid grid-cols-3 gap-6 pt-8 border-t border-white/10 max-w-lg mx-auto lg:mx-0"
          >
            <div>
              <p className="font-display text-2xl font-bold text-white">50,000+</p>
              <p className="text-xs text-white/40">Gifts Delivered</p>
            </div>
            <div>
              <p className="font-display text-2xl font-bold text-brand-400">99.8%</p>
              <p className="text-xs text-white/40">On-Time Midnight</p>
            </div>
            <div>
              <p className="font-display text-2xl font-bold text-purple-400">4.9/5</p>
              <p className="text-xs text-white/40">Customer Rating</p>
            </div>
          </motion.div>

        </motion.div>

        {/* Right Column: Visual Mockup */}
        <motion.div
          initial={{ opacity: 0, scale: shouldReduceMotion ? 1 : 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          className="relative flex items-center justify-center"
        >
          <motion.div
            animate={shouldReduceMotion ? { y: 0 } : { y: [0, -10, 0] }}
            transition={{ repeat: Infinity, duration: 6, ease: 'easeInOut' }}
            style={{ willChange: 'transform' }}
            className="w-full max-w-md bg-white/[0.04] border border-white/10 rounded-3xl p-6 backdrop-blur-2xl shadow-2xl relative overflow-hidden"
          >
            
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-white/10">
              <div className="flex items-center gap-3">
                <span className="w-3 h-3 rounded-full bg-red-400" />
                <span className="w-3 h-3 rounded-full bg-yellow-400" />
                <span className="w-3 h-3 rounded-full bg-green-400" />
              </div>
              <span className="text-[11px] font-mono text-white/40">EDP-LIVE-BOX-9921</span>
            </div>

            {/* Gift Box Preview Card */}
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-gradient-to-r from-brand-500/15 to-purple-500/15 border border-brand-500/30 flex items-center justify-between">
                <div className="flex items-center gap-3.5">
                  <span className="text-3xl">🌹</span>
                  <div>
                    <p className="text-sm font-bold text-white">Preserved Eternal Rose</p>
                    <p className="text-xs text-white/50">Luxury Velvet Box Tier</p>
                  </div>
                </div>
                <span className="text-sm font-bold text-brand-400">₹2,499</span>
              </div>

              <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-3.5">
                  <span className="text-3xl">✍️</span>
                  <div>
                    <p className="text-sm font-bold text-white">Handwritten Pen Letter</p>
                    <p className="text-xs text-white/50">Cursive Calligraphy Font</p>
                  </div>
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-brand-500/20 text-brand-300">Added</span>
              </div>

              <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-3.5">
                  <span className="text-3xl">🎥</span>
                  <div>
                    <p className="text-sm font-bold text-white">Video QR Memory Card</p>
                    <p className="text-xs text-white/50">Scan to watch video message</p>
                  </div>
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-purple-500/20 text-purple-300">Active</span>
              </div>

              {/* Delivery Banner */}
              <div className="mt-4 p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center gap-3 text-amber-300 text-xs font-semibold">
                <FiClock size={16} />
                <span>Scheduled for Midnight Surprise Delivery (12:00 AM)</span>
              </div>

            </div>

          </motion.div>

          {/* Floating Badges */}
          <motion.div
            animate={shouldReduceMotion ? { y: 0 } : { y: [0, -6, 0] }}
            transition={{ repeat: Infinity, duration: 4.5, ease: 'easeInOut' }}
            style={{ willChange: 'transform' }}
            className="absolute -top-6 -left-4 px-4 py-2.5 rounded-2xl bg-[#1A1A3E] border border-white/15 shadow-2xl flex items-center gap-2.5"
          >
            <span className="text-lg">💖</span>
            <div>
              <p className="text-[11px] font-bold text-white">100% Personalised</p>
              <p className="text-[9px] text-white/50">Crafted by experts</p>
            </div>
          </motion.div>

        </motion.div>

      </div>
    </section>
  );
};

export default Hero;
