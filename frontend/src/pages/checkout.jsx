/**
 * checkout.jsx — Checkout Page
 */
import Head from 'next/head';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import CheckoutPage from '../components/Checkout/CheckoutPage';

export default function Checkout() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50 text-gray-900 dark:bg-[#0D0D1A] dark:text-white transition-colors duration-300">
      <Head>
        <title>Checkout — Aurora</title>
        <meta name="description" content="Complete your personalised gift order — schedule delivery, add special modes, and pay securely with Razorpay." />
      </Head>
      <Navbar />
      <main className="flex-grow">
        <CheckoutPage />
      </main>
      <Footer />
    </div>
  );
}
