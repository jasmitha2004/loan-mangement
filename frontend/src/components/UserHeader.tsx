'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ShieldCheck, Sun, Moon, ChevronDown, PhoneCall, ArrowRight, Menu, X } from 'lucide-react';

interface UserHeaderProps {
  onSelectProduct?: (productName: string) => void;
}

export default function UserHeader({ onSelectProduct }: UserHeaderProps) {
  const [darkMode, setDarkMode] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [productsOpen, setProductsOpen] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light') {
      setDarkMode(false);
      document.documentElement.classList.remove('dark');
    } else {
      setDarkMode(true);
      document.documentElement.classList.add('dark');
    }
  }, []);

  const toggleDarkMode = () => {
    const nextMode = !darkMode;
    setDarkMode(nextMode);
    if (nextMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  const scrollToSection = (id: string) => {
    setMobileMenuOpen(false);
    setProductsOpen(false);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200/80 dark:border-slate-800 bg-white/95 dark:bg-slate-950/95 backdrop-blur-md transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-700 flex items-center justify-center text-white shadow-lg shadow-emerald-600/25 group-hover:scale-105 transition-transform">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div className="flex flex-col">
            <span className="font-extrabold text-2xl tracking-tight text-slate-900 dark:text-white flex items-center gap-1">
              Loan<span className="text-emerald-700 dark:text-emerald-400">Pilot</span>
            </span>
            <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500 dark:text-slate-400 -mt-1">
              Trusted Digital Loan Partner
            </span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden lg:flex items-center gap-7">
          <button
            onClick={() => scrollToSection('hero')}
            className="text-sm font-semibold text-slate-700 hover:text-emerald-700 dark:text-slate-300 dark:hover:text-emerald-400 transition-colors"
          >
            Home
          </button>
          
          <button
            onClick={() => scrollToSection('about')}
            className="text-sm font-semibold text-slate-700 hover:text-emerald-700 dark:text-slate-300 dark:hover:text-emerald-400 transition-colors"
          >
            About Us
          </button>

          {/* Products Dropdown */}
          <div className="relative group" onMouseEnter={() => setProductsOpen(true)} onMouseLeave={() => setProductsOpen(false)}>
            <button
              onClick={() => scrollToSection('products')}
              className="flex items-center gap-1 text-sm font-semibold text-slate-700 hover:text-emerald-700 dark:text-slate-300 dark:hover:text-emerald-400 transition-colors py-2"
            >
              Products <ChevronDown className="w-4 h-4 transition-transform group-hover:rotate-180" />
            </button>

            {productsOpen && (
              <div className="absolute top-full left-0 w-64 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-2 py-3 grid gap-1">
                {[
                  { title: "Personal Loan", rate: "10.5% onwards" },
                  { title: "Home Loan", rate: "7.35% onwards" },
                  { title: "Loan Against Property", rate: "8.35% onwards" },
                  { title: "Business Loan", rate: "14.0% onwards" },
                  { title: "Car Loan", rate: "7.75% onwards" },
                  { title: "Education Loan", rate: "8.0% onwards" },
                  { title: "Credit Card", rate: "Bank Terms" },
                ].map((p) => (
                  <button
                    key={p.title}
                    onClick={() => {
                      setProductsOpen(false);
                      if (onSelectProduct) {
                        onSelectProduct(p.title);
                      } else {
                        scrollToSection('products');
                      }
                    }}
                    className="w-full text-left px-3.5 py-2 rounded-xl text-xs hover:bg-emerald-50 dark:hover:bg-slate-800 flex justify-between items-center group/item transition-colors"
                  >
                    <span className="font-semibold text-slate-800 dark:text-slate-200 group-hover/item:text-emerald-700 dark:group-hover/item:text-emerald-400">{p.title}</span>
                    <span className="text-[10px] bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full text-slate-500 font-medium">{p.rate}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={() => scrollToSection('features')}
            className="text-sm font-semibold text-slate-700 hover:text-emerald-700 dark:text-slate-300 dark:hover:text-emerald-400 transition-colors"
          >
            Why Us
          </button>

          <button
            onClick={() => scrollToSection('process')}
            className="text-sm font-semibold text-slate-700 hover:text-emerald-700 dark:text-slate-300 dark:hover:text-emerald-400 transition-colors"
          >
            Process
          </button>
        </nav>

        {/* Action Controls */}
        <div className="flex items-center gap-3">
          <button
            onClick={toggleDarkMode}
            className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors"
            title="Toggle theme"
          >
            {darkMode ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5" />}
          </button>

          <button
            onClick={() => scrollToSection('apply-form')}
            className="hidden sm:inline-flex items-center gap-2 bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-bold px-5 py-2.5 rounded-full shadow-md shadow-emerald-700/30 transition-all hover:shadow-lg hover:shadow-emerald-700/40 hover:-translate-y-0.5"
          >
            <span>Inquiry For Loan</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          {/* Mobile menu trigger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 px-4 py-6 flex flex-col gap-4 animate-in slide-in-from-top duration-200">
          <button
            onClick={() => scrollToSection('hero')}
            className="text-left font-semibold text-slate-800 dark:text-slate-200 py-2 border-b border-slate-100 dark:border-slate-900"
          >
            Home
          </button>
          <button
            onClick={() => scrollToSection('about')}
            className="text-left font-semibold text-slate-800 dark:text-slate-200 py-2 border-b border-slate-100 dark:border-slate-900"
          >
            About Us
          </button>
          <button
            onClick={() => scrollToSection('products')}
            className="text-left font-semibold text-slate-800 dark:text-slate-200 py-2 border-b border-slate-100 dark:border-slate-900"
          >
            Products
          </button>
          <button
            onClick={() => scrollToSection('features')}
            className="text-left font-semibold text-slate-800 dark:text-slate-200 py-2 border-b border-slate-100 dark:border-slate-900"
          >
            Why Choose Us
          </button>
          <button
            onClick={() => scrollToSection('process')}
            className="text-left font-semibold text-slate-800 dark:text-slate-200 py-2 border-b border-slate-100 dark:border-slate-900"
          >
            How It Works
          </button>

          <button
            onClick={() => scrollToSection('apply-form')}
            className="w-full mt-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-700/30"
          >
            Inquiry For Loan Now <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </header>
  );
}
