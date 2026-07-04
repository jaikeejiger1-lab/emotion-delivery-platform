/**
 * OrderTracker.jsx — Real-time Customer Tracking View
 *
 * Fetches real MongoDB tracking status & GPS coordinates from GET /api/tracking/:orderId.
 * Polls continuously and listens for live telemetry broadcasts.
 */
'use client';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { FiMapPin, FiClock, FiPhone, FiPackage, FiCheck, FiTruck, FiRefreshCw, FiNavigation } from 'react-icons/fi';
import axiosClient from '../../api/axiosClient';
import dynamic from 'next/dynamic';

const LeafletMap = dynamic(() => import('../Tracking/LeafletMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full min-h-[420px] rounded-3xl bg-[#14142B] border border-white/15 flex flex-col items-center justify-center p-6 text-center animate-pulse">
      <div className="w-16 h-16 rounded-2xl bg-brand-500/20 text-brand-400 flex items-center justify-center text-3xl mb-4">
        🛰️
      </div>
      <p className="font-bold text-white text-base">Initializing Live Radar...</p>
      <p className="text-white/50 text-xs mt-1">Connecting to OpenStreetMap telemetry network</p>
    </div>
  ),
});

const STATUS_CONFIG = {
  Pending:          { label: 'Order Confirmed',      icon: FiPackage, color: 'text-blue-400',   bg: 'bg-blue-500/20',   border: 'border-blue-500/40' },
  Confirmed:        { label: 'Crafting Your Gift',   icon: '✨',       color: 'text-purple-400', bg: 'bg-purple-500/20', border: 'border-purple-500/40' },
  Packing:          { label: 'Quality Check & Packing', icon: FiCheck, color: 'text-yellow-400', bg: 'bg-yellow-500/20', border: 'border-yellow-500/40' },
  'Out for Delivery': { label: 'Out for Delivery 🚀', icon: FiTruck,    color: 'text-green-400',  bg: 'bg-green-500/20',  border: 'border-green-500/40' },
  Delivered:        { label: '🎉 Delivered Successfully!', icon: FiCheck, color: 'text-green-400',  bg: 'bg-green-500/20',  border: 'border-green-500/40' },
  Cancelled:        { label: 'Order Cancelled',      icon: '⚠️',       color: 'text-red-400',    bg: 'bg-red-500/20',    border: 'border-red-500/40' },
  order_placed:     { label: 'Order Placed',         icon: FiPackage, color: 'text-blue-400',   bg: 'bg-blue-500/20',   border: 'border-blue-500/40' },
  out_for_delivery: { label: 'Out for Delivery',     icon: FiTruck,    color: 'text-green-400',  bg: 'bg-green-500/20',  border: 'border-green-500/40' },
  delivered:        { label: '🎉 Delivered!',        icon: FiCheck,    color: 'text-green-400',  bg: 'bg-green-500/20',  border: 'border-green-500/40' },
};


