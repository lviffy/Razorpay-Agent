import React from "react";
import Link from "next/link";
import { ShieldCheck, Lock } from "lucide-react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen apple-canvas flex flex-col items-center justify-center p-4 sm:p-6 select-none relative overflow-hidden">
      {/* Brand Header */}
      <div className="mb-6 flex flex-col items-center gap-2 relative z-10">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-10 h-10 bg-brand-500 rounded-xl flex items-center justify-center font-extrabold text-white text-lg border border-brand-600 group-hover:bg-brand-600 transition-colors">
            Z
          </div>
          <span className="font-display font-extrabold text-2xl text-surface-900 tracking-tight">
            Zap<span className="text-brand-600">AI</span>
          </span>
        </Link>
      </div>

      {/* Main Authentication Card */}
      <div className="w-full max-w-[440px] bg-white border border-surface-200 rounded-2xl p-6 sm:p-8 relative z-10">
        {children}
      </div>

      {/* Trust & Enterprise Security Footer */}
      <div className="mt-8 flex flex-col items-center gap-3 text-center text-xs text-surface-500 relative z-10">
        <div className="flex flex-wrap items-center justify-center gap-4 text-[11px] font-mono text-surface-600">
          <div className="flex items-center gap-1.5 bg-white border border-surface-200 px-2.5 py-1 rounded-full">
            <ShieldCheck className="w-3.5 h-3.5 text-brand-600" />
            <span>Razorpay Enterprise Partner</span>
          </div>
          <div className="flex items-center gap-1.5 bg-white border border-surface-200 px-2.5 py-1 rounded-full">
            <Lock className="w-3.5 h-3.5 text-emerald-600" />
            <span>256-Bit TLS Encrypted</span>
          </div>
        </div>

        <div className="flex items-center gap-3 text-[11px] text-surface-400">
          <Link href="/" className="hover:text-surface-700 transition-colors">
            Home
          </Link>
          <span>•</span>
          <a href="#support" className="hover:text-surface-700 transition-colors">
            Help & Support
          </a>
          <span>•</span>
          <a href="#privacy" className="hover:text-surface-700 transition-colors">
            Privacy Policy
          </a>
          <span>•</span>
          <a href="#terms" className="hover:text-surface-700 transition-colors">
            Terms of Service
          </a>
        </div>
      </div>
    </div>
  );
}


