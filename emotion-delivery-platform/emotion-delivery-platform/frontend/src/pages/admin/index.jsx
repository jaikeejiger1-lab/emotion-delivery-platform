/**
 * /admin/index.jsx — Master Admin Control Dashboard
 */
import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import AdminLayout from '../../components/Admin/AdminLayout';
import axiosClient from '../../api/axiosClient';
import toast from 'react-hot-toast';
import {
  FiUsers, FiDollarSign, FiShoppingBag, FiTruck,
  FiRefreshCw, FiArrowRight, FiActivity, FiShield
} from 'react-icons/fi';

const DashboardPanels = dynamic(() => import('../../components/Admin/DashboardPanels'), {
  ssr: false,
  loading: () => <div className="h-96 rounded-3xl bg-white/5 animate-pulse w-full" />,
});

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalRevenue: 0,
    activeOrders: 0,
    deliveryPartners: 0,
    recentOrders: [],
    recentAuditLogs: [],
  });
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await axiosClient.get('/admin/stats');
      if (res.success && res.data) {
        setStats(res.data);
      }
    } catch (err) {
      toast.error('Failed to load real-time dashboard analytics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const metricCards = [
    {
      title: 'Total Platform Users',
      value: stats.totalUsers.toLocaleString('en-IN'),
      subtitle: 'Registered active customers & staff',
      icon: FiUsers,
      color: 'from-blue-500/20 to-indigo-500/20',
      border: 'border-blue-500/30',
      textColor: 'text-blue-400',
    },
    {
      title: 'Total Gross Revenue',
      value: `₹${stats.totalRevenue.toLocaleString('en-IN')}`,
      subtitle: 'Real aggregate Mongoose revenue',
      icon: FiDollarSign,
      color: 'from-green-500/20 to-emerald-500/20',
      border: 'border-green-500/30',
      textColor: 'text-green-400',
    },
    {
      title: 'Active In-Flight Orders',
      value: stats.activeOrders.toLocaleString('en-IN'),
      subtitle: 'Pending, Packing, Out for Delivery',
      icon: FiShoppingBag,
      color: 'from-amber-500/20 to-orange-500/20',
      border: 'border-amber-500/30',
      textColor: 'text-amber-400',
    },
    {
      title: 'Active Delivery Fleet',
      value: stats.deliveryPartners.toLocaleString('en-IN'),
      subtitle: 'Couriers ready for dispatch',
      icon: FiTruck,
      color: 'from-purple-500/20 to-pink-500/20',
      border: 'border-purple-500/30',
      textColor: 'text-purple-400',
    },
  ];

  return (
    <AdminLayout>
      <Head>
        <title>Master Admin Dashboard — Emotion Delivery</title>
      </Head>

      <div className="space-y-8">
        
        {/* Header & Refresh */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold mb-2">
              <FiShield size={13} />
              <span>Executive Command Center</span>
            </div>
            <h1 className="font-display text-3xl font-extrabold text-white">Platform Overview</h1>
            <p className="text-white/50 text-xs mt-1">Real-time telemetry aggregated directly from MongoDB</p>
          </div>
          <button
            onClick={fetchStats}
            disabled={loading}
            className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-semibold flex items-center justify-center gap-2 transition-all disabled:opacity-50 self-start sm:self-auto"
          >
            <FiRefreshCw className={loading ? 'animate-spin' : ''} size={14} />
            <span>Refresh Analytics</span>
          </button>
        </div>

        {/* 4 Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {metricCards.map((c) => {
            const Icon = c.icon;
            return (
              <div
                key={c.title}
                className={`p-6 rounded-3xl bg-gradient-to-br ${c.color} border ${c.border} flex flex-col justify-between backdrop-blur-xl relative overflow-hidden group hover:scale-[1.02] transition-transform`}
              >
                <div className="flex items-start justify-between mb-4">
                  <span className="text-xs font-bold text-white/70 uppercase tracking-wider">{c.title}</span>
                  <div className={`w-10 h-10 rounded-2xl bg-black/20 flex items-center justify-center ${c.textColor}`}>
                    <Icon size={20} />
                  </div>
                </div>
                <div>
                  <div className="font-display text-3xl font-black text-white">{loading ? '—' : c.value}</div>
                  <p className="text-[11px] text-white/50 mt-1">{c.subtitle}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* 2 Column Section: Lazy Loaded Recent Orders & Audit Log */}
        <DashboardPanels stats={stats} loading={loading} />

      </div>
    </AdminLayout>
  );
}
