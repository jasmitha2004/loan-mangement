'use client';

import React, { useState, useEffect } from 'react';
import UserHeader from '@/components/UserHeader';
import Footer from '@/components/Footer';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { apiClient } from '@/lib/api';
import { 
  ShieldCheck, User, Building, ArrowRight, ArrowLeft, CheckCircle2, 
  AlertTriangle, XCircle, Sparkles, CreditCard, IdCard, Car, 
  GraduationCap, Briefcase, Landmark, Percent, ChevronRight, Lock, 
  Headphones, Award, Layers, Clock, Users, ArrowUpRight, ChevronLeft, X
} from 'lucide-react';

const formSchema = z.object({
  full_name: z.string().min(2, "Full name must be at least 2 characters"),
  mobile_number: z.string().regex(/^[6-9]\d{9}$/, "Must be a valid 10-digit Indian mobile number starting with 6-9"),
  email: z.string().email("Please enter a valid email address"),
  pan_number: z
    .string()
    .transform((val) => val.trim().toUpperCase())
    .pipe(
      z.string().regex(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, "PAN Card must be 10 characters in format ABCDE1234F")
    ),
  aadhaar_number: z
    .string()
    .transform((val) => val.replace(/\s+/g, ''))
    .pipe(
      z.string().regex(/^\d{12}$/, "Aadhaar Card must be a valid 12-digit number")
    ),
  date_of_birth: z.string().refine((dobStr) => {
    if (!dobStr) return false;
    const dob = new Date(dobStr);
    const today = new Date();
    const age = today.getFullYear() - dob.getFullYear() - ((today.getMonth(), today.getDate()) < (dob.getMonth(), dob.getDate()) ? 1 : 0);
    return age >= 21 && age <= 60;
  }, "Applicant age must be between 21 and 60 years"),
  city: z.string().min(2, "City is required"),
  state: z.string().min(2, "State is required"),
  pincode: z.string().regex(/^\d{6}$/, "Pincode must be 6 digits"),
  loan_type: z.enum([
    "Home Loan",
    "Personal Loan",
    "Business Loan",
    "Loan Against Property",
    "Vehicle Loan",
    "Education Loan",
    "Gold Loan"
  ]),
  employment_type: z.enum(["Salaried", "Self Employed"]),
  monthly_income: z.number().min(10000, "Minimum monthly income is ₹10,000"),
  loan_amount: z.number().min(50000, "Minimum loan amount is ₹50,000"),
  property_value: z.number().min(0, "Property value cannot be negative"),
  consent_accepted: z.literal(true, {
    errorMap: () => ({ message: "You must accept data verification consent to proceed" }),
  }),
});

type FormValues = z.infer<typeof formSchema>;

