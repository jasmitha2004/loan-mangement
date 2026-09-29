'use client';

import React, { useEffect, useState } from 'react';
import AdminHeader from '@/components/AdminHeader';
import { apiClient } from '@/lib/api';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, LineChart, Line, CartesianGrid
} from 'recharts';
import { Users, CheckCircle, XCircle, Clock, Award, DollarSign, Percent, RefreshCw, Layers, Calendar, Filter, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function DashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Filter state for dashboard analytics
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [showFilterBar, setShowFilterBar] = useState(false);

  const activeFilterCount = (startDate ? 1 : 0) + (endDate ? 1 : 0) + (selectedMonth ? 1 : 0);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;
      if (selectedMonth) params.month = selectedMonth;

      const response = await apiClient.get('/dashboard/', { params });
      setData(response.data);
    } catch (err: any) {
      setData({
        summary: {
          total_leads: 0,
          eligible_leads: 0,
          rejected_leads: 0,
          pending_leads: 0,
          avg_credit_score: 0,
          avg_loan_amount: 0,
          approval_rate: 0
        },
        charts: {
          monthly_leads: [],
          loan_type_distribution: [],
          bre_status_distribution: [],
          credit_score_distribution: [],
          city_leads: []
        }
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [startDate, endDate, selectedMonth]);

  const summary = data?.summary || {};
  const charts = data?.charts || {};

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col">
      <AdminHeader />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-6 md:py-8 space-y-6">
        {/* Top Title & Header Action Button */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Executive Analytics & BRE Dashboard
            </h1>
            <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-1">
              Real-time portfolio metrics, credit score distribution, and BRE performance across the year.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFilterBar(!showFilterBar)}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-2 ${
                showFilterBar || activeFilterCount > 0
                  ? 'bg-blue-600 text-white shadow-blue-500/25 ring-2 ring-blue-500/30'
                  : 'bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Filter className="w-4 h-4" />
              <span>Analytics Filters</span>
              {activeFilterCount > 0 && (
                <span className="w-5 h-5 rounded-full bg-white text-blue-600 dark:bg-slate-950 dark:text-blue-400 text-[10px] font-black flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
              {showFilterBar ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Collapsible Analytics Time Horizon Filters Drawer */}
        <AnimatePresence>
          {showFilterBar && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="glass-card p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-blue-600" /> Analytics Time Horizon Filters
                  </h3>
                  <button
                    onClick={() => {
                      setStartDate('');
                      setEndDate('');
                      setSelectedMonth('');
                    }}
                    className="text-xs text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 font-semibold flex items-center gap-1"
                  >
                    <RefreshCw className="w-3 h-3" /> Reset View
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                      Filter by Month
                    </label>
                    <input
                      type="month"
                      value={selectedMonth}
                      onChange={(e) => setSelectedMonth(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                      End Date
                    </label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-semibold"
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Metric Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="glass-card p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Leads</div>
              <div className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white mt-1">{summary.total_leads || 0}</div>
            </div>
            <div className="w-11 h-11 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Users className="w-6 h-6" />
            </div>
          </div>

          <div className="glass-card p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Eligible Leads</div>
              <div className="text-2xl md:text-3xl font-black text-emerald-600 dark:text-emerald-400 mt-1">{summary.eligible_leads || 0}</div>
            </div>
            <div className="w-11 h-11 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <CheckCircle className="w-6 h-6" />
            </div>
          </div>

          <div className="glass-card p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Rejected Leads</div>
              <div className="text-2xl md:text-3xl font-black text-rose-600 dark:text-rose-400 mt-1">{summary.rejected_leads || 0}</div>
            </div>
            <div className="w-11 h-11 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <XCircle className="w-6 h-6" />
            </div>
          </div>

          <div className="glass-card p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Approval Rate</div>
              <div className="text-2xl md:text-3xl font-black text-indigo-600 dark:text-indigo-400 mt-1">{summary.approval_rate || 0}%</div>
            </div>
            <div className="w-11 h-11 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Percent className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Secondary Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="glass-card p-4 rounded-xl flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-600 flex items-center justify-center font-bold">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs text-slate-500 dark:text-slate-400 font-semibold">Average Credit Score</div>
              <div className="text-xl font-bold text-slate-900 dark:text-white">{summary.avg_credit_score || 0} <span className="text-xs text-emerald-500 font-normal">(Bureau Average)</span></div>
            </div>
          </div>

          <div className="glass-card p-4 rounded-xl flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center font-bold">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs text-slate-500 dark:text-slate-400 font-semibold">Average Loan Request Amount</div>
              <div className="text-xl font-bold text-slate-900 dark:text-white">₹{Number(summary.avg_loan_amount || 0).toLocaleString('en-IN')}</div>
            </div>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Monthly Lead Trend */}
          <div className="lg:col-span-2 glass-card p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4">Yearly & Monthly Lead Volume Trend</h3>
            <div className="h-64 flex items-center justify-center">
              {charts.monthly_leads?.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={charts.monthly_leads}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                    <XAxis dataKey="month" stroke="#94A3B8" fontSize={12} />
                    <YAxis stroke="#94A3B8" fontSize={12} />
                    <Tooltip contentStyle={{ borderRadius: '12px', background: '#0F172A', color: '#FFF' }} />
                    <Bar dataKey="eligible" name="Eligible" fill="#22C55E" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="rejected" name="Rejected" fill="#EF4444" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-xs text-slate-400">No lead submissions recorded for selected filter.</div>
              )}
            </div>
          </div>

          {/* BRE Status Pie Chart */}
          <div className="glass-card p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4">BRE Decision Breakdown</h3>
            <div className="h-64 flex items-center justify-center">
              {charts.bre_status_distribution?.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={charts.bre_status_distribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={80}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {(charts.bre_status_distribution || []).map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={entry.color || '#3B82F6'} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: '12px', background: '#0F172A', color: '#FFF' }} />
                    <Legend verticalAlign="bottom" height={36} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-xs text-slate-400">No lead data.</div>
              )}
            </div>
          </div>

          {/* Credit Score Distribution */}
          <div className="glass-card p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4">Credit Score Brackets</h3>
            <div className="h-64 flex items-center justify-center">
              {charts.credit_score_distribution?.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={charts.credit_score_distribution} layout="vertical">
                    <XAxis type="number" stroke="#94A3B8" fontSize={12} />
                    <YAxis type="category" dataKey="range" stroke="#94A3B8" fontSize={12} />
                    <Tooltip contentStyle={{ borderRadius: '12px', background: '#0F172A', color: '#FFF' }} />
                    <Bar dataKey="count" fill="#3B82F6" radius={[0, 6, 6, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-xs text-slate-400">No score records.</div>
              )}
            </div>
          </div>

          {/* Top Cities */}
          <div className="lg:col-span-2 glass-card p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4">City-wise Lead Volume</h3>
            <div className="h-64 flex items-center justify-center">
              {charts.city_leads?.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={charts.city_leads}>
                    <XAxis dataKey="city" stroke="#94A3B8" fontSize={12} />
                    <YAxis stroke="#94A3B8" fontSize={12} />
                    <Tooltip contentStyle={{ borderRadius: '12px', background: '#0F172A', color: '#FFF' }} />
                    <Bar dataKey="count" fill="#6366F1" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-xs text-slate-400">No location data.</div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
