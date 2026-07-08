/**
 * index.jsx — Home Page with Scroll-Triggered Reveals & Interactive Polish
 */
import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, useReducedMotion } from 'framer-motion';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Hero from '../components/Hero';

const CATEGORIES = [
  { id: 'birthday', name: 'Birthday', emoji: '🎂', color: '#E85D9A' },
  { id: 'anniversary', name: 'Anniversary', emoji: '💑', color: '#8B5CF6' },
  { id: 'wedding', name: 'Wedding', emoji: '💍', color: '#F59E0B' },
  { id: 'proposal', name: 'Proposal', emoji: '💘', color: '#EC4899' },
  { id: 'friendship', name: 'Friendship', emoji: '🤝', color: '#10B981' },
  { id: 'congrats', name: 'Congratulations', emoji: '🎉', color: '#3B82F6' },
  { id: 'baby', name: 'Baby Shower', emoji: '🍼', color: '#F472B6' },
  { id: 'farewell', name: 'Farewell', emoji: '✈️', color: '#6366F1' },
  { id: 'festivals', name: 'Festivals', emoji: '🪔', color: '#EF4444' },
  { id: 'corporate', name: 'Corporate', emoji: '💼', color: '#64748B' },
  { id: 'sympathy', name: 'Sympathy', emoji: '🕊️', color: '#9CA3AF' },
  { id: 'hampers', name: 'Custom Hampers', emoji: '🧺', color: '#D97706' },
];

const FEATURES = [
  { icon: '✍️', title: 'Handwritten Letters', desc: 'Real pen-plotter printed letters in 3 beautiful calligraphy fonts', color: '#E85D9A' },
  { icon: '📹', title: 'Video QR Message', desc: 'Scan-to-play video memory card embedded right inside your box', color: '#8B5CF6' },
  { icon: '🌙', title: 'Midnight Delivery', desc: 'Surprise delivered guaranteed at exactly 12:00 AM on their special day', color: '#F59E0B' },
  { icon: '📍', title: 'Live GPS Tracking', desc: 'Watch your delivery partner travel in real-time on our interactive map', color: '#10B981' },
  { icon: '🤖', title: 'AI Greeting Generator', desc: 'Personalised heartfelt messages crafted instantly by AI for any occasion', color: '#3B82F6' },
  { icon: '🎯', title: 'Build Your Own Box', desc: 'Curate any combination of luxury gifts inside custom packaging', color: '#EC4899' },
];

const STEPS = [
  { num: '01', title: 'Select Gifts', desc: 'Browse 100+ curated artisan chocolates, perfumes, plushies & roses.', icon: '🛍️' },
  { num: '02', title: 'Personalise Details', desc: 'Add a handwritten calligraphy letter or upload a personal video message.', icon: '✍️' },
  { num: '03', title: 'Schedule Delivery', desc: 'Choose standard slots or surprise them at exactly midnight (12 AM).', icon: '⏰' },
  { num: '04', title: 'Live GPS Tracking', desc: 'Track your gift courier live on Google Maps until handover.', icon: '🚀' },
];

