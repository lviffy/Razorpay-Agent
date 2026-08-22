import React from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-screen w-full bg-[#F8FAFC] flex text-slate-900 selection:bg-blue-500/20 selection:text-blue-700 overflow-hidden">
      {/* Persistent Razorpay Navy Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <Topbar />
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-5 sm:p-6 lg:p-8 w-full">
          <div className="max-w-[1360px] mx-auto w-full space-y-6 pb-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}


