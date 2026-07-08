/**
 * build.jsx — Gift Box Builder Page
 */
import Head from 'next/head';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import GiftBoxBuilder from '../components/GiftBoxBuilder/GiftBoxBuilder';

export default function BuildPage() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50 text-gray-900 dark:bg-[#0D0D1A] dark:text-white transition-colors duration-300">
      <Head>
        <title>Build a Gift Box — Emotion Delivery Platform</title>
        <meta name="description" content="Create a personalised gift box — choose products, premium packaging, a handwritten letter, and a video QR code." />
      </Head>
      <Navbar />
      <main className="flex-grow">
        <GiftBoxBuilder />
      </main>
      <Footer />
    </div>
  );
}