export default function Home() {
  const router = useRouter();
  const shouldReduceMotion = useReducedMotion();

  const handleCategoryClick = (catId) => {
    router.push(`/shop?category=${catId}`);
  };

  const sectionHeaderVariants = {
    hidden: { opacity: 0, y: shouldReduceMotion ? 0 : 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] },
    },
  };

  const gridVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: shouldReduceMotion ? 0 : 0.05,
      },
    },
  };

  const cardVariants = {
    hidden: { opacity: 0, y: shouldReduceMotion ? 0 : 18 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.4, ease: 'easeOut' },
    },
  };

  const stepCardVariants = {
    hidden: { opacity: 0, scale: shouldReduceMotion ? 1 : 0.96 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: { duration: 0.45, ease: 'easeOut' },
    },
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 text-gray-900 dark:bg-[#0D0D1A] dark:text-white transition-colors duration-300">
      <Head>
        <title>Emotion Delivery Platform — Crafting Meaningful Gift Boxes</title>
        <meta name="description" content="India's #1 emotion gift delivery SaaS platform. Send personalized gift boxes with handwritten letters, video QR codes, and midnight delivery." />
      </Head>

      <Navbar />

      <main className="flex-grow">
        {/* Hero Section */}
        <Hero />

        {/* Categories Section */}
        <section className="py-16 px-4 max-w-7xl mx-auto">
          <motion.div
            variants={sectionHeaderVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-60px' }}
            className="text-center mb-12"
          >
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-white mb-3">
              Shop by Occasion
            </h2>
            <p className="text-white/50 text-sm sm:text-base max-w-xl mx-auto">
              Whatever the celebration, we have handcrafted gift collections tailored to evoke deep emotional resonance.
            </p>
          </motion.div>

          <motion.div
            variants={gridVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-60px' }}
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4"
          >
            {CATEGORIES.map((cat) => (
              <motion.button
                key={cat.id}
                variants={cardVariants}
                whileHover={shouldReduceMotion ? {} : { y: -4, scale: 1.02 }}
                whileTap={shouldReduceMotion ? {} : { scale: 0.96 }}
                onClick={() => handleCategoryClick(cat.id)}
                className="p-5 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-brand-500/50 hover:bg-white/[0.06] transition-colors flex flex-col items-center justify-center text-center group cursor-pointer shadow-sm"
              >
                <span className="text-3xl mb-3 group-hover:scale-110 transition-transform duration-300">{cat.emoji}</span>
                <span className="text-xs font-bold text-white/80 group-hover:text-white">{cat.name}</span>
              </motion.button>
            ))}
          </motion.div>
        </section>

        {/* How It Works Workflow Steps */}
        <section className="py-20 px-4 bg-white/[0.015] border-y border-white/5">
          <div className="max-w-7xl mx-auto">
            <motion.div
              variants={sectionHeaderVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-60px' }}
              className="text-center mb-16"
            >
              <span className="text-xs font-bold uppercase tracking-widest text-brand-400 block mb-2">Workflow</span>
              <h2 className="font-display text-3xl sm:text-4xl font-bold text-white">
                How Emotion Delivery Works
              </h2>
            </motion.div>

            <motion.div
              variants={gridVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-60px' }}
              className="grid md:grid-cols-2 lg:grid-cols-4 gap-8"
            >
              {STEPS.map((s, idx) => (
                <motion.div
                  key={s.num}
                  variants={stepCardVariants}
                  whileHover={shouldReduceMotion ? {} : { y: -5 }}
                  className="relative p-6 rounded-3xl bg-white/[0.03] border border-white/10 hover:border-brand-500/40 hover:bg-white/[0.05] transition-colors flex flex-col justify-between shadow-md"
                >
                  <div>
                    <div className="flex items-center justify-between mb-6">
                      <span className="w-12 h-12 rounded-2xl bg-brand-500/20 border border-brand-500/30 flex items-center justify-center text-2xl">
                        {s.icon}
                      </span>
                      <span className="font-mono text-2xl font-black text-white/15">{s.num}</span>
                    </div>
                    <h3 className="text-lg font-bold text-white mb-2">{s.title}</h3>
                    <p className="text-xs text-white/50 leading-relaxed">{s.desc}</p>
                  </div>
                  <div className="mt-6 pt-4 border-t border-white/5 flex items-center text-[11px] text-brand-400 font-semibold">
                    <span>Step {idx + 1}</span>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* Features Grid */}
        <section className="py-20 px-4 max-w-7xl mx-auto">
          <motion.div
            variants={sectionHeaderVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-60px' }}
            className="text-center mb-16"
          >
            <span className="text-xs font-bold uppercase tracking-widest text-purple-400 block mb-2">Platform Capabilities</span>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-white">
              Why We Are Different
            </h2>
          </motion.div>

          <motion.div
            variants={gridVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-60px' }}
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {FEATURES.map((feat) => (
              <motion.div
                key={feat.title}
                variants={cardVariants}
                whileHover={shouldReduceMotion ? {} : { y: -4, scale: 1.01 }}
                className="p-6 rounded-3xl bg-white/[0.03] border border-white/10 hover:border-white/25 transition-colors space-y-4 group shadow-md"
              >
                <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform duration-300">
                  {feat.icon}
                </div>
                <h3 className="text-base font-bold text-white">{feat.title}</h3>
                <p className="text-xs text-white/50 leading-relaxed">{feat.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </section>

        {/* Call to Action Banner */}
        <section className="py-16 px-4 max-w-5xl mx-auto mb-16">
          <motion.div
            initial={{ opacity: 0, scale: shouldReduceMotion ? 1 : 0.96 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="p-10 sm:p-14 rounded-3xl bg-gradient-to-r from-brand-900/90 via-purple-900/90 to-indigo-900/90 border border-brand-500/30 text-center space-y-6 relative overflow-hidden shadow-2xl"
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-brand-500/20 rounded-full blur-3xl pointer-events-none" />
            <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-white">
              Ready to Craft an Unforgettable Memory?
            </h2>
            <p className="text-white/70 text-sm sm:text-base max-w-xl mx-auto leading-relaxed">
              Build your custom gift box right now and schedule it for instant delivery or a surprise midnight drop.
            </p>
            <div className="pt-2">
              <motion.div
                whileHover={shouldReduceMotion ? {} : { scale: 1.04, y: -2 }}
                whileTap={shouldReduceMotion ? {} : { scale: 0.97 }}
                className="inline-block"
              >
                <Link
                  href="/build"
                  className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-white text-[#0D0D1A] font-bold text-sm shadow-xl transition-colors"
                >
                  <span>Start Building Gift Box</span>
                  <span>✨</span>
                </Link>
              </motion.div>
            </div>
          </motion.div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
