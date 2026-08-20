"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      // Direct redirect to conversational onboarding
      router.push("/onboarding");
    }, 400);
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-base font-bold text-surface-900">Create Merchant Account</h2>
        <p className="text-xs text-surface-500 mt-0.5">
          Get started with your AI-native storefront in 3 minutes.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="space-y-1">
          <label className="text-xs font-semibold text-surface-700">Email Address</label>
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="merchant@yourbrand.com"
            required
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-semibold text-surface-700">Password</label>
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
          />
        </div>

        <Button type="submit" variant="primary" className="w-full text-xs" disabled={loading}>
          {loading ? "Creating Account..." : "Continue to Onboarding"}
        </Button>
      </form>

      <div className="pt-3 border-t border-surface-100 text-center text-xs text-surface-500">
        Already have an account?{" "}
        <Link href="/login" className="text-brand-600 font-semibold hover:underline">
          Sign in
        </Link>
      </div>
    </div>
  );
}
