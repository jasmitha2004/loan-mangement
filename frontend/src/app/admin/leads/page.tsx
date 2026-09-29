'use client';

import React, { useEffect, useState } from 'react';
import AdminHeader from '@/components/AdminHeader';
import Link from 'next/link';
import { apiClient } from '@/lib/api';
import { Lead } from '@/lib/types';
import {
  Search, Filter, Download, Trash2, Eye, ArrowUpDown, ChevronLeft, ChevronRight, CheckSquare, Square, RefreshCw, AlertCircle, Calendar, Hash, FileSpreadsheet, ChevronDown, ChevronUp, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function LeadTablePage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loanTypeFilter, setLoanTypeFilter] = useState('');

  // Report Extractor Modal/Drawer state
  const [showReportsModal, setShowReportsModal] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [leadIdSearch, setLeadIdSearch] = useState('');

  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [page, setPage] = useState(1);
  const [sortField, setSortField] = useState('-created_at');

  const isReversedDates = startDate && endDate && new Date(startDate) > new Date(endDate);
  const activeReportFilterCount = (selectedMonth ? 1 : 0) + (startDate ? 1 : 0) + (endDate ? 1 : 0) + (leadIdSearch ? 1 : 0) + (selectedIds.length > 0 ? 1 : 0);

  const fetchLeads = async () => {
    setLoading(true);
    try {
      const params: any = { page };
      if (search) params.search = search;
      if (statusFilter) params.bre_status = statusFilter;
      if (loanTypeFilter) params.loan_type = loanTypeFilter;
      if (sortField) params.ordering = sortField;

      const response = await apiClient.get('/leads/', { params });
      if (response.data.results) {
        setLeads(response.data.results);
      } else if (Array.isArray(response.data)) {
        setLeads(response.data);
      }
    } catch (err) {
      setLeads([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, [search, statusFilter, loanTypeFilter, sortField, page]);

  const toggleSelectAll = () => {
    if (selectedIds.length === leads.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(leads.map((l) => l.id));
    }
  };

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSoftDelete = async (id: number) => {
    if (!confirm(`Are you sure you want to soft delete Lead #${id}?`)) return;
    try {
      await apiClient.delete(`/leads/${id}/`);
      fetchLeads();
    } catch (err) {
      setLeads((prev) => prev.filter((l) => l.id !== id));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (!confirm(`Soft delete ${selectedIds.length} selected leads?`)) return;
    try {
      await apiClient.post('/leads/bulk-delete/', { lead_ids: selectedIds });
      setSelectedIds([]);
      fetchLeads();
    } catch (err) {
      setLeads((prev) => prev.filter((l) => !selectedIds.includes(l.id)));
      setSelectedIds([]);
    }
  };

  const handleExcelExport = async () => {
    setExporting(true);
    try {
      const params: any = { format: 'excel' };
      if (selectedIds.length > 0) {
        params.ids = selectedIds.join(',');
      } else if (leadIdSearch) {
        params.ids = leadIdSearch.replace(/[^0-9,]/g, '');
      }

      if (selectedMonth) params.month = selectedMonth;
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;

      const response = await apiClient.get('/export/leads/', {
        params,
        responseType: 'blob',
      });

      const blob = new Blob([response.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `leads_report_excel_${Date.now()}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      console.error("Excel export error:", err);
      let message = "Failed to download Excel report.";
      if (err.response?.data instanceof Blob) {
        try {
          const text = await err.response.data.text();
          const parsed = JSON.parse(text);
          message = parsed.detail || parsed.message || message;
        } catch (_) {}
      } else if (err.message) {
        message = err.message;
      }
      alert(`Export Failed: ${message}`);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col relative">
      <AdminHeader />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-6 md:py-8 space-y-6">
        {/* Title & Single Reports Toggle Button */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Lead Management Workspace
            </h1>
            <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-1">
              Primary workspace for filtering, managing, and extracting Excel reports.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {selectedIds.length > 0 && (
              <button
                onClick={handleBulkDelete}
                className="px-3.5 py-2.5 rounded-xl text-xs font-semibold bg-red-600 text-white hover:bg-red-700 transition-colors shadow-md shadow-red-500/20 flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" /> Delete Selected ({selectedIds.length})
              </button>
            )}

            {/* SINGLE REPORTS BUTTON */}
            <button
              onClick={() => setShowReportsModal(!showReportsModal)}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-2 ${
                showReportsModal || activeReportFilterCount > 0
                  ? 'bg-blue-600 text-white shadow-blue-500/25 ring-2 ring-blue-500/30'
                  : 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 hover:opacity-90'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-400 dark:text-emerald-600" />
              <span>Excel Reports</span>
              {activeReportFilterCount > 0 && (
                <span className="w-5 h-5 rounded-full bg-white text-blue-600 dark:bg-slate-950 dark:text-blue-400 text-[10px] font-black flex items-center justify-center">
                  {activeReportFilterCount}
                </span>
              )}
              {showReportsModal ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Lead Table Toolbar */}
        <div className="glass-card p-4 rounded-2xl flex flex-col md:flex-row gap-3 items-center justify-between border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, mobile, city..."
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-blue-500 outline-none font-semibold"
            >
              <option value="">All BRE Statuses</option>
              <option value="Eligible">Eligible</option>
              <option value="Rejected">Rejected</option>
              <option value="Pending">Pending</option>
            </select>

            <select
              value={loanTypeFilter}
              onChange={(e) => setLoanTypeFilter(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-blue-500 outline-none font-semibold"
            >
              <option value="">All Loan Types</option>
              <option value="Home Loan">Home Loan</option>
              <option value="Personal Loan">Personal Loan</option>
              <option value="Business Loan">Business Loan</option>
              <option value="Loan Against Property">Loan Against Property (LAP)</option>
              <option value="Vehicle Loan">Vehicle Loan</option>
              <option value="Education Loan">Education Loan</option>
              <option value="Gold Loan">Gold Loan</option>
            </select>

            <button
              onClick={() => {
                setSearch('');
                setStatusFilter('');
                setLoanTypeFilter('');
                setSelectedMonth('');
                setStartDate('');
                setEndDate('');
                setLeadIdSearch('');
              }}
              className="p-2 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors"
              title="Reset workspace filters"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Data Table */}
        <div className="glass-card rounded-2xl border border-slate-200 dark:border-slate-800 shadow-md overflow-x-auto relative">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-100/50 dark:bg-slate-900/50 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 sticky top-0 backdrop-blur-md">
                <th className="p-4 w-10">
                  <button onClick={toggleSelectAll}>
                    {selectedIds.length === leads.length && leads.length > 0 ? (
                      <CheckSquare className="w-4 h-4 text-blue-600" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-400" />
                    )}
                  </button>
                </th>
                <th className="p-4 cursor-pointer" onClick={() => setSortField(sortField === 'id' ? '-id' : 'id')}>
                  <div className="flex items-center gap-1">Lead ID <ArrowUpDown className="w-3 h-3" /></div>
                </th>
                <th className="p-4">Customer Name</th>
                <th className="p-4">Mobile</th>
                <th className="p-4">Loan Type</th>
                <th className="p-4">Income (Monthly)</th>
                <th className="p-4 cursor-pointer" onClick={() => setSortField(sortField === 'credit_score' ? '-credit_score' : 'credit_score')}>
                  <div className="flex items-center gap-1">Credit Score <ArrowUpDown className="w-3 h-3" /></div>
                </th>
                <th className="p-4">BRE Status</th>
                <th className="p-4">Created Date</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300">
              {loading ? (
                <tr>
                  <td colSpan={10} className="p-8 text-center text-slate-400">Loading leads workspace...</td>
                </tr>
              ) : leads.length === 0 ? (
                <tr>
                  <td colSpan={10} className="p-8 text-center text-slate-400">No leads match your criteria.</td>
                </tr>
              ) : (
                leads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-900/50 transition-colors">
                    <td className="p-4">
                      <button onClick={() => toggleSelect(lead.id)}>
                        {selectedIds.includes(lead.id) ? (
                          <CheckSquare className="w-4 h-4 text-blue-600" />
                        ) : (
                          <Square className="w-4 h-4 text-slate-400" />
                        )}
                      </button>
                    </td>
                    <td className="p-4 font-bold text-slate-900 dark:text-white">#{lead.id}</td>
                    <td className="p-4">
                      <div className="font-semibold text-slate-900 dark:text-white">{lead.customer?.full_name}</div>
                      <div className="text-[11px] text-slate-400">{lead.customer?.city}, {lead.customer?.state}</div>
                    </td>
                    <td className="p-4">{lead.customer?.mobile_number}</td>
                    <td className="p-4 font-semibold text-slate-900 dark:text-white">{lead.loan_type}</td>
                    <td className="p-4 font-semibold">₹{Number(lead.monthly_income).toLocaleString('en-IN')}</td>
                    <td className="p-4">
                      <span
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold"
                        style={{
                          backgroundColor: `${lead.credit_color_code || '#3B82F6'}20`,
                          color: lead.credit_color_code || '#3B82F6',
                          border: `1px solid ${lead.credit_color_code || '#3B82F6'}40`,
                        }}
                      >
                        {lead.credit_score || 'N/A'} ({lead.credit_grade || 'Fair'})
                      </span>
                    </td>
                    <td className="p-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border ${
                          lead.bre_status === 'Eligible'
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                            : 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border-rose-200 dark:border-rose-800'
                        }`}
                      >
                        {lead.bre_status}
                      </span>
                    </td>
                    <td className="p-4 text-slate-500">
                      {new Date(lead.created_at).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/admin/leads/${lead.id}`}
                          className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => handleSoftDelete(lead.id)}
                          className="p-1.5 rounded-lg border border-red-200 dark:border-red-900/50 hover:bg-red-50 dark:hover:bg-red-950/40 text-red-600 transition-colors"
                          title="Soft Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </main>

      {/* WRAPPED SINGLE EXCEL REPORT MODAL DRAWER */}
      <AnimatePresence>
        {showReportsModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-900 rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 relative overflow-hidden space-y-5"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                    <FileSpreadsheet className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
                      Extract Excel Report (.xlsx)
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Configure parameters and extract fully formatted Excel spreadsheet.
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setShowReportsModal(false)}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {isReversedDates && (
                <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-amber-500" />
                  <span>Start date is after end date. System will automatically adjust the date range.</span>
                </div>
              )}

              {/* Extraction Parameters Grid */}
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                      Extract Month
                    </label>
                    <input
                      type="month"
                      value={selectedMonth}
                      onChange={(e) => setSelectedMonth(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                      Extract Lead ID(s)
                    </label>
                    <input
                      type="text"
                      value={leadIdSearch}
                      onChange={(e) => setLeadIdSearch(e.target.value)}
                      placeholder="e.g. 51, 52 or #51"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-semibold"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                    Extract Date Range
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="block text-[10px] text-slate-400 mb-1">Start Date</span>
                      <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-semibold"
                      />
                    </div>
                    <div>
                      <span className="block text-[10px] text-slate-400 mb-1">End Date</span>
                      <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-semibold"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Single Excel Download Button */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  onClick={handleExcelExport}
                  disabled={exporting}
                  className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-extrabold text-sm hover:opacity-95 transition-opacity shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <FileSpreadsheet className="w-5 h-5" />
                  {exporting ? 'Generating Excel Report...' : 'Download Excel Report (.xlsx)'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
