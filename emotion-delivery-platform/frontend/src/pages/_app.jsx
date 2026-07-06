/**
 * _app.jsx — Next.js App wrapper (Pages Router)
 * Wraps all pages with Context providers, global styles, and Toaster.
 *
 * FIXED: useRouter from next/router (Pages Router), not next/navigation (App Router)
 * FIXED: RouteGuard now only protects specific routes — public pages accessible without login
 */

import '../styles/globals.css';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { CartProvider } from '../context/CartContext';
import { Toaster } from 'react-hot-toast';
import { useRouter } from 'next/router';
import { useEffect } from 'react';

// Only these routes (and their sub-paths) require authentication
const PROTECTED_ROUTES = [
  '/vault',
  '/build',
  '/checkout',
  '/admin',
  '/delivery',
];

function RouteGuard({ children }) {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const pathname = router.pathname;

  const isProtected = PROTECTED_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(route + '/')
  );

  useEffect(() => {
    if (loading) return; // Wait until auth state is fully resolved from localStorage
    if (!isAuthenticated && isProtected) {
      router.replace(`/login?from=${encodeURIComponent(pathname)}`);
    }
  }, [loading, isAuthenticated, isProtected, pathname, router]);

  // Only block protected-route renders while auth is resolving (prevents flash of private content)
  if (loading && isProtected) return null;

  return children;
}

export default function App({ Component, pageProps }) {
  return (
    <AuthProvider>
      <CartProvider>
        <RouteGuard>
          <Component {...pageProps} />
        </RouteGuard>
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: 'var(--toast-bg, rgba(20, 20, 43, 0.96))',
              color: 'var(--toast-color, #ffffff)',
              border: '1px solid var(--toast-border, rgba(255,255,255,0.12))',
              backdropFilter: 'blur(16px)',
              borderRadius: '1rem',
              fontFamily: 'Inter, sans-serif',
              fontSize: '14px',
              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)',
            },
            success: { iconTheme: { primary: '#E85D9A', secondary: '#fff' } },
            error: { iconTheme: { primary: '#EF4444', secondary: '#fff' } },
          }}
        />
      </CartProvider>
    </AuthProvider>
  );
}
