"use client";

import React, { useState } from "react";
import { Sidebar, MobileSidebarDrawer } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { StoreProvider } from "@/lib/context/store-context";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <StoreProvider>
      <div className="h-screen w-full bg-[#F8FAFC] flex text-slate-900 selection:bg-blue-500/20 selection:text-blue-700 overflow-hidden">
        {/* Desktop Persistent Razorpay Navy Sidebar */}
        <Sidebar />

        {/* Mobile Slide-Over Drawer Sidebar */}
        <MobileSidebarDrawer open={sidebarOpen} onOpenChange={setSidebarOpen} />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
          <Topbar onMenuClick={() => setSidebarOpen(true)} />
          <main className="flex-1 overflow-y-auto overflow-x-hidden p-3 sm:p-5 lg:p-8 w-full">
            <div className="max-w-[1360px] mx-auto w-full space-y-5 sm:space-y-6 pb-8">
              {children}
            </div>
          </main>
        </div>
      </div>
    </StoreProvider>
  );
}



