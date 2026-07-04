/**
 * /admin/reports.jsx — Master Business Analytics & Reporting Portal
 *
 * Allows administrators to filter business data by date range and category (Sales, Users, Orders),
 * generating downloadable executive reports formatted in CSV, Excel (.xlsx), or PDF.
 */
import React, { useState } from 'react';
import Head from 'next/head';
import AdminLayout from '../../components/Admin/AdminLayout';
import axiosClient from '../../api/axiosClient';
import toast from 'react-hot-toast';
import {
  FiFileText, FiDownload, FiCalendar, FiFilter,
  FiBarChart2, FiUsers, FiShoppingBag, FiCheckCircle
} from 'react-icons/fi';

export default function ReportsDashboard() {
  const [reportType, setReportType] = useState('sales');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [exportingFormat, setExportingFormat] = useState(null);

  const reportTypes = [
    {
      id: 'sales',
      label: 'Revenue & Sales Report',
      description: 'Itemized breakdown of completed checkouts, subtotal, taxes, shipping fees, and payment methods.',
      icon: FiBarChart2,
      color: 'from-pink-500 to-rose-600',
      borderColor: 'border-pink-500/30',
    },
    {
      id: 'orders',
      label: 'Fulfillment & Logistics Report',
      description: 'Comprehensive courier dispatch schedules, time slots, recipient addresses, and order lifecycle statuses.',
      icon: FiShoppingBag,
      color: 'from-purple-500 to-indigo-600',
      borderColor: 'border-purple-500/30',
    },
    {
      id: 'users',
      label: 'Fleet & User Directory',
      description: 'Account audit directory including registered customers, fleet delivery personnel, and account security states.',
      icon: FiUsers,
      color: 'from-amber-500 to-orange-600',
      borderColor: 'border-amber-500/30',
    },
  ];

  const handleExport = async (format) => {
    if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
      toast.error('Start Date cannot be after End Date');
      return;
    }

    setExportingFormat(format);
    const toastId = toast.loading(`Generating ${reportType.toUpperCase()} report as ${format.toUpperCase()}...`);

    try {
      const params = new URLSearchParams({
        type: reportType,
        format,
      });
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      // Perform request expecting binary blob
      const response = await axiosClient.get(`/reports/download?${params.toString()}`, {
        responseType: 'blob',
      });

      // Determine correct MIME type and file extension
      let mimeType = 'text/csv';
      let ext = 'csv';
      if (format === 'excel') {
        mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        ext = 'xlsx';
      } else if (format === 'pdf') {
        mimeType = 'application/pdf';
        ext = 'pdf';
      }

      const blob = new Blob([response.data || response], { type: mimeType });
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.setAttribute('download', `EmotionDelivery_${reportType.toUpperCase()}_Report_${new Date().toISOString().slice(0, 10)}.${ext}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);

      toast.success(`🎉 ${reportType.toUpperCase()} (${format.toUpperCase()}) downloaded successfully!`, { id: toastId });
    } catch (error) {
      console.error('Export Error:', error);
      toast.error('Failed to generate report. Please try again.', { id: toastId });
    } finally {
      setExportingFormat(null);
    }
  };

  const selectedConfig = reportTypes.find((t) => t.id === reportType) || reportTypes[0];

  return (
    <AdminLayout>
      <Head>
        <title>Reports & Data Export — Emotion Delivery Admin</title>
      </Head>

      <div className="space-y-8 max-w-6xl mx-auto">
        
        {/* Header */}
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-pink-500/10 border border-pink-500/30 text-pink-300 text-xs font-bold mb-2">
            <FiFileText size={14} />
            <span>Business Intelligence Portal</span>
          </div>
          <h1 className="font-display text-3xl font-extrabold text-white">Analytics Export & Reporting</h1>
          <p className="text-white/50 text-xs mt-1">
            Extract filtered platform data into compliance-ready spreadsheet or executive document formats.
          </p>
        </div>

        {/* Report Category Selector */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {reportTypes.map((item) => {
            const Icon = item.icon;
            const isSelected = reportType === item.id;
            return (
              <div
                key={item.id}
                onClick={() => setReportType(item.id)}
                className={`p-6 rounded-3xl border transition-all cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? `bg-white/[0.06] ${item.borderColor} shadow-2xl scale-[1.02]`
                    : 'bg-white/[0.02] border-white/10 hover:border-white/20 hover:bg-white/[0.04]'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className={`w-12 h-12 rounded-2xl bg-gradient-to-tr ${item.color} flex items-center justify-center text-white text-xl shadow-lg`}>
                      <Icon />
                    </div>
                    {isSelected && (
                      <span className="flex items-center gap-1 text-xs font-bold text-green-400 bg-green-500/10 px-3 py-1 rounded-full border border-green-500/30">
                        <FiCheckCircle size={12} /> Selected
                      </span>
                    )}
                  </div>
                  <h3 className="font-bold text-base text-white">{item.label}</h3>
                  <p className="text-white/50 text-xs mt-1 leading-relaxed">{item.description}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Configuration Card */}
        <div className="p-8 rounded-3xl bg-[#14142B] border border-white/10 shadow-2xl space-y-8">
          
          <div className="flex items-center gap-3 pb-6 border-b border-white/10">
            <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-brand-400">
              <FiFilter size={20} />
            </div>
            <div>
              <h2 className="font-bold text-lg text-white">Filter parameters for {selectedConfig.label}</h2>
              <p className="text-white/40 text-xs">Define optional date boundaries for data extraction.</p>
            </div>
          </div>

          {/* Date Range Pickers */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-white/70 uppercase tracking-wider mb-2 flex items-center gap-2">
                <FiCalendar className="text-brand-400" /> Start Date (From)
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full bg-[#0A0A14] border border-white/15 rounded-2xl px-4 py-3 text-sm text-white focus:outline-none focus:border-brand-500 transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-white/70 uppercase tracking-wider mb-2 flex items-center gap-2">
                <FiCalendar className="text-purple-400" /> End Date (To)
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full bg-[#0A0A14] border border-white/15 rounded-2xl px-4 py-3 text-sm text-white focus:outline-none focus:border-brand-500 transition-colors"
              />
            </div>
          </div>

          {(startDate || endDate) && (
            <div className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.03] border border-white/10 text-xs text-white/70">
              <span>Applying date filter from <strong>{startDate || 'Beginning of time'}</strong> up to <strong>{endDate || 'Now'}</strong></span>
              <button
                onClick={() => { setStartDate(''); setEndDate(''); }}
                className="text-brand-400 font-bold hover:underline"
              >
                Clear Range
              </button>
            </div>
          )}

          {/* Export Buttons */}
          <div className="pt-4 space-y-4">
            <label className="block text-xs font-bold text-white/40 uppercase tracking-widest text-center">
              Choose Export Format & Download
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              
              {/* Export CSV */}
              <button
                onClick={() => handleExport('csv')}
                disabled={exportingFormat !== null}
                className="p-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold text-sm flex items-center justify-center gap-3 transition-all hover:scale-[1.02] disabled:opacity-50"
              >
                <span className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center font-mono font-bold text-xs">
                  CSV
                </span>
                <span>Export CSV</span>
                {exportingFormat === 'csv' ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin ml-auto" />
                ) : (
                  <FiDownload className="ml-auto text-white/40" />
                )}
              </button>

              {/* Export Excel */}
              <button
                onClick={() => handleExport('excel')}
                disabled={exportingFormat !== null}
                className="p-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm flex items-center justify-center gap-3 transition-all hover:scale-[1.02] shadow-lg shadow-emerald-500/20 disabled:opacity-50"
              >
                <span className="w-8 h-8 rounded-xl bg-black/20 text-white flex items-center justify-center font-mono font-bold text-xs">
                  XLSX
                </span>
                <span>Export Excel</span>
                {exportingFormat === 'excel' ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin ml-auto" />
                ) : (
                  <FiDownload className="ml-auto" />
                )}
              </button>

              {/* Export PDF */}
              <button
                onClick={() => handleExport('pdf')}
                disabled={exportingFormat !== null}
                className="p-4 rounded-2xl bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 text-white font-bold text-sm flex items-center justify-center gap-3 transition-all hover:scale-[1.02] shadow-lg shadow-pink-500/20 disabled:opacity-50"
              >
                <span className="w-8 h-8 rounded-xl bg-black/20 text-white flex items-center justify-center font-mono font-bold text-xs">
                  PDF
                </span>
                <span>Export PDF</span>
                {exportingFormat === 'pdf' ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin ml-auto" />
                ) : (
                  <FiDownload className="ml-auto" />
                )}
              </button>

            </div>
          </div>

        </div>

      </div>
    </AdminLayout>
  );
}
