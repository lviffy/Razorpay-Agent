"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Mail,
  Lock,
  User,
  Building2,
  Eye,
  EyeOff,
  ArrowRight,
  Loader2,
  Check,
  AlertCircle,
} from "lucide-react";

export default function SignupPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [storeName, setStoreName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [ssoLoading, setSsoLoading] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

  // Password Strength Calculation
  const hasMinLength = password.length >= 8;
  const hasNumberOrSymbol = /[0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
  const hasMixedCase = /[a-z]/.test(password) && /[A-Z]/.test(password);

  const strengthScore = [hasMinLength, hasNumberOrSymbol, hasMixedCase].filter(Boolean).length;
  const strengthColor =
    strengthScore === 3
      ? "bg-emerald-500"
      : strengthScore === 2
      ? "bg-amber-500"
      : strengthScore === 1
      ? "bg-red-500"
      : "bg-surface-200";

  const strengthLabel =
    strengthScore === 3
      ? "Strong"
      : strengthScore === 2
      ? "Medium"
      : strengthScore === 1
      ? "Weak"
      : "Empty";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!email || !password || !fullName) {
      setErrorMsg("Please fill in all required fields.");
      return;
    }

    if (!hasMinLength) {
      setErrorMsg("Password must be at least 8 characters.");
      return;
    }

    setLoading(true);
    setTimeout(() => {
      // Direct redirect to conversational onboarding assistant
      router.push("/onboarding");
    }, 600);
  };

  const handleSSO = (provider: string) => {
    setSsoLoading(provider);
    setTimeout(() => {
      router.push("/onboarding");
    }, 600);
  };

  return (
    <div className="space-y-5">
      {/* Header & Tabs */}
      <div className="space-y-3">
        <div className="flex bg-surface-100 p-1 rounded-xl border border-surface-200 text-xs font-semibold">
          <Link
            href="/login"
            className="flex-1 py-1.5 text-center text-surface-500 hover:text-surface-900 rounded-lg transition-colors"
          >
            Sign In
          </Link>
          <div className="flex-1 py-1.5 text-center bg-white text-surface-900 rounded-lg border border-surface-200">
            Create Account
          </div>
        </div>

        <div>
          <h2 className="text-xl font-bold text-surface-900 font-display">Create Merchant Account</h2>
          <p className="text-xs text-surface-500 mt-1">
            Deploy your autonomous Razorpay AI sales agent in under 3 minutes.
          </p>
        </div>
      </div>

      {/* SSO Buttons */}
      <div className="grid grid-cols-2 gap-2.5">
        <button
          type="button"
          onClick={() => handleSSO("google")}
          disabled={loading || ssoLoading !== null}
          className="flex items-center justify-center gap-2 py-2 px-3 bg-white hover:bg-surface-50 border border-surface-200 rounded-xl text-xs font-semibold text-surface-800 transition-colors disabled:opacity-60"
        >
          {ssoLoading === "google" ? (
            <Loader2 className="w-4 h-4 animate-spin text-surface-600" />
          ) : (
            <svg className="w-4 h-4" viewBox="0 0 24 24">
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
          <span>Google</span>
        </button>

        <button
          type="button"
          onClick={() => handleSSO("github")}
          disabled={loading || ssoLoading !== null}
          className="flex items-center justify-center gap-2 py-2 px-3 bg-white hover:bg-surface-50 border border-surface-200 rounded-xl text-xs font-semibold text-surface-800 transition-colors disabled:opacity-60"
        >
          {ssoLoading === "github" ? (
            <Loader2 className="w-4 h-4 animate-spin text-surface-600" />
          ) : (
            <svg className="w-4 h-4 fill-current text-surface-900" viewBox="0 0 24 24">
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
              />
            </svg>
          )}
          <span>GitHub</span>
        </button>
      </div>

      {/* Divider */}
      <div className="relative flex items-center justify-center">
        <div className="border-t border-surface-200 w-full" />
        <span className="bg-white px-3 text-[11px] text-surface-400 uppercase tracking-wider font-mono absolute">
          or sign up with email
        </span>
      </div>

      {/* Error Feedback */}
      {errorMsg && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-xs text-red-700">
          <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Main Signup Form */}
      <form onSubmit={handleSubmit} className="space-y-3.5">
        {/* Full Name & Brand Name in 2 columns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-surface-800">Full Name</label>
            <div className="relative">
              <User className="w-4 h-4 text-surface-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <Input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Alex Rivera"
                className="pl-9 h-9 rounded-xl bg-white border-surface-200 focus:border-brand-500 text-xs"
                required
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-surface-800">
              Brand / Store <span className="text-surface-400 font-normal">(optional)</span>
            </label>
            <div className="relative">
              <Building2 className="w-4 h-4 text-surface-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <Input
                type="text"
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                placeholder="RunFast Sports"
                className="pl-9 h-9 rounded-xl bg-white border-surface-200 focus:border-brand-500 text-xs"
              />
            </div>
          </div>
        </div>

        {/* Email Address */}
        <div className="space-y-1">
          <label className="text-xs font-semibold text-surface-800">Work Email</label>
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
        <div className="space-y-1">
          <label className="text-xs font-semibold text-surface-800">Password</label>
          <div className="relative">
            <Lock className="w-4 h-4 text-surface-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <Input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Create a strong password"
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

          {/* Password Strength Indicator */}
          {password.length > 0 && (
            <div className="pt-1.5 space-y-1.5">
              <div className="flex items-center justify-between text-[11px] text-surface-500">
                <span>Strength</span>
                <span className="font-semibold text-surface-700">{strengthLabel}</span>
              </div>
              <div className="w-full bg-surface-100 rounded-full h-1.5 overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${strengthColor}`}
                  style={{ width: `${(strengthScore / 3) * 100}%` }}
                />
              </div>
              <div className="flex items-center gap-3 text-[11px] text-surface-500">
                <span className={`flex items-center gap-1 ${hasMinLength ? "text-emerald-600 font-medium" : ""}`}>
                  <Check className="w-3 h-3" /> 8+ chars
                </span>
                <span className={`flex items-center gap-1 ${hasNumberOrSymbol ? "text-emerald-600 font-medium" : ""}`}>
                  <Check className="w-3 h-3" /> Number/symbol
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Legal Disclaimer */}
        <p className="text-[11px] text-surface-500 leading-relaxed pt-1">
          By continuing, you agree to AgentBridge&apos;s{" "}
          <a href="#terms" className="text-brand-600 underline underline-offset-2">
            Terms of Service
          </a>{" "}
          and{" "}
          <a href="#privacy" className="text-brand-600 underline underline-offset-2">
            Privacy Policy
          </a>
          .
        </p>

        {/* Submit Button */}
        <Button
          type="submit"
          disabled={loading}
          className="w-full h-10 bg-brand-500 hover:bg-brand-600 text-white font-semibold rounded-xl text-xs gap-2 border border-brand-600"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Creating Merchant Account...</span>
            </>
          ) : (
            <>
              <span>Continue to AI Setup Assistant</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </>
          )}
        </Button>
      </form>

      {/* Switch to Login */}
      <div className="pt-2 border-t border-surface-100 text-center text-xs text-surface-500">
        Already have an account?{" "}
        <Link href="/login" className="text-brand-600 font-semibold hover:underline">
          Sign in
        </Link>
      </div>
    </div>
  );
}

