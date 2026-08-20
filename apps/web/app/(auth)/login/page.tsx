"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("merchant@runfast.in");
  const [password, setPassword] = useState("password123");
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      router.push("/dashboard");
    }, 400);
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-base font-bold text-surface-900">Sign in to AgentBridge</h2>
        <p className="text-xs text-surface-500 mt-0.5">
          Access your AI seller agent and storefront telemetry.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="space-y-1">
          <label className="text-xs font-semibold text-surface-700">Email Address</label>
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-surface-700">Password</label>
            <span className="text-[11px] text-brand-600 hover:underline cursor-pointer">
              Forgot?
            </span>
          </div>
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        <Button type="submit" variant="primary" className="w-full text-xs" disabled={loading}>
          {loading ? "Authenticating..." : "Sign In"}
        </Button>
      </form>

      <div className="pt-3 border-t border-surface-100 text-center text-xs text-surface-500">
        Don&apos;t have an account?{" "}
        <Link href="/signup" className="text-brand-600 font-semibold hover:underline">
          Sign up
        </Link>
      </div>
    </div>
  );
}
