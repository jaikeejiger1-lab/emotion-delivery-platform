/**
 * Navbar.jsx — Glassmorphic Navigation Header with Dynamic Communications Bell
 */
'use client';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import axiosClient from '../api/axiosClient';
import toast from 'react-hot-toast';
import {
  FiHome, FiShoppingBag, FiBox, FiHeart, FiShoppingCart,
  FiBell, FiUser, FiLogOut, FiShield, FiCheck, FiTruck, FiSun, FiMoon,
  FiMenu, FiX
} from 'react-icons/fi';

const Navbar = () => {
  const { itemCount } = useCart();
  const { user, logout, isAuthenticated } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loadingNotifs, setLoadingNotifs] = useState(false);

  const [theme, setTheme] = useState('dark');
  const [mounted, setMounted] = useState(false);
  const navRef = useRef(null);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem('edp_theme') || 'dark';
    setTheme(saved);
    if (saved === 'light') {
      document.documentElement.classList.add('light-theme');
    } else {
      document.documentElement.classList.remove('light-theme');
    }
  }, []);

  // Click outside listener for all dropdowns & mobile menu
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (navRef.current && !navRef.current.contains(event.target)) {
        setShowUserMenu(false);
        setShowNotifications(false);
        setMobileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, []);

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    localStorage.setItem('edp_theme', next);
    if (next === 'light') {
      document.documentElement.classList.add('light-theme');
      toast('Switched to Light Theme ☀️');
    } else {
      document.documentElement.classList.remove('light-theme');
      toast('Switched to Dark Theme 🌙');
    }
  };

  const navLinks = [
    { href: '/', label: 'Home', icon: FiHome },
    { href: '/shop', label: 'Shop Catalog', icon: FiShoppingBag },
    { href: '/build', label: 'Build Gift Box', icon: FiBox },
    { href: '/vault', label: 'Memory Vault', icon: FiHeart },
    { href: '/checkout', label: 'Checkout', icon: FiShoppingCart, badge: itemCount },
  ];

  // Fetch real notifications from Mongoose API
  const fetchNotifications = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const res = await axiosClient.get('/notifications?limit=15');
      if (res.success) {
        setNotifications(res.data || []);
        setUnreadCount(res.unreadCount || 0);
      }
    } catch {
      // Silently catch unauth or offline
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 30000);
      return () => clearInterval(interval);
    } else {
      setNotifications([]);
      setUnreadCount(0);
    }
  }, [isAuthenticated, fetchNotifications]);

  const handleMarkAllRead = async () => {
    if (unreadCount === 0) return;
    try {
      await axiosClient.patch('/notifications/read-all');
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      toast.success('All notifications marked as read');
    } catch {
      toast.error('Failed to update notification status');
    }
  };

  const handleNotificationClick = async (notif) => {
    setShowNotifications(false);
    if (!notif.isRead) {
      try {
        await axiosClient.patch(`/notifications/read/${notif._id}`);
        setUnreadCount((c) => Math.max(0, c - 1));
        setNotifications((prev) =>
          prev.map((n) => (n._id === notif._id ? { ...n, isRead: true } : n))
        );
      } catch {}
    }
    if (notif.actionUrl) {
      router.push(notif.actionUrl);
    }
  };

  return (
    <header ref={navRef} className="sticky top-0 z-50 bg-[#0A0A14]/85 backdrop-blur-xl border-b border-white/10 px-4 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-purple-600 flex items-center justify-center text-xl shadow-lg shadow-brand-500/30 group-hover:scale-105 transition-transform duration-300">
            🎁
          </div>
          <div>
            <span className="font-display text-xl font-bold bg-gradient-to-r from-white via-pink-200 to-pink-400 bg-clip-text text-transparent">
              Emotion Delivery
            </span>
            <span className="block text-[10px] text-white/40 tracking-widest uppercase">
              SaaS Platform
            </span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-1 bg-white/[0.03] p-1.5 rounded-2xl border border-white/10">
          {navLinks.map(({ href, label, icon: Icon, badge }) => {
            const isActive = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={`relative px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all duration-200 ${
                  isActive
                    ? 'bg-gradient-to-r from-brand-500/20 to-purple-500/20 text-white border border-brand-500/40 shadow-sm'
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon className={isActive ? 'text-brand-400' : 'text-white/50'} size={15} />
                {label}
                {badge > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-brand-500 text-white text-[10px] font-bold flex items-center justify-center border-2 border-[#0A0A14] animate-pulse">
                    {badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          
          {/* Dynamic Notifications Dropdown */}
          {isAuthenticated && (
            <div className="relative">
              <button
                onClick={() => {
                  setShowNotifications(!showNotifications);
                  if (!showNotifications) {
                    setShowUserMenu(false);
                    fetchNotifications();
                  }
                }}
                className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/80 hover:text-white hover:bg-white/10 transition-colors relative"
                title="Notifications"
              >
                <FiBell size={18} />
                {unreadCount > 0 && (
                  <>
                    <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-brand-500 animate-ping opacity-75" />
                    <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-brand-500 text-white text-[10px] font-extrabold flex items-center justify-center border-2 border-[#0A0A14]">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  </>
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-[#14142B] border border-white/15 rounded-3xl p-4 shadow-2xl z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/10">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-white">Notifications</span>
                      {unreadCount > 0 && (
                        <span className="px-2 py-0.5 rounded-full bg-brand-500/20 border border-brand-500/40 text-brand-300 text-[10px] font-bold">
                          {unreadCount} new
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {unreadCount > 0 && (
                        <button
                          onClick={handleMarkAllRead}
                          className="text-xs text-brand-400 font-semibold hover:text-brand-300 transition-colors flex items-center gap-1"
                        >
                          <FiCheck size={12} /> Mark read
                        </button>
                      )}
                      <button
                        onClick={() => setShowNotifications(false)}
                        className="text-white/40 hover:text-white p-1 rounded-lg transition-colors ml-1"
                        title="Close Notifications"
                      >
                        <FiX size={16} />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                    {notifications.length === 0 ? (
                      <div className="text-center py-8 text-white/40 text-xs">
                        <span className="text-2xl block mb-1">🔔</span>
                        No notifications right now
                      </div>
                    ) : (
                      notifications.map((n) => (
                        <div
                          key={n._id}
                          onClick={() => handleNotificationClick(n)}
                          className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 ${
                            n.isRead
                              ? 'bg-white/[0.02] border-white/5 text-white/60 hover:bg-white/5'
                              : 'bg-brand-500/10 border-brand-500/30 text-white hover:bg-brand-500/15 shadow-sm'
                          }`}
                        >
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 text-base ${
                            n.type === 'order_update' ? 'bg-purple-500/20 text-purple-300' :
                            n.type === 'delivery' ? 'bg-green-500/20 text-green-300' : 'bg-brand-500/20 text-brand-300'
                          }`}>
                            {n.type === 'order_update' ? '📦' : n.type === 'delivery' ? '🚀' : '🎁'}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <p className={`text-xs truncate ${n.isRead ? 'font-medium' : 'font-bold text-white'}`}>
                                {n.title}
                              </p>
                              {!n.isRead && <span className="w-2 h-2 rounded-full bg-brand-400 shrink-0" />}
                            </div>
                            <p className="text-[11px] leading-relaxed text-white/70 mt-1 line-clamp-2">{n.message}</p>
                            <span className="text-[9px] text-white/30 block mt-1 font-mono">
                              {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Theme Toggle & Shop Admin Inventory & Delivery Fleet Shortcuts */}
          <div className="flex items-center gap-2">
            <button
              onClick={toggleTheme}
              title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
              className="p-2.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/15 text-white/80 hover:text-white transition-all flex items-center justify-center shadow-md"
            >
              {!mounted || theme === 'dark' ? <FiSun size={15} className="text-amber-400" /> : <FiMoon size={15} className="text-purple-300" />}
            </button>

            <Link
              href="/admin/products"
              className="hidden sm:flex px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/40 text-amber-300 text-xs font-bold items-center gap-1.5 hover:scale-105 transition-transform shadow-lg shadow-amber-500/10"
            >
              <FiShield size={13} />
              <span>Shop Admin</span>
            </Link>

            <Link
              href="/delivery"
              className="hidden sm:flex px-3 py-1.5 rounded-xl bg-gradient-to-r from-purple-500/20 to-indigo-500/20 border border-purple-500/40 text-purple-300 text-xs font-bold items-center gap-1.5 hover:scale-105 transition-transform shadow-lg shadow-purple-500/10"
            >
              <FiTruck size={13} />
              <span>Delivery Fleet</span>
            </Link>
          </div>

          {/* User Profile / Login */}
          {isAuthenticated ? (
            <div className="relative">
              <button
                onClick={() => {
                  setShowUserMenu(!showUserMenu);
                  if (!showUserMenu) setShowNotifications(false);
                }}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gradient-to-r from-brand-500/20 to-purple-500/20 border border-brand-500/40 text-white text-xs font-semibold hover:bg-brand-500/30 transition-all"
              >
                <div className="w-6 h-6 rounded-lg bg-brand-500 flex items-center justify-center text-white text-[11px] font-bold">
                  {user?.firstName?.[0] || 'U'}
                </div>
                <span className="hidden sm:inline">{user?.firstName || 'Account'}</span>
              </button>

              {showUserMenu && (
                <div className="absolute right-0 mt-3 w-56 bg-[#14142B] border border-white/15 rounded-2xl p-3 shadow-2xl z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="flex items-center justify-between px-3 py-2 border-b border-white/10 mb-2">
                    <div className="overflow-hidden mr-2">
                      <p className="text-xs font-bold text-white truncate">{user?.firstName} {user?.lastName}</p>
                      <p className="text-[10px] text-brand-400 uppercase tracking-wider font-semibold mt-0.5">{user?.role || 'Customer'}</p>
                    </div>
                    <button
                      onClick={() => setShowUserMenu(false)}
                      className="text-white/40 hover:text-white p-1 rounded-lg transition-colors shrink-0"
                      title="Close Profile Menu"
                    >
                      <FiX size={16} />
                    </button>
                  </div>
                  <Link
                    href="/vault"
                    onClick={() => setShowUserMenu(false)}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-white/80 hover:text-white hover:bg-white/5 transition-colors"
                  >
                    <FiHeart size={14} className="text-brand-400" />
                    My Memory Vault
                  </Link>
                  <Link
                    href="/build"
                    onClick={() => setShowUserMenu(false)}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-white/80 hover:text-white hover:bg-white/5 transition-colors"
                  >
                    <FiBox size={14} className="text-purple-400" />
                    Build Custom Box
                  </Link>
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      logout();
                      router.push('/');
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-red-400 hover:bg-red-500/10 transition-colors mt-1"
                  >
                    <FiLogOut size={14} />
                    Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link
              href="/login"
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-brand-500 to-purple-600 text-white text-xs font-bold shadow-lg shadow-brand-500/25 hover:scale-105 transition-transform flex items-center gap-1.5"
            >
              <FiUser size={14} />
              <span className="hidden sm:inline">Sign In</span>
            </Link>
          )}

          {/* Mobile Hamburger Toggle Button */}
          <button
            onClick={() => {
              setMobileMenuOpen(!mobileMenuOpen);
              if (!mobileMenuOpen) {
                setShowUserMenu(false);
                setShowNotifications(false);
              }
            }}
            className="md:hidden w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/80 hover:text-white hover:bg-white/10 transition-colors ml-1"
            title="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <FiX size={20} /> : <FiMenu size={20} />}
          </button>

        </div>

      </div>

      {/* Mobile Hamburger Menu Overlay Sheet */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 top-[65px] z-50 bg-[#0A0A14]/95 backdrop-blur-2xl border-t border-white/10 flex flex-col justify-between p-6 animate-in fade-in slide-in-from-top-4 duration-200 overflow-y-auto max-h-[calc(100vh-65px)]">
          <div className="space-y-6">
            <nav className="space-y-2">
              <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest px-2 mb-2">Main Navigation</p>
              {navLinks.map(({ href, label, icon: Icon, badge }) => {
                const isActive = pathname === href;
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`py-3.5 px-4 rounded-2xl text-sm font-semibold flex items-center justify-between transition-all ${
                      isActive
                        ? 'bg-gradient-to-r from-brand-500/20 to-purple-500/20 text-white border border-brand-500/40 shadow-sm'
                        : 'text-white/70 hover:text-white hover:bg-white/5 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={isActive ? 'text-brand-400' : 'text-white/50'} size={18} />
                      <span>{label}</span>
                    </div>
                    {badge > 0 && (
                      <span className="px-2.5 py-0.5 rounded-full bg-brand-500 text-white text-xs font-bold">
                        {badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>

            <div className="pt-4 border-t border-white/10 space-y-2">
              <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest px-2 mb-2">Portal Access</p>
              <Link
                href="/admin/products"
                onClick={() => setMobileMenuOpen(false)}
                className="py-3 px-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold flex items-center gap-3 hover:bg-amber-500/20 transition-all"
              >
                <FiShield size={16} />
                <span>Shop Admin Control Panel</span>
              </Link>
              <Link
                href="/delivery"
                onClick={() => setMobileMenuOpen(false)}
                className="py-3 px-4 rounded-2xl bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs font-bold flex items-center gap-3 hover:bg-purple-500/20 transition-all"
              >
                <FiTruck size={16} />
                <span>Delivery Fleet Portal</span>
              </Link>
            </div>
          </div>

          <div className="pt-6 mt-6 border-t border-white/10 flex items-center justify-between gap-3">
            <button
              onClick={() => {
                toggleTheme();
                setMobileMenuOpen(false);
              }}
              className="flex-1 py-3 px-4 rounded-2xl bg-white/5 border border-white/10 text-white/80 hover:text-white text-xs font-semibold flex items-center justify-center gap-2 transition-all"
            >
              {!mounted || theme === 'dark' ? <FiSun size={16} className="text-amber-400" /> : <FiMoon size={16} className="text-purple-300" />}
              <span>{!mounted || theme === 'dark' ? 'Light Theme' : 'Dark Theme'}</span>
            </button>
            {isAuthenticated ? (
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  logout();
                  router.push('/');
                }}
                className="py-3 px-5 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold flex items-center gap-2 hover:bg-red-500/20 transition-all"
              >
                <FiLogOut size={16} />
                <span>Logout</span>
              </button>
            ) : (
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="py-3 px-5 rounded-2xl bg-gradient-to-r from-brand-500 to-purple-600 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-brand-500/25"
              >
                <FiUser size={16} />
                <span>Sign In</span>
              </Link>
            )}
          </div>
        </div>
      )}

    </header>
  );
};

export default Navbar;
