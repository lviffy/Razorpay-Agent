"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mail, Lock, Eye, EyeOff, ArrowRight, Loader2, Sparkles, AlertCircle, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/lib/context/auth-context";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, loginWithGoogle } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotSent, setForgotSent] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const errorParam = searchParams.get("error");
    if (errorParam) {
      setErrorMsg(decodeURIComponent(errorParam));
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!email || !password) {
      setErrorMsg("Please enter both email and password.");
      return;
    }

    setLoading(true);
    try {
      const res = await login({ email, password, rememberMe });
      if (res.success) {
        if (res.user && res.user.onboardingCompleted === false) {
          router.push("/onboarding");
        } else {
          router.push("/dashboard");
        }
      } else {
        setErrorMsg(res.error || "Authentication failed. Please check your credentials.");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setGoogleLoading(true);
    setErrorMsg("");
    try {
      const res = await loginWithGoogle();
      if (res.success) {
        if (res.redirecting) {
          return;
        }
        if (res.user && res.user.onboardingCompleted) {
          router.push("/dashboard");
        } else {
          router.push("/onboarding");
        }
      } else {
        setErrorMsg(res.error || "Failed to sign in with Google.");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Google sign in error.");
    } finally {
      setGoogleLoading(false);
    }
  };

  const fillDemoCredentials = () => {
    setEmail("merchant@runfast.in");
    setPassword("password123");
    setErrorMsg("");
  };

  const handleForgotSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail) return;
    setForgotSent(true);
  };

  return (
    <div className="space-y-5">
      {/* Header & Tabs */}
      <div className="space-y-3">
        <div className="flex bg-surface-100 p-1 rounded-xl border border-surface-200 text-xs font-semibold">
          <div className="flex-1 py-1.5 text-center bg-white text-surface-900 rounded-lg border border-surface-200">
            Sign In
          </div>
          <Link
            href="/signup"
            className="flex-1 py-1.5 text-center text-surface-500 hover:text-surface-900 rounded-lg transition-colors"
          >
            Create Account
          </Link>
        </div>

        <div>
          <h2 className="text-xl font-bold text-surface-900 font-display">Welcome Back</h2>
          <p className="text-xs text-surface-500 mt-1">
            Access your AI seller agent, catalog, and WhatsApp revenue engine.
          </p>
        </div>
      </div>

      {/* Google Sign-in Button */}
      <div>
        <button
          type="button"
          onClick={handleGoogleAuth}
          disabled={loading || googleLoading}
          className="w-full flex items-center justify-center gap-2.5 py-2.5 px-4 bg-white hover:bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-semibold text-zinc-800 transition-all shadow-2xs hover:shadow-xs active:scale-[0.99] disabled:opacity-60 cursor-pointer"
        >
          {googleLoading ? (
            <Loader2 className="w-4 h-4 animate-spin text-zinc-600" />
          ) : (
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
          )}
          <span>{googleLoading ? "Connecting to Google..." : "Continue with Google"}</span>
        </button>
      </div>

      {/* Divider */}
      <div className="relative flex items-center justify-center">
        <div className="border-t border-surface-200 w-full" />
        <span className="bg-white px-3 text-[11px] text-surface-400 uppercase tracking-wider font-mono absolute">
          or continue with email
        </span>
      </div>

      {/* Error Feedback */}
      {errorMsg && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-xs text-red-700">
          <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Main Login Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Email Address */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-surface-800 flex items-center justify-between">
            <span>Work Email</span>
          </label>
          <div className="relative">
            <Mail className="w-4 h-4 text-surface-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="merchant@yourbrand.com"
              className="pl-10 h-10 rounded-xl bg-white border-surface-200 focus:border-brand-500 text-sm"
              required
            />
          </div>
        </div>

        {/* Password */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-surface-800">Password</label>
            <button
              type="button"
              onClick={() => setForgotOpen(true)}
              className="text-[11px] font-semibold text-brand-600 hover:text-brand-700 hover:underline transition-colors"
            >
              Forgot password?
            </button>
          </div>
          <div className="relative">
            <Lock className="w-4 h-4 text-surface-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <Input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="pl-10 pr-10 h-10 rounded-xl bg-white border-surface-200 focus:border-brand-500 text-sm"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-700 transition-colors p-0.5"
              tabIndex={-1}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Remember Me Checkbox */}
        <div className="flex items-center justify-between pt-0.5">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="w-4 h-4 rounded border-surface-300 text-brand-600 focus:ring-brand-500 accent-brand-600"
            />
            <span className="text-xs text-surface-600 font-medium">Remember this device</span>
          </label>
        </div>

        {/* Sign In Submit Button */}
        <Button
          type="submit"
          disabled={loading}
          className="w-full h-10 bg-brand-500 hover:bg-brand-600 text-white font-semibold rounded-xl text-xs gap-2 border border-brand-600"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Authenticating...</span>
            </>
          ) : (
            <>
              <span>Sign In to Merchant Console</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </>
          )}
        </Button>
      </form>

      {/* Demo Credentials Quick-Fill Helper */}
      <div className="pt-2">
        <button
          type="button"
          onClick={fillDemoCredentials}
          className="w-full py-2 px-3 rounded-xl bg-surface-50 hover:bg-surface-100 border border-surface-200 text-surface-600 hover:text-surface-900 transition-all flex items-center justify-between text-xs font-mono group"
        >
          <span className="flex items-center gap-1.5 text-[11px]">
            <Sparkles className="w-3.5 h-3.5 text-brand-600 group-hover:scale-110 transition-transform" />
            <span>⚡ Demo Quick-Fill:</span>
          </span>
          <span className="text-[11px] text-brand-600 font-semibold underline underline-offset-2">
            Fill Demo Account
          </span>
        </button>
      </div>

      {/* Switch to Signup */}
      <div className="pt-2 border-t border-surface-100 text-center text-xs text-surface-500">
        Don&apos;t have an account?{" "}
        <Link href="/signup" className="text-brand-600 font-semibold hover:underline">
          Create merchant account
        </Link>
      </div>

      {/* Forgot Password Inline Modal */}
      {forgotOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-white rounded-2xl border border-surface-200 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-surface-900 font-display">Reset Password</h3>
              <button
                onClick={() => {
                  setForgotOpen(false);
                  setForgotSent(false);
                }}
                className="text-xs text-surface-400 hover:text-surface-700"
              >
                Close
              </button>
            </div>

            {forgotSent ? (
              <div className="space-y-3">
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-xs text-emerald-800">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>
                    Password reset link sent to <strong>{forgotEmail}</strong>. Please check your inbox.
                  </span>
                </div>
                <Button
                  onClick={() => {
                    setForgotOpen(false);
                    setForgotSent(false);
                  }}
                  className="w-full text-xs rounded-xl"
                >
                  Return to Sign In
                </Button>
              </div>
            ) : (
              <form onSubmit={handleForgotSubmit} className="space-y-3">
                <p className="text-xs text-surface-500">
                  Enter your registered work email address and we will send you a secure link to reset your password.
                </p>
                <Input
                  type="email"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  placeholder="merchant@yourbrand.com"
                  required
                  className="rounded-xl text-sm"
                />
                <Button type="submit" className="w-full text-xs rounded-xl">
                  Send Recovery Link
                </Button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-zinc-50"><Loader2 className="w-8 h-8 text-blue-600 animate-spin" /></div>}>
      <LoginForm />
    </Suspense>
  );
}

