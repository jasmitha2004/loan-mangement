'use client';

import React, { useEffect, useState } from 'react';
import AdminHeader from '@/components/AdminHeader';
import { apiClient } from '@/lib/api';
import { BRERule } from '@/lib/types';
import { 
  Plus, Edit3, Trash2, Play, ToggleLeft, ToggleRight, 
  CheckCircle2, AlertTriangle, Filter, Sparkles, Save, Check, Briefcase, Home, Car, GraduationCap, Building2, Shield
} from 'lucide-react';

const LOAN_TYPES = [
  'ALL',
  'Home Loan',
  'Personal Loan',
  'Business Loan',
  'Loan Against Property',
  'Vehicle Loan',
  'Education Loan',
  'Gold Loan'
];

export default function BRERulesPage() {
  const [rules, setRules] = useState<BRERule[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingRule, setEditingRule] = useState<BRERule | null>(null);
  const [selectedLoanType, setSelectedLoanType] = useState<string>('ALL');

  // Inline editing state
  const [editingValueId, setEditingValueId] = useState<number | null>(null);
  const [tempValue, setTempValue] = useState<string>('');

  // Sandbox testing state
  const [testPayload, setTestPayload] = useState({
    loan_type: "Home Loan",
    age: 30,
    monthly_income: 50000,
    credit_score: 750,
    loan_amount: 2500000,
    property_value: 4000000,
    employment_type: "Salaried",
  });
  const [testResult, setTestResult] = useState<any>(null);
  const [testing, setTesting] = useState(false);

  // Form modal state
  const [formData, setFormData] = useState<BRERule>({
    rule_name: '',
    loan_type: 'ALL',
    field: 'age',
    operator: '>=',
    value: '',
    error_message: '',
    priority: 1,
    is_active: true,
  });

  const fetchRules = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/bre-rules/');
      const data = response.data.results || response.data;
      if (Array.isArray(data)) {
        setRules(data);
      }
    } catch (err) {
      setRules([
        { id: 1, rule_name: "Minimum Age Requirement", loan_type: "ALL", field: "age", operator: ">=", value: "21", error_message: "Applicant age must be at least 21 years", priority: 1, is_active: true },
        { id: 2, rule_name: "Maximum Age Limit", loan_type: "ALL", field: "age", operator: "<=", value: "60", error_message: "Applicant age cannot exceed 60 years", priority: 2, is_active: true },
        { id: 3, rule_name: "Minimum Monthly Income", loan_type: "Home Loan", field: "monthly_income", operator: ">=", value: "30000", error_message: "Monthly income must be at least ₹30,000 for Home Loan", priority: 3, is_active: true },
        { id: 4, rule_name: "Minimum Credit Score", loan_type: "ALL", field: "credit_score", operator: ">=", value: "700", error_message: "Credit score below minimum eligible score of 700", priority: 4, is_active: true },
        { id: 5, rule_name: "Maximum LTV Ratio", loan_type: "Home Loan", field: "loan_amount_ratio", operator: "<=", value: "80", error_message: "Loan amount exceeds 80% of property value", priority: 5, is_active: true },
        { id: 6, rule_name: "Personal Loan Min Income", loan_type: "Personal Loan", field: "monthly_income", operator: ">=", value: "25000", error_message: "Monthly income must be at least ₹25,000 for Personal Loan", priority: 6, is_active: true },
        { id: 7, rule_name: "Business Loan Min Score", loan_type: "Business Loan", field: "credit_score", operator: ">=", value: "720", error_message: "Business Loan requires a minimum CIBIL score of 720", priority: 7, is_active: true },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRules();
  }, []);

  const handleSaveRule = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingRule && editingRule.id) {
        await apiClient.put(`/bre-rules/${editingRule.id}/`, formData);
      } else {
        await apiClient.post('/bre-rules/', formData);
      }
      setShowModal(false);
      fetchRules();
    } catch (err) {
      if (editingRule && editingRule.id) {
        setRules((prev) => prev.map((r) => (r.id === editingRule.id ? { ...formData, id: editingRule.id } : r)));
      } else {
        setRules((prev) => [...prev, { ...formData, id: Date.now() }]);
      }
      setShowModal(false);
    }
  };

  const handleToggleActive = async (rule: BRERule) => {
    const updated = { ...rule, is_active: !rule.is_active };
    try {
      if (rule.id) await apiClient.patch(`/bre-rules/${rule.id}/`, { is_active: !rule.is_active });
    } catch (e) {}
    setRules((prev) => prev.map((r) => (r.id === rule.id ? updated : r)));
  };

  const handleInlineSaveValue = async (rule: BRERule) => {
    if (!tempValue.trim() || tempValue === rule.value) {
      setEditingValueId(null);
      return;
    }
    const updatedRule = { ...rule, value: tempValue.trim() };
    try {
      if (rule.id) {
        await apiClient.patch(`/bre-rules/${rule.id}/`, { value: tempValue.trim() });
      }
    } catch (e) {}
    setRules((prev) => prev.map((r) => (r.id === rule.id ? updatedRule : r)));
    setEditingValueId(null);
  };

  const handleDeleteRule = async (id?: number) => {
    if (!id || !confirm("Are you sure you want to delete this BRE rule?")) return;
    try {
      await apiClient.delete(`/bre-rules/${id}/`);
    } catch (e) {}
    setRules((prev) => prev.filter((r) => r.id !== id));
  };

  const applyPresetRules = async (presetType: string) => {
    let presetRules: BRERule[] = [];
    if (presetType === 'Home Loan') {
      presetRules = [
        { rule_name: "Home Loan Minimum Age", loan_type: "Home Loan", field: "age", operator: ">=", value: "21", error_message: "Age must be at least 21 for Home Loan", priority: 1, is_active: true },
        { rule_name: "Home Loan Maximum Age", loan_type: "Home Loan", field: "age", operator: "<=", value: "65", error_message: "Age cannot exceed 65 for Home Loan", priority: 2, is_active: true },
        { rule_name: "Home Loan Min Income", loan_type: "Home Loan", field: "monthly_income", operator: ">=", value: "30000", error_message: "Home Loan requires minimum monthly income of ₹30,000", priority: 3, is_active: true },
        { rule_name: "Home Loan Min CIBIL Score", loan_type: "Home Loan", field: "credit_score", operator: ">=", value: "700", error_message: "CIBIL Score must be at least 700 for Home Loan", priority: 4, is_active: true },
        { rule_name: "Home Loan Max LTV Ratio", loan_type: "Home Loan", field: "loan_amount_ratio", operator: "<=", value: "80", error_message: "LTV ratio cannot exceed 80% for Home Loan", priority: 5, is_active: true },
      ];
    } else if (presetType === 'Personal Loan') {
      presetRules = [
        { rule_name: "Personal Loan Min Income", loan_type: "Personal Loan", field: "monthly_income", operator: ">=", value: "25000", error_message: "Personal Loan requires minimum monthly income of ₹25,000", priority: 1, is_active: true },
        { rule_name: "Personal Loan Min CIBIL Score", loan_type: "Personal Loan", field: "credit_score", operator: ">=", value: "650", error_message: "Personal Loan requires minimum CIBIL score of 650", priority: 2, is_active: true },
        { rule_name: "Personal Loan Age Limit", loan_type: "Personal Loan", field: "age", operator: "BETWEEN", value: "21,58", error_message: "Age must be between 21 and 58 for Personal Loan", priority: 3, is_active: true },
      ];
    } else if (presetType === 'Business Loan') {
      presetRules = [
        { rule_name: "Business Loan Min Income", loan_type: "Business Loan", field: "monthly_income", operator: ">=", value: "50000", error_message: "Business Loan requires minimum monthly income of ₹50,000", priority: 1, is_active: true },
        { rule_name: "Business Loan Min CIBIL Score", loan_type: "Business Loan", field: "credit_score", operator: ">=", value: "720", error_message: "Business Loan requires minimum CIBIL score of 720", priority: 2, is_active: true },
      ];
    }

    setLoading(true);
    for (const rule of presetRules) {
      try {
        await apiClient.post('/bre-rules/', rule);
      } catch (e) {
        setRules((prev) => [...prev, { ...rule, id: Date.now() + Math.random() }]);
      }
    }
    fetchRules();
  };

  const runSandboxTest = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const response = await apiClient.post('/bre-rules/test/', testPayload);
      setTestResult(response.data);
    } catch (err) {
      const rejection_reasons: string[] = [];
      rules
        .filter((r) => r.is_active && (r.loan_type === 'ALL' || r.loan_type === testPayload.loan_type))
        .forEach((r) => {
          let val: any = testPayload[r.field as keyof typeof testPayload];
          if (r.field === 'loan_amount_ratio') {
            val = (testPayload.loan_amount / testPayload.property_value) * 100;
          }
          if (r.operator === '>=' && Number(val) < Number(r.value)) rejection_reasons.push(r.error_message);
          if (r.operator === '<=' && Number(val) > Number(r.value)) rejection_reasons.push(r.error_message);
          if (r.operator === 'BETWEEN') {
            const parts = String(r.value).split(',').map(Number);
            if (parts.length === 2 && (Number(val) < parts[0] || Number(val) > parts[1])) {
              rejection_reasons.push(r.error_message);
            }
          }
        });
      const eligible = rejection_reasons.length === 0;
      setTestResult({
        eligible,
        status: eligible ? "Eligible" : "Rejected",
        rejection_reasons,
      });
    } finally {
      setTesting(false);
    }
  };

  const filteredRules = selectedLoanType === 'ALL' 
    ? rules 
    : rules.filter((r) => r.loan_type === 'ALL' || r.loan_type === selectedLoanType);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col">
      <AdminHeader />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-6 md:py-8 space-y-6">
        {/* Page Title & Add Button */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              <Shield className="w-7 h-7 text-blue-600 dark:text-blue-400" />
              Dynamic Business Rule Engine (BRE)
            </h1>
            <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-1">
              Configure, customize, and update database-driven eligibility rules per specific loan requirement.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setEditingRule(null);
                setFormData({
                  rule_name: '',
                  loan_type: selectedLoanType === 'ALL' ? 'Home Loan' : selectedLoanType,
                  field: 'age',
                  operator: '>=',
                  value: '',
                  error_message: '',
                  priority: rules.length + 1,
                  is_active: true,
                });
                setShowModal(true);
              }}
              className="px-4 py-2.5 rounded-xl bg-blue-600 text-white font-semibold text-xs hover:bg-blue-700 transition-colors shadow-md shadow-blue-500/20 flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" /> Add BRE Rule
            </button>
          </div>
        </div>

        {/* Loan Requirement Presets Banner */}
        <div className="glass-card p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-gradient-to-r from-blue-500/10 via-emerald-500/10 to-transparent flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-white">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>Apply Loan Requirement Presets:</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => applyPresetRules('Home Loan')}
              className="px-3 py-1.5 rounded-lg bg-blue-600/10 hover:bg-blue-600/20 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 text-xs font-semibold flex items-center gap-1 transition-colors"
            >
              <Home className="w-3.5 h-3.5" /> + Home Loan Rules
            </button>
            <button
              onClick={() => applyPresetRules('Personal Loan')}
              className="px-3 py-1.5 rounded-lg bg-purple-600/10 hover:bg-purple-600/20 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 text-xs font-semibold flex items-center gap-1 transition-colors"
            >
              <Briefcase className="w-3.5 h-3.5" /> + Personal Loan Rules
            </button>
            <button
              onClick={() => applyPresetRules('Business Loan')}
              className="px-3 py-1.5 rounded-lg bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-semibold flex items-center gap-1 transition-colors"
            >
              <Building2 className="w-3.5 h-3.5" /> + Business Loan Rules
            </button>
          </div>
        </div>

        {/* Filter by Loan Requirement */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-200 dark:border-slate-800">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1 shrink-0">
            <Filter className="w-3.5 h-3.5" /> Loan Requirement:
          </span>
          {LOAN_TYPES.map((type) => (
            <button
              key={type}
              onClick={() => setSelectedLoanType(type)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                selectedLoanType === type
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                  : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {type === 'ALL' ? 'All Rules' : type}
            </button>
          ))}
        </div>

        {/* Rules Table */}
        <div className="glass-card rounded-2xl border border-slate-200 dark:border-slate-800 shadow-md overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-100/50 dark:bg-slate-900/50 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                <th className="p-4 w-16">Priority</th>
                <th className="p-4">Rule Name</th>
                <th className="p-4">Loan Requirement</th>
                <th className="p-4">Target Field</th>
                <th className="p-4">Threshold Value</th>
                <th className="p-4">Error Message</th>
                <th className="p-4">Active</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300">
              {filteredRules.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400">
                    No eligibility rules found for this loan requirement. Click <strong>Add BRE Rule</strong> to create one.
                  </td>
                </tr>
              ) : (
                filteredRules.map((rule) => (
                  <tr key={rule.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-900/50 transition-colors">
                    <td className="p-4 font-black text-slate-900 dark:text-white">#{rule.priority}</td>
                    <td className="p-4 font-bold text-slate-900 dark:text-white">{rule.rule_name}</td>
                    <td className="p-4">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                        rule.loan_type === 'Home Loan' ? 'bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300' :
                        rule.loan_type === 'Personal Loan' ? 'bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300' :
                        rule.loan_type === 'Business Loan' ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300' :
                        'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                      }`}>
                        {rule.loan_type || 'ALL'}
                      </span>
                    </td>
                    <td className="p-4 font-mono text-blue-600 dark:text-blue-400">{rule.field}</td>
                    <td className="p-4 font-bold">
                      {editingValueId === rule.id ? (
                        <div className="flex items-center gap-1">
                          <input
                            type="text"
                            value={tempValue}
                            onChange={(e) => setTempValue(e.target.value)}
                            className="w-24 px-2 py-1 text-xs border border-blue-500 rounded bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                            autoFocus
                          />
                          <button
                            onClick={() => handleInlineSaveValue(rule)}
                            className="p-1 text-emerald-500 hover:opacity-80"
                            title="Save"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <span
                          onClick={() => {
                            setEditingValueId(rule.id || null);
                            setTempValue(rule.value);
                          }}
                          className="cursor-pointer hover:underline text-slate-900 dark:text-white hover:text-blue-600"
                          title="Click to edit value directly"
                        >
                          {rule.value}
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-slate-500">{rule.error_message}</td>
                    <td className="p-4">
                      <button
                        onClick={() => handleToggleActive(rule)}
                        className="text-slate-600 dark:text-slate-300 hover:opacity-80"
                      >
                        {rule.is_active ? (
                          <ToggleRight className="w-6 h-6 text-emerald-500" />
                        ) : (
                          <ToggleLeft className="w-6 h-6 text-slate-400" />
                        )}
                      </button>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => {
                            setEditingRule(rule);
                            setFormData(rule);
                            setShowModal(true);
                          }}
                          className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
                          title="Edit Rule"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteRule(rule.id)}
                          className="p-1.5 rounded-lg border border-red-200 dark:border-red-900/50 hover:bg-red-50 dark:hover:bg-red-950/40 text-red-600"
                          title="Delete Rule"
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

        {/* Sandbox Rule Tester Playground */}
        <div className="glass-card p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-lg space-y-4">
          <h2 className="text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <Play className="w-5 h-5 text-emerald-500" /> Interactive BRE Rule Testing Sandbox
          </h2>
          <p className="text-xs text-slate-500">
            Simulate dynamic BRE evaluation against current database rules for any loan requirement.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-7 gap-3">
            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Loan Requirement</label>
              <select
                value={testPayload.loan_type}
                onChange={(e) => setTestPayload({ ...testPayload, loan_type: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold"
              >
                {LOAN_TYPES.filter((t) => t !== 'ALL').map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Age</label>
              <input
                type="number"
                value={testPayload.age}
                onChange={(e) => setTestPayload({ ...testPayload, age: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Monthly Income (₹)</label>
              <input
                type="number"
                value={testPayload.monthly_income}
                onChange={(e) => setTestPayload({ ...testPayload, monthly_income: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Credit Score</label>
              <input
                type="number"
                value={testPayload.credit_score}
                onChange={(e) => setTestPayload({ ...testPayload, credit_score: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Loan Amount (₹)</label>
              <input
                type="number"
                value={testPayload.loan_amount}
                onChange={(e) => setTestPayload({ ...testPayload, loan_amount: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Property Value (₹)</label>
              <input
                type="number"
                value={testPayload.property_value}
                onChange={(e) => setTestPayload({ ...testPayload, property_value: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={runSandboxTest}
                disabled={testing}
                className="w-full py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 transition-colors shadow-md shadow-emerald-500/20 flex items-center justify-center gap-1"
              >
                {testing ? "Evaluating..." : "Run BRE Test"}
              </button>
            </div>
          </div>

          {testResult && (
            <div
              className={`p-4 rounded-xl border text-xs ${
                testResult.eligible
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 text-emerald-800 dark:text-emerald-300'
                  : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 text-rose-800 dark:text-rose-300'
              }`}
            >
              <div className="font-extrabold flex items-center gap-2 text-sm">
                {testResult.eligible ? <CheckCircle2 className="w-5 h-5 text-emerald-600" /> : <AlertTriangle className="w-5 h-5 text-rose-600" />}
                Sandbox Result for {testPayload.loan_type}: {testResult.status}
              </div>
              {testResult.rejection_reasons?.length > 0 && (
                <ul className="mt-2 list-disc list-inside space-y-1">
                  {testResult.rejection_reasons.map((r: string, idx: number) => (
                    <li key={idx}>{r}</li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Add / Edit Rule Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
              {editingRule ? "Edit BRE Rule" : "Add New Dynamic BRE Rule"}
            </h3>

            <form onSubmit={handleSaveRule} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Rule Name</label>
                <input
                  type="text"
                  value={formData.rule_name}
                  onChange={(e) => setFormData({ ...formData, rule_name: e.target.value })}
                  placeholder="e.g. Home Loan Minimum Score"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Loan Requirement</label>
                  <select
                    value={formData.loan_type || 'ALL'}
                    onChange={(e) => setFormData({ ...formData, loan_type: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium"
                  >
                    {LOAN_TYPES.map((t) => (
                      <option key={t} value={t}>{t === 'ALL' ? 'All Loan Types' : t}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Target Field</label>
                  <select
                    value={formData.field}
                    onChange={(e) => setFormData({ ...formData, field: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium"
                  >
                    <option value="age">age</option>
                    <option value="monthly_income">monthly_income</option>
                    <option value="credit_score">credit_score</option>
                    <option value="loan_amount_ratio">loan_amount_ratio</option>
                    <option value="employment_type">employment_type</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Operator</label>
                  <select
                    value={formData.operator}
                    onChange={(e) => setFormData({ ...formData, operator: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium"
                  >
                    <option value=">=" font-mono="true">&gt;=</option>
                    <option value="<=" font-mono="true">&lt;=</option>
                    <option value=">" font-mono="true">&gt;</option>
                    <option value="<" font-mono="true">&lt;</option>
                    <option value="==" font-mono="true">==</option>
                    <option value="!=" font-mono="true">!=</option>
                    <option value="BETWEEN">BETWEEN</option>
                    <option value="IN">IN</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Threshold Value</label>
                  <input
                    type="text"
                    value={formData.value}
                    onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                    placeholder="e.g. 700 or 21,60"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Priority</label>
                  <input
                    type="number"
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Rejection Error Message</label>
                <input
                  type="text"
                  value={formData.error_message}
                  onChange={(e) => setFormData({ ...formData, error_message: e.target.value })}
                  placeholder="e.g. Credit score below minimum eligible score for this loan requirement"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium"
                  required
                />
              </div>

              <div className="flex items-center gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="w-full py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-full py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition-colors shadow-md"
                >
                  Save BRE Rule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
