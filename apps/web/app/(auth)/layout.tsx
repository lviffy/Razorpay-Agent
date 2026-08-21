import React from "react";
import Link from "next/link";
import { ShieldCheck } from "lucide-react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#fafbfc] flex flex-col items-center justify-center p-6 select-none relative overflow-hidden">
      {/* Subtle radial ambient glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-brand-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="mb-6 flex items-center gap-3 relative z-10">
        <div className="w-9 h-9 bg-brand-500 rounded-xl flex items-center justify-center font-extrabold text-white text-base shadow-glow-blue">
          A
        </div>
        <Link href="/" className="font-display font-extrabold text-xl text-surface-900 tracking-tight">
          Agent<span className="text-brand-600">Bridge</span>
        </Link>
      </div>

      <div className="w-full max-w-sm bg-white border border-surface-200 rounded-2xl p-7 shadow-card relative z-10">
        {children}
      </div>

      <div className="mt-6 text-center text-xs text-surface-500 flex items-center gap-1.5 font-mono relative z-10">
        <ShieldCheck className="w-3.5 h-3.5 text-brand-500" />
        <span>Protected by Razorpay Enterprise Rails</span>
      </div>
    </div>
  );
}

