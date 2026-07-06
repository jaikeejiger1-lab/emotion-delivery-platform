/**
 * track/[id].jsx — Dynamic order tracking page
 */
import Head from 'next/head';
import { useRouter } from 'next/router';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import OrderTracker from '../../components/Checkout/OrderTracker';

export default function TrackPage() {
  const router = useRouter();
  const { id } = router.query;

  return (
    <div className="min-h-screen flex flex-col bg-[#0D0D1A] text-white">
      <Head>
        <title>Track Your Order — Emotion Delivery Platform</title>
        <meta name="description" content="Live track your personalised gift on a map. See real-time agent location and delivery updates." />
      </Head>
      <Navbar />
      <main className="flex-grow">
        {id ? <OrderTracker orderId={id} /> : (
          <div className="flex items-center justify-center min-h-[60vh]">
            <p className="text-white/40 animate-pulse">Loading order tracking…</p>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
