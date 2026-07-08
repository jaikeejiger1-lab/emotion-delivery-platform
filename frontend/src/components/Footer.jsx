/**
 * Footer.jsx — Premium Responsive Footer Component
 */
import React from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';

const Footer = () => {
  const handleComingSoon = (e, name) => {
    e.preventDefault();
    toast(`✨ ${name} is launching soon in our post-deployment update!`, { icon: '🚀' });
  };

  return (
    <footer className="bg-[#0A0A14] border-t border-white/10 pt-16 pb-12 px-4 text-white/70">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
        
        {/* Brand Info */}
        <div>
          <div className="flex items-center gap-3 mb-4">
            <span className="text-2xl">🎁</span>
            <span className="font-display text-2xl font-bold bg-gradient-to-r from-white via-pink-200 to-pink-400 bg-clip-text text-transparent">
              Aurora
            </span>
          </div>
          <p className="text-xs text-white/40 leading-relaxed max-w-sm mb-6">
            India's most premium Aurora gift delivery platform. Making every occasion unforgettable with handwritten letters, video messages, and live GPS tracking since 2024.
          </p>
          <div className="flex items-center gap-3">
            {['Instagram', 'Twitter', 'Facebook', 'LinkedIn'].map((soc) => (
              <button
                key={soc}
                type="button"
                onClick={(e) => handleComingSoon(e, soc)}
                className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-[11px] text-white/60 hover:text-white hover:bg-white/10 cursor-pointer transition-colors"
              >
                {soc[0]}
              </button>
            ))}
          </div>
        </div>

        {/* Categories */}
        <div>
          <h4 className="text-xs font-bold text-white uppercase tracking-widest mb-4">Categories</h4>
          <ul className="space-y-2.5 text-xs text-white/50">
            {['Birthday Gifts', 'Anniversary Hampers', 'Romantic Proposals', 'Corporate Gifting', 'Festival Boxes', 'Custom Hampers'].map((item) => (
              <li key={item}>
                <Link href="/shop" className="hover:text-brand-400 transition-colors">
                  {item}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Services */}
        <div>
          <h4 className="text-xs font-bold text-white uppercase tracking-widest mb-4">Core Features</h4>
          <ul className="space-y-2.5 text-xs text-white/50">
            {[
              { label: 'Midnight Delivery (12:00 AM)', href: '/build' },
              { label: 'Handwritten Letter Plotter', href: '/build' },
              { label: 'Video QR Message Embedding', href: '/build' },
              { label: 'Live Agent GPS Tracking', href: '/delivery' },
              { label: 'Anonymous Gifting Mode', href: '/shop' },
              { label: 'Memory Vault Management', href: '/vault' },
            ].map((item) => (
              <li key={item.label}>
                <Link href={item.href} className="hover:text-brand-400 transition-colors">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Support & Legal */}
        <div>
          <h4 className="text-xs font-bold text-white uppercase tracking-widest mb-4">Company & Help</h4>
          <ul className="space-y-2.5 text-xs text-white/50">
            {['About Our Story', 'Partner With Us', 'Privacy Policy', 'Terms of Service', 'Refund & Returns', 'Contact Support'].map((item) => (
              <li key={item}>
                <button
                  type="button"
                  onClick={(e) => handleComingSoon(e, item)}
                  className="hover:text-brand-400 transition-colors text-left"
                >
                  {item}
                </button>
              </li>
            ))}
          </ul>
        </div>

      </div>

      {/* Bottom Bar */}
      <div className="max-w-7xl mx-auto pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between text-xs text-white/30 gap-4">
        <p>© 2026 Aurora. Built for high-scale enterprise SaaS operations.</p>
        <div className="flex items-center gap-6">
          <span>Security Verified</span>
          <span>SSL 256-Bit Encrypted</span>
          <span>Made with ❤️ in India</span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
