/**
 * _app.jsx — Next.js App wrapper
 * Wraps all pages with Context providers, global styles, and Toaster.
 */

import '../styles/globals.css';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { CartProvider } from '../context/CartContext';
import { Toaster } from 'react-hot-toast';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';

function RouteGuard({ children }) {
  const { isAuthenticated, loading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isAuthenticated && pathname) {
      if (
        !pathname.startsWith('/login') &&
        !pathname.startsWith('/api/') &&
        !pathname.startsWith('/_next/') &&
        !pathname.includes('.')
      ) {
        router.replace('/login');
      }
    }
  }, [loading, isAuthenticated, pathname, router]);

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