const TimelineEvent = ({ event, isLatest }) => {
  const cfg = STATUS_CONFIG[event.status] || {};
  return (
    <div className="flex gap-4">
      <div className="flex flex-col items-center">
        <div className={`w-9 h-9 rounded-xl border flex items-center justify-center text-sm shrink-0 ${
          isLatest ? `${cfg.bg || 'bg-purple-500/20'} ${cfg.border || 'border-purple-500/40'} ${cfg.color || 'text-purple-300'}` : 'bg-white/5 border-white/10 text-white/30'
        }`}>
          {typeof cfg.icon === 'string' ? cfg.icon : cfg.icon ? <cfg.icon size={16} /> : '•'}
        </div>
        {!isLatest && <div className="w-px flex-1 bg-white/[0.08] mt-1" />}
      </div>
      <div className="pb-6">
        <p className={`font-bold text-sm ${isLatest ? 'text-white' : 'text-white/50'}`}>
          {cfg.label || event.status}
        </p>
        <p className="text-white/40 text-xs mt-0.5">{event.message}</p>
        {event.timestamp && (
          <p className="text-white/20 text-[10px] mt-1 font-mono">
            {new Date(event.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </p>
        )}
      </div>
    </div>
  );
};

const OrderTracker = ({ orderId }) => {
  const [trackingData, setTrackingData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchTracking = useCallback(async () => {
    if (!orderId) return;
    try {
      // Fetch from real tracking API
      const res = await axiosClient.get(`/tracking/${orderId}`);
      if (res.success && res.data) {
        setTrackingData(res.data);
        setLastUpdated(new Date());
      }
    } catch {
      // Fallback to orders/tracking if direct lookup is initializing
      try {
        const fallback = await axiosClient.get(`/orders/tracking/${orderId}`);
        if (fallback.success) setTrackingData(fallback.data);
      } catch {}
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    fetchTracking();
    // Poll every 10 seconds for real-time telemetry updates
    const interval = setInterval(fetchTracking, 10000);
    return () => clearInterval(interval);
  }, [fetchTracking]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-16 px-4 space-y-6 animate-pulse">
        <div className="h-10 w-64 rounded-2xl bg-white/5" />
        <div className="h-80 rounded-3xl bg-white/5" />
      </div>
    );
  }

  if (!trackingData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6">
        <div className="w-16 h-16 rounded-2xl bg-red-500/20 text-red-400 flex items-center justify-center text-3xl mb-4">
          ⚠️
        </div>
        <h3 className="font-bold text-xl text-white">Order Tracking Unavailable</h3>
        <p className="text-white/50 text-xs mt-1 max-w-md">
          Could not locate tracking telemetry for ID #{orderId}. Please verify your order number.
        </p>
      </div>
    );
  }

  const { status, scheduledDelivery, orderNumber, currentCoordinates, estimatedArrival, agentName, agentPhone, speed, events, deliveryAddress } = trackingData;
  const currentCfg = STATUS_CONFIG[status] || STATUS_CONFIG['Pending'];

  return (
    <div className="min-h-screen py-10 px-4 max-w-5xl mx-auto space-y-8">
      
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/10 border border-brand-500/30 text-brand-300 text-xs font-bold mb-2">
            <FiMapPin size={13} />
            <span>Real-time GPS Telemetry Stream</span>
          </div>
          <h1 className="font-display text-3xl font-extrabold text-white">{orderNumber || `Order #${orderId}`}</h1>
          {lastUpdated && (
            <p className="text-white/40 text-xs mt-1 flex items-center gap-2">
              <span>Updated {lastUpdated.toLocaleTimeString()}</span>
              {speed > 0 && <span className="text-green-400 font-mono font-bold">• Courier moving at {speed} km/h</span>}
            </p>
          )}
        </div>
        <button
          onClick={fetchTracking}
          className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-semibold flex items-center justify-center gap-2 transition-all self-start sm:self-auto"
        >
          <FiRefreshCw size={14} />
          <span>Sync Radar</span>
        </button>
      </motion.div>

      {/* Status Banner */}
      <div className={`p-6 rounded-3xl bg-gradient-to-r from-[#14142B] to-[#1E1E3F] border ${currentCfg.border || 'border-white/10'} shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6`}>
        <div className="flex items-center gap-4">
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shrink-0 ${currentCfg.bg || 'bg-white/10'}`}>
            {typeof currentCfg.icon === 'string' ? currentCfg.icon : currentCfg.icon ? <currentCfg.icon className={currentCfg.color} /> : '📦'}
          </div>
          <div>
            <p className={`text-xl font-bold ${currentCfg.color || 'text-white'}`}>{currentCfg.label || status}</p>
            {scheduledDelivery?.date && (
              <p className="text-white/50 text-xs mt-0.5">
                Scheduled Drop: {new Date(scheduledDelivery.date).toLocaleDateString()} ({scheduledDelivery.timeSlot})
              </p>
            )}
          </div>
        </div>

        {estimatedArrival && (
          <div className="bg-black/30 px-5 py-3 rounded-2xl border border-white/10 text-right shrink-0">
            <p className="text-white/40 text-[10px] uppercase tracking-widest font-bold">Estimated Arrival</p>
            <p className="text-white font-mono font-bold text-lg flex items-center gap-2 mt-0.5">
              <FiClock className="text-amber-400" size={16} />
              <span>{new Date(estimatedArrival).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </p>
          </div>
        )}
      </div>

      {/* Map & Timeline Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Radar Embed */}
        <div className="lg:col-span-2 h-[420px]">
          <LeafletMap
            agentCoords={currentCoordinates}
            destCoords={deliveryAddress?.coordinates}
            agentName={agentName}
            agentPhone={agentPhone}
            recipientName={deliveryAddress?.recipientName}
            recipientAddress={deliveryAddress ? `${deliveryAddress.line1}, ${deliveryAddress.city}` : ''}
          />
        </div>

        {/* Courier Info & Events */}
        <div className="space-y-6">
          
          {/* Assigned Agent Card */}
          <div className="p-6 rounded-3xl bg-[#14142B] border border-white/10 space-y-4">
            <p className="text-white/40 text-[10px] uppercase tracking-widest font-bold">Assigned Delivery Partner</p>
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 to-pink-500 flex items-center justify-center font-bold text-lg text-white">
                {agentName?.[0] || '🚚'}
              </div>
              <div className="overflow-hidden">
                <p className="font-bold text-white text-sm truncate">{agentName || 'Dispatched Courier'}</p>
                {agentPhone ? (
                  <a href={`tel:${agentPhone}`} className="text-brand-400 hover:text-brand-300 text-xs font-mono flex items-center gap-1.5 mt-1">
                    <FiPhone size={12} /> {agentPhone}
                  </a>
                ) : (
                  <p className="text-white/30 text-xs italic mt-0.5">Contact via Dispatch</p>
                )}
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div className="p-6 rounded-3xl bg-[#14142B] border border-white/10 max-h-[290px] overflow-y-auto">
            <p className="text-white/40 text-[10px] uppercase tracking-widest font-bold mb-5">Telemetry Audit Trail</p>
            <div className="space-y-1">
              {[...(events || [])].reverse().map((ev, idx) => (
                <TimelineEvent key={idx} event={ev} isLatest={idx === 0} />
              ))}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};

export default OrderTracker;
