/**
 * /admin/orders.jsx — Master Order Management Page
 *
 * View orders, filter by status, change status (Pending -> Confirmed -> Packing -> Out for Delivery -> Delivered),
 * and assign delivery partners from registered courier accounts. Every mutation triggers an AuditLog entry.
 */
import React, { useState, useEffect, useCallback } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import AdminLayout from '../../components/Admin/AdminLayout';
import axiosClient from '../../api/axiosClient';
import toast from 'react-hot-toast';
import useDebounce from '../../hooks/useDebounce';
import {
  FiShoppingBag, FiTruck, FiUser, FiMapPin,
  FiClock, FiCheck, FiRefreshCw, FiExternalLink, FiSearch
} from 'react-icons/fi';

const STATUS_OPTIONS = ['Pending', 'Confirmed', 'Packing', 'Out for Delivery', 'Delivered', 'Cancelled'];

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [deliveryPartners, setDeliveryPartners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 400);
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({ total: 0, pages: 1 });
  const [assignModalOrder, setAssignModalOrder] = useState(null);
  const [selectedPartnerId, setSelectedPartnerId] = useState('');

  const fetchOrdersAndPartners = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 15 };
      if (statusFilter !== 'all') params.status = statusFilter;
      if (debouncedSearch) params.search = debouncedSearch;

      const [ordRes, partRes] = await Promise.all([
        axiosClient.get('/admin/orders', { params }),
        axiosClient.get('/admin/delivery-partners'),
      ]);

      if (ordRes.success) {
        setOrders(ordRes.data);
        if (ordRes.meta) setMeta(ordRes.meta);
      }
      if (partRes.success) {
        setDeliveryPartners(partRes.data);
      }
    } catch (err) {
      toast.error('Failed to load platform orders');
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, debouncedSearch]);

  useEffect(() => {
    fetchOrdersAndPartners();
  }, [fetchOrdersAndPartners]);

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      const res = await axiosClient.patch(`/admin/orders/${orderId}/status`, { status: newStatus });
      if (res.success) {
        toast.success(`Status updated to ${newStatus} & recorded in Audit Log`);
        setOrders(orders.map((o) => (o._id === orderId ? res.data : o)));
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update order status');
    }
  };

  const handleAssignSubmit = async (e) => {
    e.preventDefault();
    if (!selectedPartnerId) {
      toast.error('Please select a delivery partner');
      return;
    }

    try {
      const res = await axiosClient.patch(`/admin/orders/${assignModalOrder._id}/assign`, {
        deliveryPartnerId: selectedPartnerId,
      });

      if (res.success) {
        toast.success('Delivery partner assigned successfully & Audit Log generated');
        setAssignModalOrder(null);
        setSelectedPartnerId('');
        fetchOrdersAndPartners();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to assign delivery partner');
    }
  };

  return (
    <AdminLayout>
      <Head>
        <title>Order Management — Master Admin Portal</title>
      </Head>

      <div className="space-y-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold mb-2">
              <FiShoppingBag size={13} />
              <span>Fulfilment & Logistics Engine</span>
            </div>
            <h1 className="font-display text-3xl font-extrabold text-white">Order Control Board</h1>
            <p className="text-white/50 text-xs mt-1">Mutate order stages and dispatch live delivery partners.</p>
          </div>
          <button
            onClick={fetchOrdersAndPartners}
            disabled={loading}
            className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-semibold flex items-center justify-center gap-2 transition-all disabled:opacity-50"
          >
            <FiRefreshCw className={loading ? 'animate-spin' : ''} size={14} />
            <span>Refresh Board</span>
          </button>
        </div>

        {/* Filter Bar */}
        <div className="bg-[#14142B] border border-white/10 rounded-3xl p-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0 scroll-hide">
            <button
              onClick={() => { setStatusFilter('all'); setPage(1); }}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                statusFilter === 'all'
                  ? 'bg-amber-500 text-[#0A0A14] font-bold shadow-lg shadow-amber-500/20'
                  : 'bg-white/5 text-white/60 hover:text-white hover:bg-white/10'
              }`}
            >
              All Orders
            </button>
            {STATUS_OPTIONS.map((st) => (
              <button
                key={st}
                onClick={() => { setStatusFilter(st); setPage(1); }}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  statusFilter === st
                    ? 'bg-amber-500 text-[#0A0A14] font-bold shadow-lg shadow-amber-500/20'
                    : 'bg-white/5 text-white/60 hover:text-white hover:bg-white/10'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        {/* Orders Table */}
        <div className="bg-[#14142B] border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10 bg-white/[0.02] text-[11px] font-bold text-white/50 uppercase tracking-widest">
                  <th className="py-4 px-6">Order ID & Date</th>
                  <th className="py-4 px-6">Customer & Recipient</th>
                  <th className="py-4 px-6">Order Total</th>
                  <th className="py-4 px-6">Assigned Courier</th>
                  <th className="py-4 px-6">Stage Status</th>
                  <th className="py-4 px-6 text-right">Dispatch Control</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-xs text-white/80">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-white/40 animate-pulse">
                      Loading order records…
                    </td>
                  </tr>
                ) : orders.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-white/40">
                      No matching orders found.
                    </td>
                  </tr>
                ) : (
                  orders.map((o) => (
                    <tr key={o._id} className="hover:bg-white/[0.02] transition-colors">
                      
                      {/* ID & Date */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-white text-sm">
                            {o.orderNumber || `EDP-${o._id.toString().slice(-8).toUpperCase()}`}
                          </span>
                          <Link href={`/track/${o._id}`} target="_blank" className="text-white/40 hover:text-white">
                            <FiExternalLink size={13} />
                          </Link>
                        </div>
                        <p className="text-[10px] text-white/40 mt-1">
                          {new Date(o.createdAt).toLocaleString()}
                        </p>
                      </td>

                      {/* Customer & Recipient */}
                      <td className="py-4 px-6">
                        <p className="font-bold text-white">{o.deliveryAddress?.recipientName || 'Recipient'}</p>
                        <p className="text-[11px] text-white/50">{o.deliveryAddress?.city}, {o.deliveryAddress?.state}</p>
                        <p className="text-[10px] text-white/30 font-mono mt-0.5">By: {o.userId?.email || 'Guest'}</p>
                      </td>

                      {/* Total */}
                      <td className="py-4 px-6 font-bold text-sm text-brand-300">
                        ₹{o.pricing?.total?.toLocaleString('en-IN') || 0}
                      </td>

                      {/* Courier */}
                      <td className="py-4 px-6">
                        {o.tracking?.agentId || o.tracking?.agentName ? (
                          <div className="flex items-center gap-2">
                            <span className="w-6 h-6 rounded-md bg-purple-500/20 text-purple-300 flex items-center justify-center text-xs">
                              <FiTruck size={12} />
                            </span>
                            <div>
                              <p className="font-bold text-white text-xs">{o.tracking.agentName || 'Courier'}</p>
                              {o.tracking.agentPhone && <p className="text-[10px] text-white/40 font-mono">{o.tracking.agentPhone}</p>}
                            </div>
                          </div>
                        ) : (
                          <span className="text-[11px] text-white/30 italic">Unassigned</span>
                        )}
                      </td>

                      {/* Status Dropdown */}
                      <td className="py-4 px-6">
                        <select
                          value={o.status}
                          onChange={(e) => handleStatusChange(o._id, e.target.value)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold border focus:outline-none cursor-pointer ${
                            o.status === 'Delivered'
                              ? 'bg-green-500/20 border-green-500/30 text-green-300'
                              : o.status === 'Out for Delivery'
                              ? 'bg-purple-500/20 border-purple-500/30 text-purple-300'
                              : o.status === 'Cancelled'
                              ? 'bg-red-500/20 border-red-500/30 text-red-300'
                              : 'bg-amber-500/20 border-amber-500/30 text-amber-300'
                          }`}
                        >
                          {STATUS_OPTIONS.map((st) => (
                            <option key={st} value={st} className="bg-[#14142B] text-white">
                              {st}
                            </option>
                          ))}
                        </select>
                      </td>

                      {/* Dispatch Control */}
                      <td className="py-4 px-6 text-right">
                        <button
                          onClick={() => {
                            setAssignModalOrder(o);
                            setSelectedPartnerId(o.tracking?.agentId?._id || o.tracking?.agentId || '');
                          }}
                          className="px-3.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-semibold text-xs transition-colors flex items-center gap-1.5 ml-auto"
                        >
                          <FiTruck className="text-purple-400" size={14} />
                          <span>Assign Partner</span>
                        </button>
                      </td>

                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="px-6 py-4 border-t border-white/10 flex items-center justify-between text-xs text-white/50 bg-white/[0.01]">
            <span>Showing Page {page} of {meta.pages || 1} ({meta.total} total orders)</span>
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-white disabled:opacity-30 hover:bg-white/10"
              >
                Previous
              </button>
              <button
                disabled={page >= meta.pages}
                onClick={() => setPage(page + 1)}
                className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-white disabled:opacity-30 hover:bg-white/10"
              >
                Next
              </button>
            </div>
          </div>
        </div>

      </div>

      {/* Assign Partner Modal */}
      {assignModalOrder && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <form onSubmit={handleAssignSubmit} className="bg-[#14142B] border border-purple-500/40 rounded-3xl p-6 max-w-md w-full space-y-5 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="font-bold text-lg text-white flex items-center gap-2">
                <FiTruck className="text-purple-400" /> Dispatch Delivery Agent
              </h3>
            </div>

            <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 text-xs text-white/80 space-y-1">
              <p><span className="text-white/40">Order:</span> <span className="font-mono font-bold text-white">{assignModalOrder.orderNumber || assignModalOrder._id}</span></p>
              <p><span className="text-white/40">Recipient:</span> {assignModalOrder.deliveryAddress?.recipientName} ({assignModalOrder.deliveryAddress?.city})</p>
              <p><span className="text-white/40">Current Status:</span> {assignModalOrder.status}</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-white/60 mb-2">Select Registered Delivery Partner</label>
              {deliveryPartners.length === 0 ? (
                <p className="text-xs text-red-400 p-3 bg-red-500/10 rounded-xl border border-red-500/20">
                  No registered users with role &apos;delivery_partner&apos; found. Please register one first.
                </p>
              ) : (
                <select
                  value={selectedPartnerId}
                  onChange={(e) => setSelectedPartnerId(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-purple-500"
                >
                  <option value="" className="bg-[#14142B]">-- Select Courier --</option>
                  {deliveryPartners.map((p) => (
                    <option key={p._id} value={p._id} className="bg-[#14142B]">
                      {p.firstName} {p.lastName} ({p.phone || p.email})
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setAssignModalOrder(null)}
                className="w-full py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold text-xs transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={deliveryPartners.length === 0}
                className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white font-bold text-xs transition-colors shadow-lg shadow-purple-500/25"
              >
                Confirm Assignment
              </button>
            </div>

          </form>
        </div>
      )}
    </AdminLayout>
  );
}
