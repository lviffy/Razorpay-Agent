import React from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#F8FAFC] flex text-slate-900 selection:bg-blue-500/20 selection:text-blue-700">
      {/* Persistent Razorpay Navy Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar />
        <main className="flex-1 p-5 sm:p-6 lg:p-8 max-w-[1360px] w-full mx-auto space-y-6">
          {children}
        </main>
      </div>
    </div>
  );
}