const LOAN_PRODUCTS = [
  {
    id: "personal",
    name: "Personal Loan",
    formEnum: "Personal Loan",
    interest: "10.5% - onwards",
    description: "For personal expenses like marriage, travel, medical. No collateral/security. Flexible use.",
    features: [
      "No Collateral / Security Required",
      "Fast Disbursal within 24 Hours",
      "Flexible Repayment Tenure up to 5 Years",
      "Minimal Documentation & Paperless Verification"
    ],
    icon: User,
    color: "from-blue-600 to-indigo-600",
    badge: "Instant Approval",
  },
  {
    id: "creditcard",
    name: "Credit Cards",
    formEnum: "Personal Loan",
    interest: "As per bank terms",
    description: "For shopping, travel, and online payments. No collateral. Flexible pay-later and EMI options.",
    features: [
      "High Cashbacks & Accelerated Reward Points",
      "Zero Annual Fee / Lifetime Free Options",
      "Complimentary Airport Lounge Access & Dining Perks",
      "Flexible Fuel Surcharge Waivers & EMI Conversion"
    ],
    icon: CreditCard,
    color: "from-emerald-600 to-teal-600",
    badge: "Reward Points",
  },
  {
    id: "home",
    name: "Home Loan",
    formEnum: "Home Loan",
    interest: "7.35% - onwards",
    description: "For purchasing, constructing, or renovating a house. Includes top-up & balance transfer options.",
    features: [
      "Lowest Interest Rates starting from 7.35% p.a.",
      "Extended Tenure up to 30 Years for Low EMIs",
      "PMAY Subsidy & Tax Benefits under Sec 80C & 24B",
      "Top-Up Loan & Instant Balance Transfer Facility"
    ],
    icon: Landmark,
    color: "from-amber-600 to-orange-600",
    badge: "Low Interest Rate",
  },
  {
    id: "car",
    name: "Car Loan",
    formEnum: "Vehicle Loan",
    interest: "7.75% - onwards",
    description: "For new or used cars & refinancing — quick approval with 85–100% funding.",
    features: [
      "Up to 100% On-Road Funding for New Vehicles",
      "Refinancing & Pre-Owned Car Loans Available",
      "Flexible Repayment Tenure up to 7 Years",
      "Quick Paperless Sanction & Instant Processing"
    ],
    icon: Car,
    color: "from-purple-600 to-pink-600",
    badge: "Up to 100% Funding",
  },
  {
    id: "education",
    name: "Education Loan",
    formEnum: "Education Loan",
    interest: "8.0% - onwards",
    description: "Covers tuition, books, travel, hostel & living expenses for studies in India or abroad.",
    features: [
      "100% Funding for Tuition, Travel & Living Expenses",
      "Moratorium Period (No EMI during study duration)",
      "Tax Deduction on Interest paid under Section 80E",
      "Collateral-Free Options up to ₹50 Lakhs"
    ],
    icon: GraduationCap,
    color: "from-sky-600 to-blue-600",
    badge: "Global Studies",
  },
  {
    id: "unsecured_biz",
    name: "Unsecured Business Loan",
    formEnum: "Business Loan",
    interest: "14.0% - onwards",
    description: "For working capital, expansion, equipment purchase. Includes MSME, term loans & overdraft.",
    features: [
      "Zero Collateral / Property Security Needed",
      "Sanctions up to ₹1 Crore for Business Expansion",
      "Flexible Overdraft & Line of Credit Facilities",
      "Tailored for MSMEs, Retailers & Manufacturers"
    ],
    icon: Briefcase,
    color: "from-teal-600 to-emerald-700",
    badge: "Collateral Free",
  },
  {
    id: "lap",
    name: "Loan Against Property",
    formEnum: "Loan Against Property",
    interest: "8.35% - onwards",
    description: "Mortgage loan using residential/commercial property. Large amount, long tenure.",
    features: [
      "High Loan Amount up to 75% Property Value",
      "Accepts Residential, Commercial & Industrial Property",
      "Longer Repayment Tenure up to 15-20 Years",
      "Lower EMIs compared to Unsecured Personal Loans"
    ],
    icon: Building,
    color: "from-indigo-600 to-violet-700",
    badge: "High Loan Value",
  },
  {
    id: "secured_biz",
    name: "Secured Business Loan",
    formEnum: "Business Loan",
    interest: "7.35% - onwards",
    description: "Working capital, term loans, export credit, bill discounting, LOCs & guarantees.",
    features: [
      "Maximum Sanction Limits up to ₹25+ Crores",
      "Working Capital, Term Loan, Export Credit & LC",
      "Lowest Commercial Interest Rates with Top Banks",
      "Customized Repayment Schedules for Industry Cashflows"
    ],
    icon: ShieldCheck,
    color: "from-emerald-700 to-teal-800",
    badge: "Maximum Limits",
  },
];

const BANK_PARTNERS = [
  { name: "HDFC Bank", category: "Leading Private Bank", color: "bg-blue-900 text-white" },
  { name: "ICICI Bank", category: "Premier National Bank", color: "bg-orange-700 text-white" },
  { name: "Axis Bank", category: "Digital Banking Partner", color: "bg-rose-800 text-white" },
  { name: "State Bank of India", category: "Public Sector Giant", color: "bg-blue-600 text-white" },
  { name: "Aditya Birla Capital", category: "Financial Services", color: "bg-red-800 text-white" },
  { name: "Bajaj Finserv", category: "Instant NBFC Partner", color: "bg-sky-800 text-white" },
  { name: "Tata Capital", category: "Trusted Lending NBFC", color: "bg-indigo-900 text-white" },
  { name: "LendingKart", category: "MSME Fintech Lender", color: "bg-teal-700 text-white" },
  { name: "Faircent", category: "Peer-to-Peer Credit", color: "bg-emerald-800 text-white" },
];

