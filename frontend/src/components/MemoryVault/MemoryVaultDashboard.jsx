/**
 * MemoryVaultDashboard.jsx
 *
 * The central Memory Vault page component.
 * - Fetches vault data from the backend
 * - Shows upcoming milestones with day countdown
 * - "One-Click Reorder" triggers AI recommendations and adds to cart
 * - Allows adding new relations and milestones
 */

'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiPlus, FiHeart, FiCalendar, FiGift, FiBell, FiUser } from 'react-icons/fi';
import axiosClient from '../../api/axiosClient';
import { useCart } from '../../context/CartContext';
import MilestoneCard from './MilestoneCard';
import toast from 'react-hot-toast';

// ── Animation variants ────────────────────────────────────────────
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.2 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } },
};

// ── Stat card component ───────────────────────────────────────────
const StatCard = ({ icon: Icon, label, value, color }) => (
  <div className="glass-card p-5 flex items-center gap-4">
    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${color}`}>
      <Icon size={22} />
    </div>
    <div>
      <p className="text-white/50 text-sm">{label}</p>
      <p className="text-white text-2xl font-bold">{value}</p>
    </div>
  </div>
);

// ── Main component ────────────────────────────────────────────────
const MemoryVaultDashboard = () => {
  const [vault, setVault] = useState(null);
  const [upcomingMilestones, setUpcomingMilestones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('upcoming'); // upcoming | all
  const [showAddModal, setShowAddModal] = useState(false);
  const [reordering, setReordering] = useState(null); // milestoneId being reordered
  const { dispatch: cartDispatch } = useCart();

  // ── Fetch vault data ──────────────────────────────────────────
  const fetchVault = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axiosClient.get('/memory-vault');
      setVault(res.data.vault);
      setUpcomingMilestones(res.data.upcomingMilestones || []);
    } catch (err) {
      toast.error('Could not load your Memory Vault');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVault();
  }, [fetchVault]);

  // ── One-Click Reorder ─────────────────────────────────────────
  // Fetches AI recommendations for this milestone and adds top result to cart
  const handleOneClickReorder = async (milestone) => {
    try {
      setReordering(milestone.milestoneId);
      const res = await axiosClient.get('/recommendations', {
        params: {
          relation: milestone.relation,
          occasion: milestone.label,
          budgetMin: milestone.budgetRange?.min || 500,
          budgetMax: milestone.budgetRange?.max || 5000,
          topN: 1,
        },
      });

      const top = res.data.recommendations?.[0];
      if (!top) {
        toast('No recommendation found. Browse our catalogue!', { icon: '🔍' });
        return;
      }

      // Set the cart's target relation
      cartDispatch({ type: 'SET_RELATION', payload: milestone.relationId });

      // Add top recommendation to cart
      cartDispatch({
        type: 'ADD_ITEM',
        payload: {
          productId: top.id,
          name: top.name,
          image: top.image,
          price: top.price,
          category: top.category,
        },
      });

      toast.success(
        `"${top.name}" added to your gift box for ${milestone.nickname}! 🎁`,
        { duration: 4000 }
      );
    } catch (err) {
      toast.error('Could not fetch recommendations. Try again.');
    } finally {
      setReordering(null);
    }
  };

  // ── Delete relation ───────────────────────────────────────────
  const handleDeleteRelation = async (relId, nickname) => {
    if (!confirm(`Remove ${nickname} from your vault?`)) return;
    try {
      await axiosClient.delete(`/memory-vault/relation/${relId}`);
      toast.success(`${nickname} removed`);
      fetchVault();
    } catch {
      toast.error('Could not remove relation');
    }
  };

  // ── Stats ─────────────────────────────────────────────────────
  const stats = vault
    ? {
        relations: vault.relations?.length || 0,
        upcoming7: upcomingMilestones.filter((m) => m.daysUntil <= 7).length,
        upcoming30: upcomingMilestones.filter((m) => m.daysUntil <= 30).length,
        totalGifts: vault.relations?.reduce(
          (sum, r) => sum + (r.pastGifts?.length || 0),
          0
        ) || 0,
      }
    : null;

  // ── Loading skeleton ──────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen py-12 px-4 max-w-6xl mx-auto">
        <div className="skeleton h-10 w-64 mb-4 rounded-2xl" />
        <div className="skeleton h-5 w-48 mb-12 rounded-xl" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="skeleton h-24 rounded-2xl" />
          ))}
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="skeleton h-52 rounded-3xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="max-w-6xl mx-auto">

        {/* ── Header ── */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-10"
        >
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-2xl bg-gradient-brand flex items-center justify-center">
                <FiHeart className="text-white" size={20} />
              </div>
              <span className="badge-brand">Memory Vault</span>
            </div>
            <h1 className="section-title">Your Loved Ones</h1>
            <p className="section-subtitle">Never miss a moment that matters</p>
          </div>

          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setShowAddModal(true)}
            className="btn-primary whitespace-nowrap"
            id="add-relation-btn"
          >
            <FiPlus size={18} />
            Add Person
          </motion.button>
        </motion.div>

        {/* ── Stats row ── */}
        {stats && (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10"
          >
            <motion.div variants={itemVariants}>
              <StatCard icon={FiUser}     label="Relationships"   value={stats.relations}  color="bg-brand-500/20 text-brand-400" />
            </motion.div>
            <motion.div variants={itemVariants}>
              <StatCard icon={FiBell}     label="Due This Week"   value={stats.upcoming7}  color="bg-red-500/20 text-red-400" />
            </motion.div>
            <motion.div variants={itemVariants}>
              <StatCard icon={FiCalendar} label="Due This Month"  value={stats.upcoming30} color="bg-amber-500/20 text-amber-400" />
            </motion.div>
            <motion.div variants={itemVariants}>
              <StatCard icon={FiGift}     label="Gifts Sent"      value={stats.totalGifts} color="bg-green-500/20 text-green-400" />
            </motion.div>
          </motion.div>
        )}

        {/* ── AI Insight banner ── */}
        {vault?.aiInsightSummary && (
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-card p-5 mb-8 flex items-start gap-4 border-brand-500/20"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-brand flex items-center justify-center shrink-0 mt-0.5">
              <span className="text-lg">✨</span>
            </div>
            <div>
              <p className="text-white/50 text-xs uppercase tracking-widest mb-1 font-semibold">
                AI Insight
              </p>
              <p className="text-white/80 text-sm leading-relaxed">{vault.aiInsightSummary}</p>
            </div>
          </motion.div>
        )}

        {/* ── Tabs ── */}
        <div className="flex gap-2 mb-7">
          {['upcoming', 'all'].map((tab) => (
            <button
              key={tab}
              id={`tab-${tab}`}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                activeTab === tab
                  ? 'bg-brand-500 text-white shadow-[0_0_16px_rgba(232,93,154,0.4)]'
                  : 'text-white/50 hover:text-white hover:bg-white/[0.08]'
              }`}
            >
              {tab === 'upcoming' ? '🗓 Upcoming' : '👥 All People'}
            </button>
          ))}
        </div>

        {/* ── Content ── */}
        <AnimatePresence mode="wait">
          {activeTab === 'upcoming' ? (
            <motion.div
              key="upcoming"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit={{ opacity: 0 }}
              className="grid md:grid-cols-2 lg:grid-cols-3 gap-5"
            >
              {upcomingMilestones.length === 0 ? (
                <motion.div
                  variants={itemVariants}
                  className="col-span-full glass-card p-12 text-center"
                >
                  <div className="text-6xl mb-4">📭</div>
                  <p className="text-white/60 text-lg">
                    No upcoming milestones in the next 30 days.
                  </p>
                  <button
                    onClick={() => setShowAddModal(true)}
                    className="btn-primary mt-6 mx-auto"
                  >
                    <FiPlus /> Add a Person
                  </button>
                </motion.div>
              ) : (
                upcomingMilestones.map((milestone) => (
                  <motion.div key={`${milestone.relationId}-${milestone.milestoneId}`} variants={itemVariants}>
                    <MilestoneCard
                      milestone={milestone}
                      onReorder={() => handleOneClickReorder(milestone)}
                      isReordering={reordering === milestone.milestoneId}
                    />
                  </motion.div>
                ))
              )}
            </motion.div>
          ) : (
            <motion.div
              key="all"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit={{ opacity: 0 }}
              className="grid md:grid-cols-2 lg:grid-cols-3 gap-5"
            >
              {vault?.relations?.length === 0 ? (
                <motion.div variants={itemVariants} className="col-span-full glass-card p-12 text-center">
                  <div className="text-6xl mb-4">💝</div>
                  <p className="text-white/60 text-lg">Start by adding the people you love.</p>
                  <button onClick={() => setShowAddModal(true)} className="btn-primary mt-6 mx-auto">
                    <FiPlus /> Add First Person
                  </button>
                </motion.div>
              ) : (
                vault.relations.map((rel) => (
                  <motion.div key={rel._id} variants={itemVariants}>
                    <RelationCard
                      relation={rel}
                      onDelete={() => handleDeleteRelation(rel._id, rel.nickname)}
                    />
                  </motion.div>
                ))
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Add Relation Modal ── */}
      <AnimatePresence>
        {showAddModal && (
          <AddRelationModal
            onClose={() => setShowAddModal(false)}
            onSuccess={() => { setShowAddModal(false); fetchVault(); }}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

// ── Relation summary card (used in "All People" tab) ──────────────
const RelationCard = ({ relation, onDelete }) => (
  <div className="glass-card p-5 group hover:border-brand-500/30 transition-all duration-300">
    <div className="flex items-center gap-3 mb-4">
      <div className="w-12 h-12 rounded-2xl bg-gradient-brand flex items-center justify-center text-xl font-bold">
        {relation.profilePhoto ? (
          <img src={relation.profilePhoto} className="w-full h-full object-cover rounded-2xl" alt={relation.nickname} />
        ) : (
          relation.nickname[0].toUpperCase()
        )}
      </div>
      <div>
        <p className="text-white font-semibold">{relation.nickname}</p>
        <p className="text-white/40 text-sm">{relation.relation}</p>
      </div>
    </div>
    <div className="flex items-center justify-between text-sm text-white/50">
      <span>📅 {relation.milestones?.length || 0} dates</span>
      <span>🎁 {relation.pastGifts?.length || 0} gifts</span>
      <button
        onClick={onDelete}
        className="text-red-400/60 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
      >
        Remove
      </button>
    </div>
  </div>
);

// ── Add Relation Modal ────────────────────────────────────────────
const RELATIONS = ['Mom','Dad','Girlfriend','Boyfriend','Wife','Husband','Sister','Brother','Friend','Colleague','Boss','Child','Grandparent','Other'];

const AddRelationModal = ({ onClose, onSuccess }) => {
  const [form, setForm] = useState({ nickname: '', relation: 'Friend', phone: '', email: '', notes: '' });
  const [milestones, setMilestones] = useState([{ label: 'Birthday', date: '' }]);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      // Add relation
      const res = await axiosClient.post('/memory-vault/add', { type: 'relation', ...form });
      const newRelId = res.data._id;

      // Add milestones
      await Promise.all(
        milestones
          .filter((m) => m.label && m.date)
          .map((m) =>
            axiosClient.post('/memory-vault/add', {
              type: 'milestone',
              relationId: newRelId,
              ...m,
            })
          )
      );

      toast.success(`${form.nickname} added to your Memory Vault! 💖`);
      onSuccess();
    } catch (err) {
      toast.error(err.message || 'Could not add person');
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="glass-card w-full max-w-lg p-7 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="font-display text-2xl font-bold text-white mb-1">Add to Your Vault</h2>
        <p className="text-white/40 text-sm mb-6">Someone special deserves to be remembered</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-white/60 text-sm mb-1.5 block">Name / Nickname *</label>
              <input
                required
                placeholder="Mom"
                className="input-field"
                value={form.nickname}
                onChange={(e) => setForm({ ...form, nickname: e.target.value })}
              />
            </div>
            <div>
              <label className="text-white/60 text-sm mb-1.5 block">Relation *</label>
              <select
                className="input-field"
                value={form.relation}
                onChange={(e) => setForm({ ...form, relation: e.target.value })}
              >
                {RELATIONS.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-white/60 text-sm mb-1.5 block">Phone</label>
              <input placeholder="+91 98765 43210" className="input-field" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
            <div>
              <label className="text-white/60 text-sm mb-1.5 block">Email</label>
              <input type="email" placeholder="mom@example.com" className="input-field" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
          </div>

          <div>
            <label className="text-white/60 text-sm mb-1.5 block">Notes</label>
            <textarea rows={2} placeholder="Loves dark chocolate, prefers subtle fragrances…" className="textarea-field" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </div>

          {/* Milestones */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-white/60 text-sm font-medium">Important Dates</label>
              <button type="button" onClick={() => setMilestones([...milestones, { label: '', date: '' }])} className="text-brand-400 text-xs hover:text-brand-300 flex items-center gap-1">
                <FiPlus size={12} /> Add Date
              </button>
            </div>
            {milestones.map((ms, idx) => (
              <div key={idx} className="flex gap-2 mb-2">
                <input placeholder="Birthday" className="input-field flex-1" value={ms.label} onChange={(e) => { const n = [...milestones]; n[idx].label = e.target.value; setMilestones(n); }} />
                <input type="date" className="input-field flex-1" value={ms.date} onChange={(e) => { const n = [...milestones]; n[idx].date = e.target.value; setMilestones(n); }} />
              </div>
            ))}
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-ghost flex-1">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary flex-1">
              {saving ? 'Saving…' : 'Add to Vault 💖'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};

export default MemoryVaultDashboard;
