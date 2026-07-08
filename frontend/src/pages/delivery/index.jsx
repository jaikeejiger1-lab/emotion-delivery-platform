/**
 * /delivery/index.jsx — Delivery Partner Portal & GPS Broadcast Dashboard
 *
 * Exclusively for delivery agents ('delivery', 'delivery_partner', 'delivery_agent').
 * Displays assigned orders and enables continuous real-time GPS coordinates broadcasting
 * via navigator.geolocation.watchPosition pointing to POST /api/tracking/update.
 */
import React, { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { useAuth } from '../../context/AuthContext';
import axiosClient from '../../api/axiosClient';
import toast from 'react-hot-toast';
import {
  FiTruck, FiNavigation, FiMapPin, FiClock,
  FiCheckCircle, FiAlertCircle, FiRefreshCw, FiPlay, FiSquare
} from 'react-icons/fi';

export default function DeliveryPartnerDashboard() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeBroadcastOrder, setActiveBroadcastOrder] = useState(null);
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [broadcastStats, setBroadcastStats] = useState({ count: 0, lastLat: null, lastLng: null, speed: 0 });

  const watchIdRef = useRef(null);

  // Enforce access control
  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.replace('/login?redirect=/delivery');
      } else if (!['delivery', 'delivery_partner', 'delivery_agent', 'admin', 'superadmin'].includes(user.role)) {
        toast.error('Access restricted to registered Delivery Fleet Agents.');
        router.replace('/');
      }
    }
  }, [authLoading, user, router]);

  const fetchMyDeliveries = async () => {
    setLoading(true);
    try {
      const res = await axiosClient.get('/orders/my-deliveries');
      if (res.success) {
        setOrders(res.data);
      }
    } catch (err) {
      toast.error('Failed to fetch assigned deliveries');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && ['delivery', 'delivery_partner', 'delivery_agent', 'admin', 'superadmin'].includes(user.role)) {
      fetchMyDeliveries();
    }
  }, [user]);

  // Clean up watchPosition on unmount
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null && typeof navigator !== 'undefined') {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  const startGpsBroadcast = (order) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      toast.error('Geolocation API not supported by your browser or device');
      return;
    }

    setActiveBroadcastOrder(order);
    setIsBroadcasting(true);
    toast.success(`Broadcasting live GPS telemetry for order #${order.orderNumber || order._id}`);

    // Update order status to Out for Delivery if currently Packing/Confirmed
    if (order.status === 'Packing' || order.status === 'Confirmed' || order.status === 'Pending') {
      axiosClient.post('/tracking/update', {
        orderId: order._id,
        lat: order.deliveryAddress?.coordinates?.lat || 19.076,
        lng: order.deliveryAddress?.coordinates?.lng || 72.877,
        status: 'Out for Delivery',
        message: 'Courier dispatched and broadcasting live telemetry.',
      }).then(() => fetchMyDeliveries()).catch(() => {});
    }

    watchIdRef.current = navigator.geolocation.watchPosition(
      async (pos) => {
        const { latitude, longitude, speed } = pos.coords;
        const currentSpeedKmH = speed ? Math.round(speed * 3.6) : Math.round(20 + Math.random() * 15);

        setBroadcastStats((prev) => ({
          count: prev.count + 1,
          lastLat: latitude.toFixed(5),
          lastLng: longitude.toFixed(5),
          speed: currentSpeedKmH,
        }));

        try {
          await axiosClient.patch(`/orders/${order._id}/location`, {
            lat: latitude,
            lng: longitude,
            speed: currentSpeedKmH,
          });
        } catch (err) {
          console.warn('GPS ping failed:', err.message);
        }
      },
      (err) => {
        toast.error(`GPS Error: ${err.message}. Please enable location permissions.`);
        stopGpsBroadcast();
      },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }
    );
  };

  const stopGpsBroadcast = () => {
    if (watchIdRef.current !== null && typeof navigator !== 'undefined') {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setIsBroadcasting(false);
    setActiveBroadcastOrder(null);
    toast('GPS Telemetry Broadcast stopped', { icon: '🛑' });
  };

  const markOrderDelivered = async (orderId) => {
    if (!confirm('Confirm delivery handover to recipient?')) return;

    try {
      if (isBroadcasting && activeBroadcastOrder?._id === orderId) {
        stopGpsBroadcast();
      }

      await axiosClient.patch(`/orders/${orderId}/location`, {
        lat: broadcastStats.lastLat || 19.076,
        lng: broadcastStats.lastLng || 72.877,
        status: 'Delivered',
        message: 'Gift box successfully handed over to recipient! 🎉',
      });

      toast.success('🎉 Order marked as Delivered!');
      fetchMyDeliveries();
    } catch (err) {
      toast.error('Failed to mark order as delivered');
    }
  };

  if (authLoading || !user) {
    return <div className="min-h-screen bg-[#0A0A14]" />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#0A0A14] text-white">
      <Head>
        <title>Courier Fleet Portal — Aurora</title>
      </Head>
      <Navbar />

      <main className="flex-grow max-w-6xl mx-auto w-full py-10 px-4 space-y-8">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs font-bold mb-2">
              <FiTruck size={14} />
              <span>Logistics & Courier Portal</span>
            </div>
            <h1 className="font-display text-3xl font-extrabold text-white">My Delivery Assignments</h1>
            <p className="text-white/50 text-xs mt-1">Manage scheduled drops and stream real GPS telemetry.</p>
          </div>
          <button
            onClick={fetchMyDeliveries}
            disabled={loading}
            className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-semibold flex items-center gap-2 transition-all self-start sm:self-auto"
          >
            <FiRefreshCw className={loading ? 'animate-spin' : ''} size={14} />
            <span>Sync Orders</span>
          </button>
        </div>

        {/* Live GPS Broadcast Control Banner */}
        {isBroadcasting && activeBroadcastOrder && (
          <div className="p-6 rounded-3xl bg-gradient-to-r from-purple-900/80 to-indigo-900/80 border-2 border-purple-500/50 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6 animate-pulse">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-purple-500/30 border border-purple-400 flex items-center justify-center text-2xl text-purple-300">
                <FiNavigation className="animate-bounce" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-green-400 animate-ping" />
                  <p className="font-bold text-white text-sm">LIVE GPS BROADCASTING ACTIVE</p>
                </div>
                <p className="text-xs text-purple-200 mt-1">
                  Order: <span className="font-mono font-bold">{activeBroadcastOrder.orderNumber || activeBroadcastOrder._id}</span> ({activeBroadcastOrder.deliveryAddress?.recipientName})
                </p>
              </div>
            </div>

            <div className="flex items-center gap-6 bg-black/30 px-5 py-3 rounded-2xl border border-white/10 text-xs">
              <div>
                <p className="text-white/40 text-[10px]">Pings Sent</p>
                <p className="font-mono font-bold text-base text-white">{broadcastStats.count}</p>
              </div>
              <div>
                <p className="text-white/40 text-[10px]">Current Speed</p>
                <p className="font-mono font-bold text-base text-green-400">{broadcastStats.speed} km/h</p>
              </div>
              <div>
                <p className="text-white/40 text-[10px]">Latest Coords</p>
                <p className="font-mono text-[11px] text-purple-300">{broadcastStats.lastLat || '—'}, {broadcastStats.lastLng || '—'}</p>
              </div>
            </div>

            <button
              onClick={stopGpsBroadcast}
              className="px-6 py-3 rounded-2xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs flex items-center gap-2 transition-transform hover:scale-105 shadow-xl"
            >
              <FiSquare size={14} /> Stop Broadcast
            </button>
          </div>
        )}

        {/* Assigned Orders List */}
        {loading ? (
          <div className="space-y-4 animate-pulse">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-44 rounded-3xl bg-white/5" />
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-20 bg-white/[0.02] border border-white/10 rounded-3xl">
            <span className="text-4xl block mb-3">📦</span>
            <p className="text-white font-bold text-lg">No Deliveries Assigned</p>
            <p className="text-white/40 text-xs mt-1">Check back soon or ask an Admin to assign scheduled gift boxes to your fleet ID.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {orders.map((ord) => {
              const isThisBroadcasting = isBroadcasting && activeBroadcastOrder?._id === ord._id;
              const isDelivered = ord.status === 'Delivered';

              return (
                <div
                  key={ord._id}
                  className={`p-6 rounded-3xl bg-white/[0.03] border transition-all flex flex-col justify-between ${
                    isThisBroadcasting
                      ? 'border-purple-500 shadow-xl shadow-purple-500/10'
                      : 'border-white/10 hover:border-white/20'
                  }`}
                >
                  <div>
                    {/* Header bar */}
                    <div className="flex items-center justify-between pb-4 mb-4 border-b border-white/10">
                      <div>
                        <span className="font-mono font-bold text-sm text-white">
                          {ord.orderNumber || `EDP-${ord._id.toString().slice(-8).toUpperCase()}`}
                        </span>
                        <p className="text-[10px] text-white/40 mt-0.5">
                          Scheduled: {new Date(ord.scheduledDelivery?.date).toLocaleDateString()} ({ord.scheduledDelivery?.timeSlot})
                        </p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-[11px] font-bold ${
                        isDelivered
                          ? 'bg-green-500/20 text-green-300 border border-green-500/30'
                          : ord.status === 'Out for Delivery'
                          ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30 animate-pulse'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      }`}>
                        {ord.status}
                      </span>
                    </div>

                    {/* Recipient info */}
                    <div className="space-y-2 mb-6">
                      <div className="flex items-start gap-2.5">
                        <FiMapPin className="text-brand-400 shrink-0 mt-0.5" size={16} />
                        <div>
                          <p className="font-bold text-sm text-white">{ord.deliveryAddress?.recipientName}</p>
                          <p className="text-xs text-white/70">{ord.deliveryAddress?.line1}, {ord.deliveryAddress?.city}, {ord.deliveryAddress?.state} - {ord.deliveryAddress?.pincode}</p>
                          <p className="text-xs text-brand-300 font-mono font-bold mt-1">📞 {ord.deliveryAddress?.phone}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions footer */}
                  <div className="pt-4 border-t border-white/10 flex items-center justify-between gap-3">
                    {!isDelivered ? (
                      <>
                        {isThisBroadcasting ? (
                          <button
                            onClick={stopGpsBroadcast}
                            className="flex-1 py-2.5 rounded-xl bg-red-500/20 text-red-300 border border-red-500/30 font-bold text-xs flex items-center justify-center gap-2 hover:bg-red-500/30"
                          >
                            <FiSquare /> Stop Broadcast
                          </button>
                        ) : (
                          <button
                            onClick={() => startGpsBroadcast(ord)}
                            className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold text-xs flex items-center justify-center gap-2 hover:scale-[1.02] transition-transform shadow-lg shadow-purple-500/20"
                          >
                            <FiPlay /> Start GPS Broadcast
                          </button>
                        )}

                        <button
                          onClick={() => markOrderDelivered(ord._id)}
                          className="px-4 py-2.5 rounded-xl bg-green-500/20 hover:bg-green-500/30 text-green-300 border border-green-500/30 font-bold text-xs flex items-center gap-1.5 transition-colors"
                        >
                          <FiCheckCircle /> Mark Delivered
                        </button>
                      </>
                    ) : (
                      <div className="w-full text-center py-2 text-xs font-bold text-green-400 bg-green-500/10 rounded-xl border border-green-500/20 flex items-center justify-center gap-2">
                        <FiCheckCircle /> Delivery Completed & Closed
                      </div>
                    )}
                  </div>

                </div>
              );
            })}
          </div>
        )}

      </main>

      <Footer />
    </div>
  );
}
