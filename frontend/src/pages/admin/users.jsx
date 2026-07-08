/**
 * /admin/users.jsx — User Management Control Page
 *
 * View users, filter by role/status, search by name/email.
 * Perform mutations (Suspend, Ban, Unban, Trigger Password Reset, Delete)
 * that automatically record compliance logs in the AuditLog collection.
 */
import React, { useState, useEffect, useCallback } from 'react';
import Head from 'next/head';
import AdminLayout from '../../components/Admin/AdminLayout';
import axiosClient from '../../api/axiosClient';
import toast from 'react-hot-toast';
import useDebounce from '../../hooks/useDebounce';
import {
  FiUsers, FiSearch, FiShield, FiLock,
  FiSlash, FiCheckCircle, FiTrash2, FiRefreshCw, FiKey
} from 'react-icons/fi';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 400);
  const [roleFilter, setRoleFilter] = useState('all');
  const [bannedFilter, setBannedFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({ total: 0, pages: 1 });
  const [resetModalData, setResetModalData] = useState(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 15 };
      if (debouncedSearch) params.search = debouncedSearch;
      if (roleFilter !== 'all') params.role = roleFilter;
      if (bannedFilter !== 'all') params.banned = bannedFilter;

      const res = await axiosClient.get('/admin/users', { params });
      if (res.success) {
        setUsers(res.data);
        if (res.meta) setMeta(res.meta);
      }
    } catch (err) {
      toast.error('Failed to load user directory');
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, roleFilter, bannedFilter]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
  };

  const handleToggleSuspend = async (user) => {
    const actionName = user.isBanned ? 'Unban' : 'Suspend';
    const reason = user.isBanned ? '' : prompt(`Enter reason for suspending ${user.email}:`, 'Policy violation');
    if (!user.isBanned && reason === null) return; // cancelled

    try {
      const res = await axiosClient.patch(`/admin/users/${user._id}/ban`, {
        banned: !user.isBanned,
        reason: reason || 'Administrative action',
      });

      if (res.success) {
        toast.success(`User ${actionName}ed successfully & Audit Log created`);
        fetchUsers();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || `Failed to ${actionName} user`);
    }
  };

  const handleTriggerPasswordReset = async (user) => {
    if (!confirm(`Trigger an immediate password reset for ${user.email}?`)) return;

    try {
      const res = await axiosClient.post(`/admin/users/${user._id}/reset-password`);
      if (res.success) {
        setResetModalData({ user, tempPassword: res.tempPassword });
        toast.success('Password reset triggered & logged in Audit Trail');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to trigger reset');
    }
  };

  const handleDeleteUser = async (user) => {
    if (!confirm(`CRITICAL WARNING: Permanently delete account for ${user.email}? This action cannot be undone.`)) return;

    try {
      const res = await axiosClient.delete(`/admin/users/${user._id}`);
      if (res.success) {
        toast.success('User deleted permanently');
        fetchUsers();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete user');
    }
  };

  return (
    <AdminLayout>
      <Head>
        <title>User Management — Master Admin Portal</title>
      </Head>

      <div className="space-y-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-bold mb-2">
              <FiUsers size={13} />
              <span>Identity & Access Control</span>
            </div>
            <h1 className="font-display text-3xl font-extrabold text-white">User Management</h1>
            <p className="text-white/50 text-xs mt-1">Manage accounts, assign roles, enforce suspensions, and trigger OTP resets.</p>
          </div>
        </div>

        {/* Filters & Search Form */}
        <form onSubmit={handleSearchSubmit} className="bg-[#14142B] border border-white/10 rounded-3xl p-4 flex flex-wrap items-center justify-between gap-4">
          
          <div className="flex flex-wrap items-center gap-3">
            {/* Role filter */}
            <select
              value={roleFilter}
              onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
              className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
            >
              <option value="all" className="bg-[#14142B]">All Roles</option>
              <option value="customer" className="bg-[#14142B]">Customers</option>
              <option value="delivery_partner" className="bg-[#14142B]">Delivery Partners</option>
              <option value="staff" className="bg-[#14142B]">Staff</option>
              <option value="admin" className="bg-[#14142B]">Admins</option>
            </select>

            {/* Banned filter */}
            <select
              value={bannedFilter}
              onChange={(e) => { setBannedFilter(e.target.value); setPage(1); }}
              className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
            >
              <option value="all" className="bg-[#14142B]">All Account Statuses</option>
              <option value="false" className="bg-[#14142B]">Active Accounts</option>
              <option value="true" className="bg-[#14142B]">Suspended / Banned</option>
            </select>
          </div>

          {/* Search bar */}
          <div className="flex items-center gap-2 w-full sm:w-80">
            <div className="relative flex-grow">
              <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" size={15} />
              <input
                type="text"
                placeholder="Search name, email, or phone..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-3 py-2 text-xs text-white placeholder-white/40 focus:outline-none focus:border-amber-500"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-amber-500 text-[#0A0A14] font-bold text-xs hover:bg-amber-400 transition-colors"
            >
              Search
            </button>
          </div>

        </form>

        {/* Users Table */}
        <div className="bg-[#14142B] border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10 bg-white/[0.02] text-[11px] font-bold text-white/50 uppercase tracking-widest">
                  <th className="py-4 px-6">User Identity</th>
                  <th className="py-4 px-6">Role</th>
                  <th className="py-4 px-6">Status</th>
                  <th className="py-4 px-6">Registered On</th>
                  <th className="py-4 px-6 text-right">Administrative Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-xs text-white/80">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-white/40 animate-pulse">
                      Loading user database…
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-white/40">
                      No matching user records found.
                    </td>
                  </tr>
                ) : (
                  users.map((u) => (
                    <tr key={u._id} className="hover:bg-white/[0.02] transition-colors">
                      
                      {/* Identity */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-500 to-purple-600 flex items-center justify-center font-bold text-white shrink-0">
                            {u.firstName?.[0] || 'U'}
                          </div>
                          <div>
                            <p className="font-bold text-white">{u.firstName} {u.lastName}</p>
                            <p className="text-[11px] text-white/50">{u.email}</p>
                            {u.phone && <p className="text-[10px] text-white/30 font-mono">{u.phone}</p>}
                          </div>
                        </div>
                      </td>

                      {/* Role */}
                      <td className="py-4 px-6">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          u.role === 'superadmin' || u.role === 'admin'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : u.role === 'delivery_partner'
                            ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                            : 'bg-white/10 text-white/80'
                        }`}>
                          {u.role}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-4 px-6">
                        {u.isBanned ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-500/20 text-red-300 border border-red-500/30 text-[10px] font-bold">
                            <FiSlash size={12} /> Suspended
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-500/20 text-green-300 border border-green-500/30 text-[10px] font-bold">
                            <FiCheckCircle size={12} /> Active
                          </span>
                        )}
                        {u.isBanned && u.bannedReason && (
                          <p className="text-[10px] text-red-400/70 mt-1 italic max-w-xs truncate">{u.bannedReason}</p>
                        )}
                      </td>

                      {/* Registered Date */}
                      <td className="py-4 px-6 text-white/50">
                        {new Date(u.createdAt).toLocaleDateString()}
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          
                          {/* Suspend / Unban */}
                          <button
                            onClick={() => handleToggleSuspend(u)}
                            title={u.isBanned ? 'Unban Account' : 'Suspend Account'}
                            className={`px-3 py-1.5 rounded-xl text-[11px] font-bold border transition-colors flex items-center gap-1 ${
                              u.isBanned
                                ? 'bg-green-500/10 border-green-500/30 text-green-400 hover:bg-green-500/20'
                                : 'bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/20'
                            }`}
                          >
                            <FiSlash size={13} />
                            <span>{u.isBanned ? 'Unban' : 'Suspend'}</span>
                          </button>

                          {/* Trigger Password Reset */}
                          <button
                            onClick={() => handleTriggerPasswordReset(u)}
                            title="Trigger Password Reset"
                            className="px-3 py-1.5 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-400 hover:bg-blue-500/20 text-[11px] font-bold transition-colors flex items-center gap-1"
                          >
                            <FiKey size={13} />
                            <span>Reset Pwd</span>
                          </button>

                          {/* Delete */}
                          <button
                            onClick={() => handleDeleteUser(u)}
                            title="Delete User"
                            className="p-2 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 transition-colors"
                          >
                            <FiTrash2 size={14} />
                          </button>

                        </div>
                      </td>

                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          <div className="px-6 py-4 border-t border-white/10 flex items-center justify-between text-xs text-white/50 bg-white/[0.01]">
            <span>Showing Page {page} of {meta.pages || 1} ({meta.total} total accounts)</span>
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

      {/* Temporary Reset Password Modal */}
      {resetModalData && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-[#14142B] border border-blue-500/40 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="font-bold text-lg text-white flex items-center gap-2">
                <FiKey className="text-blue-400" /> Password Reset Generated
              </h3>
            </div>
            <p className="text-xs text-white/70 leading-relaxed">
              A temporary password has been issued for <span className="font-bold text-white">{resetModalData.user.email}</span> and recorded in the system audit logs.
            </p>
            <div className="p-4 rounded-2xl bg-black/40 border border-white/10 text-center">
              <p className="text-[10px] text-white/40 uppercase tracking-widest mb-1">Temporary Password</p>
              <p className="font-mono text-xl font-bold text-brand-400 select-all">{resetModalData.tempPassword}</p>
            </div>
            <p className="text-[11px] text-amber-400/80 italic">
              Instruct the user to log in with this credential and immediately update their password.
            </p>
            <button
              onClick={() => setResetModalData(null)}
              className="w-full py-3 rounded-xl bg-blue-500 text-white font-bold text-xs hover:bg-blue-600 transition-colors"
            >
              Done & Close
            </button>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
