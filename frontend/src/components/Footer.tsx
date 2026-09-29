'use client';

import React from 'react';
import Link from 'next/link';
import { ShieldCheck, Mail, Phone, MapPin, ExternalLink, Heart, ChevronRight } from 'lucide-react';

interface FooterProps {
  onSelectProduct?: (productName: string) => void;
}

export default function Footer({ onSelectProduct }: FooterProps) {
  return (
    <footer className="bg-slate-900 text-slate-300 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
          
          {/* Column 1: Brand Info */}
          <div className="lg:col-span-2 space-y-4">
            <Link href="/" className="inline-flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-700 flex items-center justify-center text-white shadow-lg shadow-emerald-600/30">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div className="flex flex-col">
                <span className="font-extrabold text-2xl tracking-tight text-white">
                  Loan<span className="text-emerald-400">Pilot</span>
                </span>
                <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 -mt-1">
                  Trusted Digital Loan Partner
                </span>
              </div>
            </Link>
            <p className="text-xs text-slate-400 leading-relaxed max-w-sm">
              LoanPilot Private Limited is an official channel partner to leading Banks and NBFCs across India. We simplify credit access through strong banking associations, paperless verification, and expert-driven support.
            </p>
            <div className="pt-2 flex items-center gap-3 text-xs text-emerald-400 font-semibold">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              Instant BRE & Eligibility Engine Active
            </div>
          </div>

          {/* Column 2: Loan Products */}
          <div className="space-y-3">
            <h4 className="text-white font-bold text-sm tracking-wider uppercase border-b border-slate-800 pb-2">
              Loan Products
            </h4>
            <ul className="space-y-2 text-xs">
              {['Personal Loan', 'Home Loan', 'Loan Against Property (LAP)', 'Unsecured Business Loan', 'Car Loan', 'Education Loan', 'Credit Cards'].map((item) => (
                <li key={item}>
                  <button
                    onClick={() => onSelectProduct && onSelectProduct(item)}
                    className="hover:text-emerald-400 transition-colors flex items-center gap-1.5 group text-left w-full cursor-pointer"
                  >
                    <ChevronRight className="w-3 h-3 text-emerald-500 group-hover:translate-x-0.5 transition-transform" />
                    {item}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Quick Links */}
          <div className="space-y-3">
            <h4 className="text-white font-bold text-sm tracking-wider uppercase border-b border-slate-800 pb-2">
              Company
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <a href="#about" className="hover:text-emerald-400 transition-colors flex items-center gap-1.5">
                  <ChevronRight className="w-3 h-3 text-emerald-500" /> About LoanPilot
                </a>
              </li>
              <li>
                <a href="#features" className="hover:text-emerald-400 transition-colors flex items-center gap-1.5">
                  <ChevronRight className="w-3 h-3 text-emerald-500" /> Why Choose Us
                </a>
              </li>
              <li>
                <a href="#process" className="hover:text-emerald-400 transition-colors flex items-center gap-1.5">
                  <ChevronRight className="w-3 h-3 text-emerald-500" /> How It Works
                </a>
              </li>
              <li>
                <a href="#partners" className="hover:text-emerald-400 transition-colors flex items-center gap-1.5">
                  <ChevronRight className="w-3 h-3 text-emerald-500" /> Banking Partners
                </a>
              </li>
            </ul>
          </div>

          {/* Column 4: Contact & Legal */}
          <div className="space-y-3">
            <h4 className="text-white font-bold text-sm tracking-wider uppercase border-b border-slate-800 pb-2">
              Support & Contact
            </h4>
            <div className="space-y-2.5 text-xs text-slate-400">
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>Financial Hub, Corporate Towers, Mumbai & New Delhi, India</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>support@loanpilot.in</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>1800-LOAN-PILOT (Toll Free)</span>
              </div>
            </div>
          </div>

        </div>

        {/* Disclaimer Notice */}
        <div className="mt-12 pt-8 border-t border-slate-800 text-[11px] text-slate-500 leading-relaxed space-y-2">
          <p>
            <strong>Disclaimer:</strong> LoanPilot is a digital loan comparison and eligibility evaluation platform acting as an official direct selling agent (DSA) / channel partner for RBI-regulated Banks and NBFCs. LoanPilot does not directly lend money to users; final loan approval, interest rate assignment, and disbursement decisions are strictly at the sole discretion of our partner banks and financial institutions.
          </p>
          <p>
            Personal data collected is protected with bank-grade encryption and shared with authorized lending partners only after explicit applicant consent.
          </p>
        </div>

        {/* Bottom Bar */}
        <div className="mt-8 pt-6 border-t border-slate-800/60 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div>
            © {new Date().getFullYear()} LoanPilot Private Limited. All rights reserved.
          </div>
          <div className="flex items-center gap-6 text-[11px]">
            <a href="#" className="hover:text-slate-300 transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-slate-300 transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-slate-300 transition-colors">Security Disclosure</a>
          </div>
        </div>

      </div>
    </footer>
  );
}
