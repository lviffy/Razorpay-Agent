import React from "react";
import Link from "next/link";
import { ShieldCheck } from "lucide-react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen apple-canvas flex flex-col items-center justify-center p-6 select-none relative overflow-hidden">
      {/* Subtle radial ambient glow */}
      <div 
        aria-hidden="true"
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-[radial-gradient(circle,rgba(25,90,220,0.07)_0%,transparent_70%)] blur-3xl pointer-events-none" 
      />

      <div className="mb-6 flex items-center gap-3 relative z-10">
        <div className="w-9 h-9 bg-brand-500 rounded-[0.875rem] flex items-center justify-center font-extrabold text-white text-base shadow-[inset_0_1px_1px_rgba(255,255,255,0.4),0_6px_16px_rgba(25,90,220,0.3)]">
          A
        </div>
        <Link href="/" className="font-display font-extrabold text-xl text-surface-900 tracking-tight">
          Agent<span className="text-brand-600">Bridge</span>
        </Link>
      </div>

      <div className="w-full max-w-sm apple-card-elevated rounded-[1.75rem] p-8 relative z-10">
        {children}
      </div>

      <div className="mt-6 text-center text-xs text-surface-500 flex items-center gap-1.5 font-mono relative z-10">
        <ShieldCheck className="w-3.5 h-3.5 text-brand-500" />
        <span>Protected by Razorpay Enterprise Rails</span>
      </div>
    </div>
  );
}

