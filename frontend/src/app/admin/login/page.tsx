'use client';

import React, { useState } from 'react';
import AdminHeader from '@/components/AdminHeader';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api';
import { ShieldCheck, Lock, User, KeyRound, Eye, EyeOff, Sparkles, CheckCircle2, ArrowRight } from 'lucide-react';

export default function AdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [showPassword, setShowPassword] = useState(false);
  const [selectedRole, setSelectedRole] = useState<'SUPER_ADMIN' | 'LOAN_MANAGER' | 'SALES_EXECUTIVE'>('SUPER_ADMIN');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.post('/auth/login/', { username, password });
      const { access, refresh, user } = response.data;

      localStorage.setItem('access_token', access);
      localStorage.setItem('refresh_token', refresh);
      localStorage.setItem('user_info', JSON.stringify(user));

      router.push('/admin/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.detail || "Invalid admin credentials. Please check your username and password.");
    } finally {
      setLoading(false);
    }
  };

  const fillDemoCredentials = (u: string, p: string, role: 'SUPER_ADMIN' | 'LOAN_MANAGER' | 'SALES_EXECUTIVE') => {
    setUsername(u);
    setPassword(p);
    setSelectedRole(role);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col">
      <AdminHeader />

      <main className="flex-1 flex items-center justify-center p-4 py-12">
        <div className="max-w-md w-full glass-card rounded-2xl p-8 shadow-2xl border border-slate-200 dark:border-slate-800 relative overflow-hidden">
          {/* Top Logo Badge */}
          <div className="text-center mb-6">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white mx-auto mb-3 shadow-xl shadow-blue-500/25">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Bank / NBFC Admin Portal
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Secure JWT Authentication & Role-Based Access Control
            </p>
          </div>

          {error && (
            <div className="mb-5 p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-300 text-xs text-center font-medium animate-in fade-in">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                Username *
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter admin username"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                Password *
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:opacity-90 transition-opacity shadow-lg shadow-blue-500/25 text-sm disabled:opacity-50 mt-2 flex items-center justify-center gap-2"
            >
              {loading ? (
                "Authenticating Credentials..."
              ) : (
                <>
                  Sign In to Admin Workspace <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Fill Preset Credentials */}
          <div className="mt-6 pt-5 border-t border-slate-200 dark:border-slate-800">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 text-center mb-3 flex items-center justify-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Quick Demo Admin Logins
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => fillDemoCredentials('admin', 'admin123', 'SUPER_ADMIN')}
                className={`p-2 rounded-xl border text-xs font-semibold text-left transition-colors ${
                  selectedRole === 'SUPER_ADMIN'
                    ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400'
                    : 'border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                <div className="font-bold flex items-center gap-1">
                  Super Admin {selectedRole === 'SUPER_ADMIN' && <CheckCircle2 className="w-3 h-3" />}
                </div>
                <div className="text-[10px] text-slate-400 font-normal">Full System Access</div>
              </button>

              <button
                type="button"
                onClick={() => fillDemoCredentials('admin', 'admin123', 'LOAN_MANAGER')}
                className={`p-2 rounded-xl border text-xs font-semibold text-left transition-colors ${
                  selectedRole === 'LOAN_MANAGER'
                    ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400'
                    : 'border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                <div className="font-bold flex items-center gap-1">
                  Loan Manager {selectedRole === 'LOAN_MANAGER' && <CheckCircle2 className="w-3 h-3" />}
                </div>
                <div className="text-[10px] text-slate-400 font-normal">Lead Approval & Notes</div>
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