export default function ApplicationPage() {
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<any>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [activeHeroSlide, setActiveHeroSlide] = useState(0);
  const [modalProduct, setModalProduct] = useState<any | null>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveHeroSlide((prev) => (prev + 1) % 4);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  const handleOpenModal = (productNameOrEnum: string) => {
    const query = productNameOrEnum.toLowerCase();
    const found = LOAN_PRODUCTS.find(p => 
      p.name.toLowerCase().includes(query) || 
      query.includes(p.name.toLowerCase()) || 
      p.formEnum.toLowerCase().includes(query) ||
      query.includes(p.formEnum.toLowerCase())
    ) || LOAN_PRODUCTS[0];
    setModalProduct(found);
  };

  const {
    register,
    handleSubmit,
    trigger,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      loan_type: "Home Loan",
      employment_type: "Salaried",
      consent_accepted: true,
      monthly_income: 50000,
      loan_amount: 2500000,
      property_value: 4000000,
    },
  });

  const selectedLoanType = watch("loan_type");

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSelectProduct = (formEnum: any) => {
    setValue('loan_type', formEnum);
    scrollToSection('apply-form');
  };

  const nextStep = async () => {
    let fieldsToValidate: (keyof FormValues)[] = [];
    if (step === 1) {
      fieldsToValidate = ['full_name', 'mobile_number', 'email', 'pan_number', 'aadhaar_number', 'date_of_birth', 'city', 'state', 'pincode'];
    } else if (step === 2) {
      fieldsToValidate = ['loan_type', 'employment_type', 'monthly_income', 'loan_amount', 'property_value'];
    }
    const isValid = await trigger(fieldsToValidate);
    if (isValid) {
      setStep((prev) => prev + 1);
    }
  };

  const prevStep = () => {
    setStep((prev) => Math.max(1, prev - 1));
  };

  const onSubmit = async (data: FormValues) => {
    setSubmitting(true);
    setApiError(null);
    try {
      const response = await apiClient.post('/leads/', data);
      setSubmissionResult(response.data);
    } catch (err: any) {
      const errMsg = err.response?.data?.message || err.response?.data?.errors?.mobile_number?.[0] || "Failed to process loan application. Please verify details.";
      setApiError(errMsg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col font-sans text-slate-900 dark:text-slate-100">
      <UserHeader onSelectProduct={handleOpenModal} />

      <main className="flex-1 w-full">
        
        {/* ========================================================================= */}
        {/* HERO SLIDER SECTION WITH DYNAMIC ANIMATIONS */}
        {/* ========================================================================= */}
        <section id="hero" className="relative bg-gradient-to-b from-emerald-950 via-slate-900 to-slate-950 text-white overflow-hidden py-16 lg:py-24">
          {/* Animated Background Ambient Orbs */}
          <motion.div 
            animate={{ 
              scale: [1, 1.2, 1],
              opacity: [0.15, 0.25, 0.15],
              x: [0, 20, 0],
              y: [0, -20, 0]
            }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-500/20 rounded-full filter blur-3xl pointer-events-none transform-gpu gpu-layer" 
          />
          <motion.div 
            animate={{ 
              scale: [1.2, 1, 1.2],
              opacity: [0.15, 0.3, 0.15],
              x: [0, -30, 0],
              y: [0, 30, 0]
            }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
            className="absolute bottom-0 right-1/4 w-96 h-96 bg-teal-500/20 rounded-full filter blur-3xl pointer-events-none transform-gpu gpu-layer" 
          />

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              
              {/* Left Column: Headlines & CTA */}
              <motion.div 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, ease: "easeOut" }}
                className="lg:col-span-7 space-y-6 text-center lg:text-left"
              >
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2, duration: 0.5 }}
                  className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold shadow-inner"
                >
                  <Sparkles className="w-4 h-4 text-emerald-400 animate-pulse" /> Official Channel Partner to Top Banks & NBFCs
                </motion.div>

                <motion.h1 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.7 }}
                  className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight"
                >
                  Smart Loan Eligibility. <br className="hidden sm:inline" />
                  <motion.span 
                    animate={{ backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] }}
                    transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
                    className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-[length:200%_auto]"
                  >
                    Faster Approvals.
                  </motion.span> <br />
                  Better Decisions.
                </motion.h1>

                <motion.p 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4, duration: 0.7 }}
                  className="text-slate-300 text-base sm:text-lg leading-relaxed max-w-2xl mx-auto lg:mx-0"
                >
                  LoanPilot is a secure digital platform that simplifies your loan journey by helping you check your eligibility, compare loan options, and connect with trusted banks and NBFCs—all in one place.
                </motion.p>

                {/* Hero CTAs */}
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5, duration: 0.7 }}
                  className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2"
                >
                  <motion.button
                    whileHover={{ scale: 1.05, boxShadow: "0 20px 30px -10px rgba(5, 150, 105, 0.5)" }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => scrollToSection('apply-form')}
                    className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-base px-8 py-4 rounded-full shadow-lg shadow-emerald-600/40 transition-all flex items-center justify-center gap-2"
                  >
                    <span>Check Eligibility Now</span>
                    <ArrowRight className="w-5 h-5" />
                  </motion.button>
                  
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => scrollToSection('products')}
                    className="w-full sm:w-auto bg-slate-800/80 hover:bg-slate-800 text-slate-200 border border-slate-700 font-semibold text-base px-7 py-4 rounded-full transition-colors flex items-center justify-center gap-2"
                  >
                    <span>Explore Products</span>
                    <ChevronRight className="w-5 h-5" />
                  </motion.button>
                </motion.div>

                {/* Feature Highlights Bar with Floating Animation */}
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6, duration: 0.7 }}
                  className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6 border-t border-slate-800 text-left"
                >
                  {[
                    { label: "Interest From", value: "7.35% p.a.", highlight: true },
                    { label: "Paperless", value: "100% Digital", highlight: false },
                    { label: "Partners", value: "50+ Banks", highlight: false },
                    { label: "Security", value: "Bank-Grade", highlight: true },
                  ].map((stat, i) => (
                    <motion.div
                      key={stat.label}
                      animate={{ y: [0, -4, 0] }}
                      transition={{ duration: 4, repeat: Infinity, delay: i * 0.5, ease: "easeInOut" }}
                    >
                      <div className="text-xs text-slate-400 uppercase font-semibold">{stat.label}</div>
                      <div className={`text-lg font-bold ${stat.highlight ? 'text-emerald-400' : 'text-white'}`}>
                        {stat.value}
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              </motion.div>

              {/* Right Column: Interactive Product Showcase Cards with Animations */}
              <motion.div 
                initial={{ opacity: 0, x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.3 }}
                className="lg:col-span-5"
              >
                <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-800/90 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden ring-1 ring-emerald-500/20">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
                    <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-400 animate-pulse" /> Instant Credit Evaluation
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono bg-slate-800 px-2.5 py-0.5 rounded-full border border-slate-700">
                      Live Engine
                    </span>
                  </div>

                  {/* Showcase Tabs */}
                  <div className="grid grid-cols-2 gap-2.5 mb-6">
                    {LOAN_PRODUCTS.slice(0, 4).map((p, idx) => (
                      <button
                        key={p.id}
                        onClick={() => setActiveHeroSlide(idx)}
                        className={`relative p-3 rounded-2xl text-left border transition-all overflow-hidden ${
                          activeHeroSlide === idx
                            ? 'bg-emerald-950/90 border-emerald-500 text-white shadow-lg shadow-emerald-950/50'
                            : 'bg-slate-800/40 border-slate-800/80 text-slate-400 hover:bg-slate-800/80 hover:text-slate-200'
                        }`}
                      >
                        <div className="text-xs font-semibold flex items-center justify-between">
                          <span>{p.name}</span>
                        </div>
                        <div className="text-[11px] text-emerald-400 font-medium mt-1">{p.interest}</div>
                        
                        {/* Slide auto-progress line */}
                        {activeHeroSlide === idx && (
                          <motion.div
                            key={activeHeroSlide}
                            initial={{ width: "0%" }}
                            animate={{ width: "100%" }}
                            transition={{ duration: 4, ease: "linear" }}
                            className="absolute bottom-0 left-0 h-1 bg-emerald-500"
                          />
                        )}
                      </button>
                    ))}
                  </div>

                  {/* Active Slide Info with Framer Motion AnimatePresence */}
                  <div className="relative min-h-[190px]">
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={activeHeroSlide}
                        initial={{ opacity: 0, y: 15, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -15, scale: 0.98 }}
                        transition={{ duration: 0.35, ease: "easeInOut" }}
                        className="bg-slate-950/80 rounded-2xl p-5 border border-slate-800 space-y-4 shadow-inner"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <motion.div 
                              whileHover={{ rotate: 15 }}
                              className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-md"
                            >
                              {React.createElement(LOAN_PRODUCTS[activeHeroSlide].icon, { className: "w-5 h-5" })}
                            </motion.div>
                            <div>
                              <h3 className="font-bold text-white text-base">{LOAN_PRODUCTS[activeHeroSlide].name}</h3>
                              <span className="text-xs text-emerald-400 font-semibold">{LOAN_PRODUCTS[activeHeroSlide].badge}</span>
                            </div>
                          </div>
                          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-800 border border-slate-700 text-slate-300">
                            {LOAN_PRODUCTS[activeHeroSlide].interest}
                          </span>
                        </div>

                        <p className="text-xs text-slate-300 leading-relaxed min-h-[36px]">
                          {LOAN_PRODUCTS[activeHeroSlide].description}
                        </p>

                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => handleSelectProduct(LOAN_PRODUCTS[activeHeroSlide].formEnum)}
                          className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl text-xs flex items-center justify-center gap-2 shadow-md shadow-emerald-600/30 transition-colors"
                        >
                          <span>Inquiry Now</span>
                          <ArrowRight className="w-4 h-4" />
                        </motion.button>
                      </motion.div>
                    </AnimatePresence>
                  </div>

                </div>
              </motion.div>

            </div>
          </div>
        </section>


        {/* ========================================================================= */}
        {/* "WHAT WE OFFER" SECTION (Comprehensive Loan Products Grid matching MoneyBeing.in) */}
        {/* ========================================================================= */}
        <section id="products" className="py-20 bg-slate-100 dark:bg-slate-900/50 transition-colors">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
              <span className="text-emerald-700 dark:text-emerald-400 font-extrabold text-xs uppercase tracking-widest px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800">
                What We Offer
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                Comprehensive Loan Products
              </h2>
              <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base">
                Tailored financial solutions for every customer profile with minimal documentation and fast approvals.
              </p>
            </div>

            {/* Products Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {LOAN_PRODUCTS.map((p) => {
                const IconComponent = p.icon;
                return (
                  <div
                    key={p.id}
                    className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-xl hover:border-emerald-500/50 transition-all group flex flex-col justify-between"
                  >
                    <div className="space-y-4">
                      {/* Badge & Icon */}
                      <div className="flex items-center justify-between">
                        <div className={`w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform`}>
                          <IconComponent className="w-6 h-6" />
                        </div>
                        <span className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                          {p.badge}
                        </span>
                      </div>

                      {/* Title & Interest */}
                      <div>
                        <h3 className="font-bold text-slate-900 dark:text-white text-lg group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">
                          {p.name}
                        </h3>
                        <div className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 mt-1">
                          Interest: {p.interest}
                        </div>
                      </div>

                      {/* Description */}
                      <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed min-h-[48px]">
                        {p.description}
                      </p>
                    </div>

                    {/* Inquiry Button */}
                    <div className="pt-6 border-t border-slate-100 dark:border-slate-800/80 mt-6">
                      <button
                        onClick={() => handleSelectProduct(p.formEnum)}
                        className="w-full bg-slate-50 hover:bg-emerald-700 dark:bg-slate-800 dark:hover:bg-emerald-700 text-slate-800 dark:text-slate-200 hover:text-white dark:hover:text-white font-bold py-2.5 px-4 rounded-xl text-xs transition-all flex items-center justify-center gap-2 group/btn shadow-xs"
                      >
                        <span>Inquiry Now</span>
                        <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>


        {/* ========================================================================= */}
        {/* "AMAZING PARTNERS" SECTION (Bank & NBFC Partner Carousel) */}
        {/* ========================================================================= */}
        <section id="partners" className="py-16 bg-white dark:bg-slate-950 border-y border-slate-200/80 dark:border-slate-900 overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8 text-center">
            <span className="text-xs font-extrabold uppercase tracking-widest text-slate-400 dark:text-slate-500">
              Trusted Network
            </span>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
              Amazing Banking Partners
            </h3>
          </div>

          <div className="flex space-x-6 overflow-x-auto pb-4 pt-2 no-scrollbar px-4 max-w-7xl mx-auto justify-start md:justify-center">
            {BANK_PARTNERS.map((partner, idx) => (
              <div
                key={idx}
                className="shrink-0 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-6 py-4 rounded-2xl flex flex-col items-center justify-center text-center shadow-xs hover:border-emerald-500 transition-colors w-44"
              >
                <div className="font-extrabold text-sm text-slate-900 dark:text-white">{partner.name}</div>
                <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold mt-1">{partner.category}</div>
              </div>
            ))}
          </div>
        </section>


        {/* ========================================================================= */}
        {/* "WHAT MAKES US DIFFERENT" SECTION (Why Us Feature Grid matching MoneyBeing.in) */}
        {/* ========================================================================= */}
        <section id="features" className="py-20 bg-slate-50 dark:bg-slate-950">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
              <span className="text-emerald-700 dark:text-emerald-400 font-extrabold text-xs uppercase tracking-widest px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800">
                What Makes Us Different
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                How LoanPilot Makes Finance Simple for You
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {[
                {
                  step: "01",
                  title: "Lender Access",
                  desc: "Get connected to multiple lending partners for the best possible deals.",
                  icon: Users,
                  color: "emerald"
                },
                {
                  step: "02",
                  title: "Secure & Transparent",
                  desc: "Get loans you can trust – secure, transparent, and free from hidden charges.",
                  icon: Lock,
                  color: "blue"
                },
                {
                  step: "03",
                  title: "Expert Support Always",
                  desc: "Dedicated loan professionals to guide you through every stage.",
                  icon: Headphones,
                  color: "teal"
                },
                {
                  step: "04",
                  title: "Post Disbursal Service",
                  desc: "Ongoing support for all loan-related queries and services after disbursement.",
                  icon: Award,
                  color: "indigo"
                }
              ].map((feat) => {
                const FeatIcon = feat.icon;
                return (
                  <div
                    key={feat.title}
                    className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group hover:border-emerald-500 transition-all"
                  >
                    <div className="text-4xl font-extrabold text-slate-200 dark:text-slate-800 mb-4 group-hover:text-emerald-500/20 transition-colors">
                      {feat.step}
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-6">
                      <FeatIcon className="w-6 h-6" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">
                      {feat.title}
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                      {feat.desc}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>


        {/* ========================================================================= */}
        {/* "GET STARTED WITH EASE" SECTION (3-Step Simple Process matching MoneyBeing.in) */}
        {/* ========================================================================= */}
        <section id="process" className="py-20 bg-emerald-950 text-white relative overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
              <span className="text-emerald-400 font-extrabold text-xs uppercase tracking-widest px-3 py-1 rounded-full bg-emerald-900/60 border border-emerald-800">
                Get Started with Ease
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
                The Process Is Simple!
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
              {[
                {
                  num: "1",
                  title: "Fill Out the Form",
                  desc: "Submit your basic details and loan needs using our secure and user-friendly online form."
                },
                {
                  num: "2",
                  title: "Our Team Will Reach Out",
                  desc: "A loan expert will contact you shortly to understand your goals and answer any questions."
                },
                {
                  num: "3",
                  title: "Discuss & Finalize Your Loan",
                  desc: "Review personalized loan options and choose the best fit with help from our team."
                }
              ].map((item) => (
                <div
                  key={item.num}
                  className="bg-slate-900/80 border border-slate-800 rounded-3xl p-8 relative flex flex-col justify-between"
                >
                  <div>
                    <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white font-extrabold text-xl flex items-center justify-center mb-6 shadow-md shadow-emerald-600/30">
                      {item.num}
                    </div>
                    <h3 className="text-xl font-bold text-white mb-3">{item.title}</h3>
                    <p className="text-xs text-slate-300 leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="text-center">
              <button
                onClick={() => scrollToSection('apply-form')}
                className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold px-8 py-4 rounded-full text-sm shadow-xl transition-all hover:scale-105"
              >
                Inquiry for Loans ⟶
              </button>
            </div>
          </div>
        </section>


        {/* ========================================================================= */}
        {/* CORE APPLICATION FORM SECTION (Interactive Multi-Step Eligibility Calculator) */}
        {/* ========================================================================= */}
        <section id="apply-form" className="py-20 bg-slate-50 dark:bg-slate-950 scroll-mt-20">
          <div className="max-w-4xl w-full mx-auto px-4">
            
            {/* Header */}
            <div className="text-center mb-10 space-y-3">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-semibold">
                <Sparkles className="w-3.5 h-3.5" /> Identity & Credit Verification Application
              </div>
              <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                Check Your Bank Loan Eligibility
              </h2>
              <p className="text-slate-600 dark:text-slate-400 text-sm max-w-xl mx-auto">
                Instant eligibility evaluation using PAN Card, Aadhaar Card & Credit Bureau CIBIL Score verification.
              </p>
            </div>

            {/* Multi-Step Indicator */}
            <div className="flex items-center justify-center gap-4 mb-10">
              {[
                { num: 1, label: "Identity & Personal Details" },
                { num: 2, label: "Loan Request" },
                { num: 3, label: "Consent & Submit" },
              ].map((s) => (
                <div key={s.num} className="flex items-center gap-2">
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs transition-colors ${
                      step === s.num
                        ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/30'
                        : step > s.num
                        ? 'bg-emerald-700 text-white'
                        : 'bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                    }`}
                  >
                    {step > s.num ? <CheckCircle2 className="w-5 h-5" /> : s.num}
                  </div>
                  <span className="hidden sm:inline text-xs font-semibold text-slate-700 dark:text-slate-300">
                    {s.label}
                  </span>
                  {s.num < 3 && <div className="w-8 sm:w-12 h-0.5 bg-slate-200 dark:bg-slate-800" />}
                </div>
              ))}
            </div>

            {/* Application Card */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xl p-6 md:p-10">
              {submissionResult ? (
                /* Application Result Screen */
                <div className="space-y-6">
                  <div className="flex items-center gap-4 p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200">
                    <CheckCircle2 className="w-10 h-10 text-emerald-600 shrink-0" />
                    <div>
                      <h3 className="font-extrabold text-lg">Application Evaluated Successfully!</h3>
                      <p className="text-xs text-emerald-700 dark:text-emerald-300">
                        Lead Reference Code: <strong>{submissionResult.lead_reference || submissionResult.id || 'LP-98214'}</strong>
                      </p>
                    </div>
                  </div>

                  {/* Summary Details Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 text-xs">
                    <div>
                      <span className="text-slate-400">Applicant:</span>
                      <p className="font-bold text-slate-900 dark:text-white">{submissionResult.full_name}</p>
                    </div>
                    <div>
                      <span className="text-slate-400">Loan Type:</span>
                      <p className="font-bold text-emerald-600 dark:text-emerald-400">{submissionResult.loan_type}</p>
                    </div>
                    <div>
                      <span className="text-slate-400">CIBIL Score:</span>
                      <p className="font-bold text-slate-900 dark:text-white">{submissionResult.cibil_score || 750}</p>
                    </div>
                    <div>
                      <span className="text-slate-400">Status:</span>
                      <span className="inline-block px-2 py-0.5 rounded-full font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200">
                        {submissionResult.status || 'Eligible'}
                      </span>
                    </div>
                  </div>

                  {/* Recommended Partner Offers */}
                  {submissionResult.eligible_offers && submissionResult.eligible_offers.length > 0 && (
                    <div className="space-y-3 pt-4">
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white">Recommended Bank & NBFC Offers:</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {submissionResult.eligible_offers.map((offer: any, idx: number) => (
                          <div key={idx} className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="font-extrabold text-sm text-slate-900 dark:text-white">{offer.lender_name}</span>
                              <span className="text-xs font-bold text-emerald-600">{offer.interest_rate}% p.a.</span>
                            </div>
                            <div className="text-xs text-slate-500">
                              Max Loan: <strong>₹{offer.max_amount?.toLocaleString('en-IN')}</strong> | EMI: <strong>₹{offer.estimated_emi?.toLocaleString('en-IN')}/mo</strong>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <button
                    onClick={() => {
                      setSubmissionResult(null);
                      setStep(1);
                    }}
                    className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3.5 rounded-2xl text-xs transition-colors"
                  >
                    Submit Another Inquiry
                  </button>
                </div>
              ) : (
                /* Multi-Step Form */
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                  {apiError && (
                    <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs flex items-center gap-3">
                      <AlertTriangle className="w-5 h-5 shrink-0" />
                      <span>{apiError}</span>
                    </div>
                  )}

                  <AnimatePresence mode="wait">
                    {step === 1 && (
                      <motion.div
                        key="step1"
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        className="space-y-4"
                      >
                        <h3 className="text-base font-extrabold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center gap-2">
                          <User className="w-5 h-5 text-emerald-600" /> Applicant Identity & Personal Details
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                              Full Name (As per PAN Card) *
                            </label>
                            <input
                              {...register("full_name")}
                              placeholder="e.g. Rajesh Kumar Sharma"
                              className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                            />
                            {errors.full_name && <p className="text-[11px] text-red-500 mt-1">{errors.full_name.message}</p>}
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                              Mobile Number (Linked with Aadhaar) *
                            </label>
                            <input
                              {...register("mobile_number")}
                              placeholder="10-digit Mobile Number"
                              className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                            />
                            {errors.mobile_number && <p className="text-[11px] text-red-500 mt-1">{errors.mobile_number.message}</p>}
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                              Email Address *
                            </label>
                            <input
                              {...register("email")}
                              type="email"
                              placeholder="rajesh.sharma@example.com"
                              className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                            />
                            {errors.email && <p className="text-[11px] text-red-500 mt-1">{errors.email.message}</p>}
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                              PAN Card Number *
                            </label>
                            <input
                              {...register("pan_number")}
                              placeholder="ABCDE1234F"
                              maxLength={10}
                              className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 uppercase outline-none"
                            />
                            {errors.pan_number && <p className="text-[11px] text-red-500 mt-1">{errors.pan_number.message}</p>}
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                              Aadhaar Card Number *
                            </label>
                            <input
                              {...register("aadhaar_number")}
                              placeholder="12-digit Aadhaar Number"
                              maxLength={12}
                              className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                            />
                            {errors.aadhaar_number && <p className="text-[11px] text-red-500 mt-1">{errors.aadhaar_number.message}</p>}
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                              Date of Birth *
                            </label>
                            <input
                              {...register("date_of_birth")}
                              type="date"
                              className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                            />
                            {errors.date_of_birth && <p className="text-[11px] text-red-500 mt-1">{errors.date_of_birth.message}</p>}
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">City *</label>
                            <input
                              {...register("city")}
                              placeholder="e.g. Mumbai"
                              className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                            />
                            {errors.city && <p className="text-[11px] text-red-500 mt-1">{errors.city.message}</p>}
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">State & Pincode *</label>
                            <div className="grid grid-cols-2 gap-2">
                              <input
                                {...register("state")}
                                placeholder="State"
                                className="w-full px-3 py-2.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none"
                              />
                              <input
                                {...register("pincode")}
                                placeholder="Pincode"
                                maxLength={6}
                                className="w-full px-3 py-2.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none"
                              />
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {step === 2 && (
                      <motion.div
                        key="step2"
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        className="space-y-4"
                      >
                        <h3 className="text-base font-extrabold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center gap-2">
                          <Building className="w-5 h-5 text-emerald-600" /> Financial Requirement & Loan Request
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Select Loan Type *</label>
                            <select
                              {...register("loan_type")}
                              className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                            >
                              <option value="Home Loan">Home Loan</option>
                              <option value="Personal Loan">Personal Loan</option>
                              <option value="Business Loan">Business Loan</option>
                              <option value="Loan Against Property">Loan Against Property (LAP)</option>
                              <option value="Vehicle Loan">Vehicle / Car Loan</option>
                              <option value="Education Loan">Education Loan</option>
                              <option value="Gold Loan">Gold Loan</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Employment Type *</label>
                            <select
                              {...register("employment_type")}
                              className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                            >
                              <option value="Salaried">Salaried Professional</option>
                              <option value="Self Employed">Self-Employed / Business Owner</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Monthly Gross Income (₹) *</label>
                            <input
                              {...register("monthly_income", { valueAsNumber: true })}
                              type="number"
                              className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                            />
                            {errors.monthly_income && <p className="text-[11px] text-red-500 mt-1">{errors.monthly_income.message}</p>}
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Required Loan Amount (₹) *</label>
                            <input
                              {...register("loan_amount", { valueAsNumber: true })}
                              type="number"
                              className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                            />
                            {errors.loan_amount && <p className="text-[11px] text-red-500 mt-1">{errors.loan_amount.message}</p>}
                          </div>

                          {(selectedLoanType === "Home Loan" || selectedLoanType === "Loan Against Property") && (
                            <div className="md:col-span-2">
                              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                Estimated Property Value (₹) *
                              </label>
                              <input
                                {...register("property_value", { valueAsNumber: true })}
                                type="number"
                                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                              />
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}

                    {step === 3 && (
                      <motion.div
                        key="step3"
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        className="space-y-4"
                      >
                        <h3 className="text-base font-extrabold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center gap-2">
                          <Lock className="w-5 h-5 text-emerald-600" /> Consent & Evaluation Submission
                        </h3>

                        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300 space-y-2">
                          <p className="font-semibold text-slate-900 dark:text-white">Customer Authorization Notice:</p>
                          <p>
                            By proceeding, you grant permission to verify your <strong>Aadhaar Card</strong>, <strong>PAN Card</strong>, and fetch your official <strong>CIBIL Credit Score</strong> to perform real-time dynamic loan eligibility evaluation.
                          </p>
                        </div>

                        <div className="flex items-start gap-3 pt-2">
                          <input
                            {...register("consent_accepted")}
                            type="checkbox"
                            id="consent"
                            className="mt-1 w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                          />
                          <label htmlFor="consent" className="text-xs text-slate-700 dark:text-slate-300">
                            I confirm and authorize LoanPilot to verify my Aadhaar, PAN card, and CIBIL credit score with authorized lending institutions. *
                          </label>
                        </div>
                        {errors.consent_accepted && (
                          <p className="text-xs text-red-500">{errors.consent_accepted.message}</p>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Step Controls */}
                  <div className="flex items-center justify-between pt-6 border-t border-slate-100 dark:border-slate-800 mt-6">
                    {step > 1 ? (
                      <button
                        type="button"
                        onClick={prevStep}
                        className="px-5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold flex items-center gap-2 hover:bg-slate-100 dark:hover:bg-slate-800"
                      >
                        <ArrowLeft className="w-4 h-4" /> Previous
                      </button>
                    ) : (
                      <div />
                    )}

                    {step < 3 ? (
                      <button
                        type="button"
                        onClick={nextStep}
                        className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-2 shadow-md shadow-emerald-600/30"
                      >
                        Next Step <ArrowRight className="w-4 h-4" />
                      </button>
                    ) : (
                      <button
                        type="submit"
                        disabled={submitting}
                        className="px-8 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-800 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-emerald-600/30 transition-all"
                      >
                        {submitting ? (
                          <>Evaluating Profile & CIBIL...</>
                        ) : (
                          <>Submit & Evaluate Eligibility <CheckCircle2 className="w-4 h-4" /></>
                        )}
                      </button>
                    )}
                  </div>
                </form>
              )}
            </div>

          </div>
        </section>


        {/* ========================================================================= */}
        {/* "ABOUT LOANPILOT" SECTION (Complete details requested by user) */}
        {/* ========================================================================= */}
        <section id="about" className="py-20 bg-white dark:bg-slate-900 border-t border-slate-200/80 dark:border-slate-800">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-slate-50 dark:bg-slate-950/80 rounded-3xl p-8 sm:p-12 border border-slate-200/80 dark:border-slate-800 shadow-xl space-y-6">
              
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-xs font-extrabold uppercase tracking-wider">
                <ShieldCheck className="w-4 h-4 text-emerald-600" /> About LoanPilot Private Limited
              </div>

              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight">
                Welcome to LoanPilot – Smart Loan Eligibility. Faster Approvals. Better Decisions.
              </h2>

              <div className="space-y-4 text-slate-700 dark:text-slate-300 text-sm sm:text-base leading-relaxed">
                <p>
                  <strong>LoanPilot</strong> is a secure digital platform that simplifies your loan journey by helping you check your eligibility, compare loan options, and connect with trusted banks and NBFCs—all in one place.
                </p>
                <p>
                  Whether you're applying for a <strong>Home Loan</strong> or a <strong>Loan Against Property (LAP)</strong>, our intelligent eligibility engine evaluates your profile using key factors such as income, property value, and credit score to provide quick, transparent results.
                </p>
                <p>
                  With expert loan advisors, a paperless application process, and real-time updates, we make borrowing faster, easier, and more reliable. Your personal information is protected with industry-standard security and is shared only with authorized lending partners after your explicit consent.
                </p>
                <p>
                  From instant eligibility checks to personalized loan recommendations and end-to-end assistance until disbursal, LoanPilot is designed to help you make confident financial decisions with complete transparency and convenience.
                </p>
              </div>

              <div className="pt-6 border-t border-slate-200 dark:border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-semibold text-slate-800 dark:text-slate-200">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>50+ Partner Banks</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Paperless Process</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Real-Time Updates</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>100% Data Protection</span>
                </div>
              </div>

            </div>
          </div>
        </section>

      </main>

      <Footer onSelectProduct={handleOpenModal} />

      {/* Product Detail Pop-Up Modal */}
      <AnimatePresence>
        {modalProduct && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl relative space-y-6"
            >
              <button
                onClick={() => setModalProduct(null)}
                className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Modal Header */}
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-600 text-white flex items-center justify-center shadow-lg shadow-emerald-600/30 shrink-0">
                  {React.createElement(modalProduct.icon, { className: "w-7 h-7" })}
                </div>
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/80 px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                    {modalProduct.badge}
                  </span>
                  <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
                    {modalProduct.name}
                  </h3>
                  <div className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 mt-0.5">
                    Interest Rate: {modalProduct.interest}
                  </div>
                </div>
              </div>

              {/* Description */}
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                {modalProduct.description}
              </p>

              {/* Key Features Checkmarks */}
              <div className="space-y-2.5">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Key Features & Benefits:
                </h4>
                <div className="grid grid-cols-1 gap-2">
                  {modalProduct.features?.map((feat: string, idx: number) => (
                    <div key={idx} className="flex items-center gap-2.5 text-xs text-slate-700 dark:text-slate-300 font-medium">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Modal Actions */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center gap-3">
                <button
                  onClick={() => {
                    handleSelectProduct(modalProduct.formEnum);
                    setModalProduct(null);
                  }}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3.5 px-6 rounded-2xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 transition-all hover:scale-[1.02]"
                >
                  <span>Inquiry & Check Eligibility Now</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                
                <button
                  onClick={() => setModalProduct(null)}
                  className="w-full sm:w-auto px-5 py-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
