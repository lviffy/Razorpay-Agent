"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { useAuth } from "@/lib/context/auth-context";

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refreshUser } = useAuth();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = searchParams.get("token");
    const errParam = searchParams.get("error");

    if (errParam) {
      setError(decodeURIComponent(errParam));
      return;
    }

    if (token) {
      try {
        localStorage.setItem("zapai_auth_token", token);
        document.cookie = `zapai_auth_token=${token}; path=/; max-age=2592000; SameSite=Lax`;
        refreshUser().then(() => {
          router.replace("/dashboard");
        });
      } catch (e: any) {
        setError(e.message || "Failed to persist authentication session.");
      }
    } else {
      router.replace("/login");
    }
  }, [searchParams, router, refreshUser]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-zinc-50">
        <div className="w-full max-w-md bg-white border border-red-200 rounded-2xl p-6 text-center space-y-4 shadow-xl">
          <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-base font-bold text-zinc-900 font-display">Authentication Error</h2>
          <p className="text-xs text-zinc-500">{error}</p>
          <button
            onClick={() => router.push("/login")}
            className="w-full py-2 bg-zinc-900 text-white rounded-xl text-xs font-semibold hover:bg-zinc-800"
          >
            Return to Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-zinc-50">
      <div className="w-full max-w-sm bg-white border border-zinc-200 rounded-2xl p-6 text-center space-y-4 shadow-xl">
        <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto animate-pulse">
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
        <h2 className="text-base font-bold text-zinc-900 font-display">Completing Google Sign In</h2>
        <p className="text-xs text-zinc-500">Securing your session with Neon DB...</p>
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center p-4 bg-zinc-50">
          <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
        </div>
      }
    >
      <AuthCallbackContent />
    </Suspense>
  );
}
