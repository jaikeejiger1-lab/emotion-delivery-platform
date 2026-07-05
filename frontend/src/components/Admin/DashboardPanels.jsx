/**
 * DashboardPanels.jsx — Heavy UI Panels for Admin Overview
 * Separated for dynamic client-side lazy loading via next/dynamic.
 */
import React from 'react';
import Link from 'next/link';
import { FiShoppingBag, FiArrowRight, FiActivity } from 'react-icons/fi';

export default function DashboardPanels({ stats, loading }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Recent Orders Table */}
      <div className="bg-[#14142B] border border-white/10 rounded-3xl p-6 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-white/10">
            <div className="flex items-center gap-2">
              <FiShoppingBag className="text-amber-400" />
              <h3 className="font-bold text-base text-white">Recent Orders</h3>
            </div>
            <Link href="/admin/orders" className="text-xs text-amber-400 hover:underline flex items-center gap-1">
              View All <FiArrowRight size={12} />
            </Link>
          </div>

          {loading ? (
            <div className="space-y-3 py-6 animate-pulse">
              {[1, 2, 3].map((n) => (
                <div key={n} className="h-12 rounded-xl bg-white/5" />
              ))}
            </div>
          ) : stats.recentOrders?.length === 0 ? (
            <p className="text-xs text-white/40 py-8 text-center">No orders recorded in database yet.</p>
          ) : (
            <div className="space-y-3">
              {stats.recentOrders?.map((ord) => (
                <div key={ord._id} className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center justify-between text-xs">
                  <div>
                    <p className="font-bold text-white flex items-center gap-2">
                      <span>{ord.orderNumber || `EDP-${ord._id.toString().slice(-6).toUpperCase()}`}</span>
                      <span className="px-2 py-0.5 rounded-full bg-white/10 text-[10px] text-white/80">{ord.status}</span>
                    </p>
                    <p className="text-[11px] text-white/50 mt-0.5">
                      Customer: {ord.userId?.firstName || 'Anonymous'} ({ord.deliveryAddress?.city || 'India'})
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-white">₹{ord.pricing?.total?.toLocaleString('en-IN') || 0}</p>
                    <p className="text-[10px] text-white/40">{new Date(ord.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Compliance Audit Trail */}
      <div className="bg-[#14142B] border border-white/10 rounded-3xl p-6 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-white/10">
            <div className="flex items-center gap-2">
              <FiActivity className="text-purple-400" />
              <h3 className="font-bold text-base text-white">Security & Audit Logs</h3>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-300 font-mono font-bold">LIVE STREAM</span>
          </div>

          {loading ? (
            <div className="space-y-3 py-6 animate-pulse">
              {[1, 2, 3].map((n) => (
                <div key={n} className="h-12 rounded-xl bg-white/5" />
              ))}
            </div>
          ) : stats.recentAuditLogs?.length === 0 ? (
            <p className="text-xs text-white/40 py-8 text-center">No administrative mutations recorded yet.</p>
          ) : (
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {stats.recentAuditLogs?.map((log) => (
                <div key={log._id} className="p-3 rounded-2xl bg-white/[0.03] border border-white/5 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-purple-400">{log.action}</span>
                    <span className="text-[10px] text-white/40">{new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <p className="text-white/80 leading-relaxed text-[11px]">{log.description || `${log.action} on ${log.targetCollection}`}</p>
                  <p className="text-[10px] text-white/40">
                    By: {log.performedBy?.email || 'Admin'} ({log.performedBy?.role || 'Staff'})
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
