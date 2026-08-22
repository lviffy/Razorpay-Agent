"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/context/auth-context";
import { Sidebar, MobileSidebarDrawer } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { StoreProvider } from "@/lib/context/store-context";
import { Loader2 } from "lucide-react";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, isLoading, isAuthenticated } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated || !user) {
      router.replace("/login");
      return;
    }

    if (user.onboardingCompleted === false) {
      router.replace("/onboarding");
    }
  }, [user, isLoading, isAuthenticated, router]);

  // Show loading screen while auth state is resolving
  if (isLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-[#F8FAFC]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
          <p className="text-xs text-slate-500 font-medium">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  // Don't render dashboard if not authenticated or not onboarded yet (redirect pending)
  if (!isAuthenticated || !user || user.onboardingCompleted === false) {
    return null;
  }

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
