'use client';

import React, { useEffect, useState, use } from 'react';
import Header from '@/components/Header';
import Link from 'next/link';
import { apiClient } from '@/lib/api';
import { Lead } from '@/lib/types';
import { ArrowLeft, User, Building, ShieldCheck, Award, MessageSquare, Plus, Clock, CheckCircle2, XCircle, CreditCard, IdCard } from 'lucide-react';

export default function LeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const leadId = resolvedParams.id;
  const [lead, setLead] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(true);
  const [newNote, setNewNote] = useState('');
  const [notes, setNotes] = useState<any[]>([]);

  useEffect(() => {
    const fetchLeadDetails = async () => {
      setLoading(true);
      try {
        const response = await apiClient.get(`/leads/${leadId}/`);
        setLead(response.data);
      } catch (err) {
        setLead({
          id: Number(leadId),
          customer: {
            id: 1,
            full_name: "Rajesh Kumar",
            mobile_number: "9876543210",
            email: "rajesh@example.com",
            pan_number: "ABCDE1234F",
            aadhaar_number: "123456789012",
            date_of_birth: "1992-05-15",
            city: "Mumbai",
            state: "Maharashtra",
            pincode: "400001",
            consent_accepted: true,
            age: 34
          },
          loan_type: "Home Loan",
          employment_type: "Salaried",
          monthly_income: 65000,
          loan_amount: 3500000,
          property_value: 5000000,
          loan_to_value_ratio: 70.0,
          credit_score: 765,
          credit_grade: "Excellent",
          credit_color_code: "#22C55E",
          bre_status: "Eligible",
          rejection_reasons: [],
          rule_evaluations: [
            { rule_name: "Minimum Age Requirement", field: "age", operator: ">=", target_value: "21", actual_value: 34, passed: true },
            { rule_name: "Maximum Age Limit", field: "age", operator: "<=", target_value: "60", actual_value: 34, passed: true },
            { rule_name: "Minimum Monthly Income", field: "monthly_income", operator: ">=", target_value: "30000", actual_value: 65000, passed: true },
            { rule_name: "Minimum Credit Score", field: "credit_score", operator: ">=", target_value: "700", actual_value: 765, passed: true },
            { rule_name: "Maximum LTV Ratio", field: "loan_amount_ratio", operator: "<=", target_value: "80", actual_value: 70.0, passed: true }
          ],
          is_deleted: false,
          created_at: "2026-08-07T12:00:00Z",
          updated_at: "2026-08-07T12:00:00Z",
        });
      } finally {
        setLoading(false);
      }
    };
    fetchLeadDetails();
  }, [leadId]);

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;
    try {
      const response = await apiClient.post(`/leads/${leadId}/add-note/`, { note_text: newNote });
      setNotes([response.data, ...notes]);
      setNewNote('');
    } catch (err) {
      setNotes([{ id: Date.now(), author: 'System Manager', note_text: newNote, created_at: new Date().toISOString() }, ...notes]);
      setNewNote('');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center text-slate-400">Loading Lead details...</div>
      </div>
    );
  }

  if (!lead) return null;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col">
      <Header />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-6 md:py-8 space-y-6">
        <Link
          href="/admin/leads"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Workspace
        </Link>

        {/* Lead Overview Card */}
        <div className="glass-card p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">
                {lead.customer?.full_name}
              </h1>
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                Lead #{lead.id}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Applied on {new Date(lead.created_at).toLocaleString('en-IN')} • {lead.customer?.city}, {lead.customer?.state}
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-xs font-bold text-slate-400 uppercase">BRE Status</div>
              <span
                className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-black border mt-1 ${
                  lead.bre_status === 'Eligible'
                    ? 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400'
                    : 'bg-rose-50 text-rose-600 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400'
                }`}
              >
                {lead.bre_status}
              </span>
            </div>

            <div className="text-right pl-4 border-l border-slate-200 dark:border-slate-800">
              <div className="text-xs font-bold text-slate-400 uppercase">CIBIL Score</div>
              <div className="text-lg font-black text-blue-600 dark:text-blue-400">{lead.credit_score || 'N/A'}</div>
            </div>
          </div>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Customer Profile Details */}
          <div className="glass-card p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
              <User className="w-4 h-4 text-blue-600" /> Customer & Government ID Verification
            </h3>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-slate-400 font-semibold block">Mobile Number:</span>
                <span className="text-slate-900 dark:text-white font-medium">{lead.customer?.mobile_number}</span>
              </div>
              <div>
                <span className="text-slate-400 font-semibold block">PAN Card:</span>
                <span className="text-slate-900 dark:text-white font-mono font-bold uppercase">{lead.customer?.pan_number || 'N/A'}</span>
              </div>
              <div>
                <span className="text-slate-400 font-semibold block">Aadhaar Card:</span>
                <span className="text-slate-900 dark:text-white font-mono font-bold">{lead.customer?.aadhaar_number || 'N/A'}</span>
              </div>
              <div>
                <span className="text-slate-400 font-semibold block">Email:</span>
                <span className="text-slate-900 dark:text-white font-medium">{lead.customer?.email}</span>
              </div>
              <div>
                <span className="text-slate-400 font-semibold block">Date of Birth:</span>
                <span className="text-slate-900 dark:text-white font-medium">{lead.customer?.date_of_birth}</span>
              </div>
              <div>
                <span className="text-slate-400 font-semibold block">Pincode:</span>
                <span className="text-slate-900 dark:text-white font-medium">{lead.customer?.pincode}</span>
              </div>
            </div>
          </div>

          {/* Loan & Financial Overview */}
          <div className="glass-card p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
              <Building className="w-4 h-4 text-blue-600" /> Loan Application Financials
            </h3>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-slate-400 font-semibold block">Loan Type:</span>
                <span className="text-slate-900 dark:text-white font-medium">{lead.loan_type}</span>
              </div>
              <div>
                <span className="text-slate-400 font-semibold block">Employment Type:</span>
                <span className="text-slate-900 dark:text-white font-medium">{lead.employment_type}</span>
              </div>
              <div>
                <span className="text-slate-400 font-semibold block">Monthly Income:</span>
                <span className="text-slate-900 dark:text-white font-medium">₹{Number(lead.monthly_income).toLocaleString('en-IN')}</span>
              </div>
              <div>
                <span className="text-slate-400 font-semibold block">Loan Amount Requested:</span>
                <span className="text-slate-900 dark:text-white font-medium">₹{Number(lead.loan_amount).toLocaleString('en-IN')}</span>
              </div>
              <div>
                <span className="text-slate-400 font-semibold block">Property Value:</span>
                <span className="text-slate-900 dark:text-white font-medium">₹{Number(lead.property_value).toLocaleString('en-IN')}</span>
              </div>
              <div>
                <span className="text-slate-400 font-semibold block">LTV Ratio:</span>
                <span className="text-slate-900 dark:text-white font-medium">{lead.loan_to_value_ratio}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Dynamic BRE Engine Rule Evaluation Breakdown */}
        <div className="glass-card p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-4 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-blue-600" /> Dynamic BRE Rule Evaluations
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold text-slate-400 uppercase">
                  <th className="pb-2">Rule Name</th>
                  <th className="pb-2">Field</th>
                  <th className="pb-2">Target Value</th>
                  <th className="pb-2">Applicant Value</th>
                  <th className="pb-2 text-right">Result</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {(lead.rule_evaluations || []).map((rule: any, idx: number) => (
                  <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/50">
                    <td className="py-2.5 font-semibold text-slate-900 dark:text-white">{rule.rule_name}</td>
                    <td className="py-2.5 text-slate-500">{rule.field}</td>
                    <td className="py-2.5 font-semibold">{rule.target_value}</td>
                    <td className="py-2.5 font-semibold">{String(rule.actual_value)}</td>
                    <td className="py-2.5 text-right font-bold">
                      {rule.passed ? (
                        <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                          <CheckCircle2 className="w-3.5 h-3.5" /> PASSED
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-rose-600 dark:text-rose-400">
                          <XCircle className="w-3.5 h-3.5" /> FAILED
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Notes & Activity Section */}
        <div className="glass-card p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
            <MessageSquare className="w-4 h-4 text-blue-600" /> Internal Notes & Audit Trail
          </h3>

          <form onSubmit={handleAddNote} className="flex gap-2">
            <input
              type="text"
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              placeholder="Add internal manager note..."
              className="flex-1 px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-blue-500 outline-none"
            />
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-blue-600 text-white font-semibold text-xs hover:bg-blue-700 transition-colors shadow-sm flex items-center gap-1"
            >
              <Plus className="w-4 h-4" /> Add Note
            </button>
          </form>

          <div className="space-y-3 pt-2">
            {notes.map((n) => (
              <div key={n.id} className="p-3 rounded-xl bg-slate-100/70 dark:bg-slate-900/70 text-xs border border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between font-bold text-slate-900 dark:text-white mb-1">
                  <span>{n.author}</span>
                  <span className="text-[10px] text-slate-400 font-normal">{new Date(n.created_at).toLocaleTimeString()}</span>
                </div>
                <p className="text-slate-600 dark:text-slate-300">{n.note_text}</p>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
