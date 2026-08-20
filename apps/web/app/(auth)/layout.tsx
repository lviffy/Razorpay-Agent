import React from "react";
import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#F4F6F8] flex flex-col items-center justify-center p-6 select-none">
      <div className="mb-6 flex items-center gap-2.5">
        <div className="w-8 h-8 bg-[#0C83FD] rounded flex items-center justify-center font-bold text-white text-base">
          A
        </div>
        <Link href="/" className="font-bold text-lg text-surface-900 tracking-tight">
          AgentBridge
        </Link>
      </div>

      <div className="w-full max-w-sm bg-white border border-surface-200 rounded-md p-6 shadow-subtle">
        {children}
      </div>

      <div className="mt-6 text-center text-xs text-surface-400">
        <span>Protected by Razorpay Enterprise Security</span>
      </div>
    </div>
  );
}
