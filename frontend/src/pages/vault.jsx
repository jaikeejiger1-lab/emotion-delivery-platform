/**
 * vault.jsx — Memory Vault Page
 */
import Head from 'next/head';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import MemoryVaultDashboard from '../components/MemoryVault/MemoryVaultDashboard';

export default function VaultPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#0D0D1A] text-white">
      <Head>
        <title>My Memory Vault — Emotion Delivery Platform</title>
        <meta name="description" content="Manage your relationship reminders, milestone trackers, and automated gift calendars." />
      </Head>
      <Navbar />
      <main className="flex-grow">
        <MemoryVaultDashboard />
      </main>
      <Footer />
    </div>
  );
}
