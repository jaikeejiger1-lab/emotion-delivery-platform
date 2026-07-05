/**
 * AdminLayout.jsx — Security & Navigation Wrapper for Master Admin Dashboard
 *
 * Enforces JWT verification and checks if role is 'admin' or 'superadmin'.
 * If unauthorized, redirects to /login or shows 403 Access Denied.
 */
'use client';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import {
  FiGrid, FiUsers, FiShoppingBag, FiShield, FiBox,
  FiLogOut, FiHome, FiAlertTriangle, FiMenu, FiX, FiFileText
} from 'react-icons/fi';

const AdminLayout = ({ children }) => {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.replace('/login?redirect=/admin');
      }
    }
  }, [loading, user, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A14] flex items-center justify-center text-white">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-white/60 text-sm font-semibold tracking-wider uppercase">Verifying Admin Credentials…</p>
        </div>
      </div>
    );
  }

  // Enforce role check
  if (!user || !['admin', 'superadmin'].includes(user.role)) {
    return (
      <div className="min-h-screen bg-[#0A0A14] flex items-center justify-center p-4">
        <div className="bg-[#14142B] border border-red-500/30 rounded-3xl p-8 max-w-md w-full text-center space-y-6 shadow-2xl">
          <div className="w-16 h-16 rounded-2xl bg-red-500/20 text-red-400 flex items-center justify-center mx-auto text-3xl">
            <FiAlertTriangle />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold text-white mb-2">403 Forbidden</h1>
            <p className="text-white/60 text-xs leading-relaxed">
              Your account (<span className="text-white font-mono">{user?.email || 'Guest'}</span>) does not have sufficient security clearance to access the Master Admin Control Panel.
            </p>
          </div>
          <div className="flex flex-col gap-3 pt-2">
            <Link
              href="/"
              className="w-full py-3.5 rounded-xl bg-white/10 text-white font-bold text-xs hover:bg-white/20 transition-all flex items-center justify-center gap-2"
            >
              <FiHome /> Return to Customer Portal
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const navItems = [
    { href: '/admin', label: 'Overview & Stats', icon: FiGrid },
    { href: '/admin/products', label: 'Shop Inventory', icon: FiBox },
    { href: '/admin/users', label: 'User Management', icon: FiUsers },
    { href: '/admin/orders', label: 'Order Control', icon: FiShoppingBag },
    { href: '/admin/reports', label: 'Reports & Export', icon: FiFileText },
  ];

  return (
    <div className="min-h-screen bg-[#0A0A14] text-white flex flex-col md:flex-row">
      
      {/* Mobile Top Bar */}
      <header className="md:hidden bg-[#14142B] border-b border-white/10 px-4 py-3 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-2.5">
          <span className="w-8 h-8 rounded-lg bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center text-sm font-bold text-[#0A0A14]">
            🛡️
          </span>
          <span className="font-display font-bold text-base text-white">Admin Portal</span>
        </div>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white"
        >
          {sidebarOpen ? <FiX size={20} /> : <FiMenu size={20} />}
        </button>
      </header>

      {/* Sidebar Overlay for Mobile */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
        />
      )}

      {/* Sidebar Navigation */}
      <aside className={`fixed md:sticky top-0 left-0 z-50 w-64 h-screen bg-[#14142B] border-r border-white/10 flex flex-col justify-between p-5 transition-transform duration-300 md:translate-x-0 shrink-0 ${
        sidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
      }`}>
        
        <div>
          {/* Brand Header */}
          <div className="flex items-center justify-between pb-6 mb-6 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center text-xl shadow-lg shadow-amber-500/20">
                🛡️
              </div>
              <div>
                <span className="font-display font-extrabold text-base tracking-wide text-white block leading-tight">
                  Hardyy Admin
                </span>
                <span className="text-[10px] uppercase tracking-widest text-amber-400 font-bold block">
                  {user.role} Clearance
                </span>
              </div>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="md:hidden w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white/60 hover:text-white"
              title="Close Admin Sidebar"
            >
              <FiX size={16} />
            </button>
          </div>

          {/* Nav Links */}
          <nav className="space-y-1.5">
            <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest px-3 mb-2">Main Navigation</p>
            {navItems.map(({ href, label, icon: Icon }) => {
              const isActive = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setSidebarOpen(false)}
                  className={`px-3.5 py-3 rounded-xl text-xs font-semibold flex items-center gap-3 transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-300 border border-amber-500/30 shadow-md'
                      : 'text-white/60 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon size={16} className={isActive ? 'text-amber-400' : 'text-white/40'} />
                  <span>{label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User Card & Actions */}
        <div className="pt-6 border-t border-white/10 space-y-3">
          <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center text-xs font-black text-[#0A0A14]">
              {user.firstName?.[0] || 'A'}
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-bold text-white truncate">{user.firstName} {user.lastName}</p>
              <p className="text-[10px] text-white/40 truncate">{user.email}</p>
            </div>
          </div>

          <Link
            href="/"
            className="w-full py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white text-xs font-semibold transition-all flex items-center justify-center gap-2"
          >
            <FiHome size={14} /> Back to App
          </Link>

          <button
            onClick={() => {
              logout();
              router.push('/');
            }}
            className="w-full py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 text-xs font-bold transition-all flex items-center justify-center gap-2"
          >
            <FiLogOut size={14} /> Secure Logout
          </button>
        </div>

      </aside>

      {/* Main Content Area */}
      <main className="flex-grow p-6 md:p-10 max-w-7xl mx-auto w-full overflow-x-hidden">
        {children}
      </main>

    </div>
  );
};

export default AdminLayout;
