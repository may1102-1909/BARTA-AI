"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Lock, Mail, User, AlertCircle, CheckCircle2, Eye, EyeOff, Sparkles, ArrowLeft } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function AuthPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // If already logged in, offer quick redirect
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        // user already authenticated
      }
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      if (mode === "signin") {
        const { data, error: err } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

        if (err) throw err;

        if (data.user) {
          setSuccessMsg("Signed in successfully! Redirecting to BARTA workspace...");
          setTimeout(() => {
            router.push("/dashboard");
          }, 600);
        }
      } else {
        const { data, error: err } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: {
              full_name: fullName.trim(),
            },
          },
        });

        if (err) throw err;

        if (data.session) {
          setSuccessMsg("Account created! Redirecting to BARTA workspace...");
          setTimeout(() => {
            router.push("/dashboard");
          }, 800);
        } else {
          setSuccessMsg(
            "Account registered! You can now sign in with your email and password."
          );
          setMode("signin");
        }
      }
    } catch (err: any) {
      setError(err?.message || "An error occurred during authentication.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F3F6FA] flex flex-col justify-between selection:bg-[#0B1D3A] selection:text-white font-sans">
      {/* Top Header */}
      <header className="w-full border-b border-[#DFE5EE] bg-white py-4 px-6 sm:px-12">
        <div className="max-w-[1080px] mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="h-[38px] w-[38px] rounded-[10px] bg-[#0B1D3A] flex items-center justify-center text-white shadow-sm transition-transform group-hover:scale-105">
              <span className="font-serif text-[22px] font-bold leading-none select-none">
                बा
              </span>
            </div>
            <span className="font-sans text-[20px] font-extrabold tracking-tight text-[#0B1D3A]">
              barta ai
            </span>
          </Link>

          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#637086] hover:text-[#0B1D3A] transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Home
          </Link>
        </div>
      </header>

      {/* Main Auth Form Container */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-[440px] bg-white rounded-[24px] border border-[#DFE5EE] shadow-sm p-6 sm:p-10">
          {/* Logo & Heading */}
          <div className="text-center mb-8">
            <div className="inline-flex h-12 w-12 rounded-[14px] bg-[#0B1D3A] items-center justify-center text-white mb-3 shadow-md">
              <span className="font-serif text-[28px] font-bold leading-none select-none">
                बा
              </span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-[#0B1D3A]">
              {mode === "signin" ? "Sign in to Barta AI" : "Create your Barta account"}
            </h1>
            <p className="text-xs text-[#637086] mt-1.5 max-w-[280px] mx-auto">
              {mode === "signin"
                ? "Enter your credentials to access your voice sales agent workspace"
                : "Set up your account to start automating voice sales calls"}
            </p>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="flex rounded-[10px] bg-[#F3F6FA] p-1 mb-6 border border-[#DFE5EE]/60">
            <button
              type="button"
              onClick={() => {
                setMode("signin");
                setError(null);
                setSuccessMsg(null);
              }}
              className={`flex-1 py-2 text-xs font-bold rounded-[8px] transition-all duration-150 ${
                mode === "signin"
                  ? "bg-white text-[#0B1D3A] shadow-xs"
                  : "text-[#637086] hover:text-[#0B1D3A]"
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("signup");
                setError(null);
                setSuccessMsg(null);
              }}
              className={`flex-1 py-2 text-xs font-bold rounded-[8px] transition-all duration-150 ${
                mode === "signup"
                  ? "bg-white text-[#0B1D3A] shadow-xs"
                  : "text-[#637086] hover:text-[#0B1D3A]"
              }`}
            >
              Create Account
            </button>
          </div>

          {/* Feedback Banners */}
          {error && (
            <div className="mb-5 rounded-[12px] bg-rose-50 border border-rose-200 p-3 flex items-start gap-2.5 text-xs text-rose-800">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
              <div className="leading-relaxed">{error}</div>
            </div>
          )}

          {successMsg && (
            <div className="mb-5 rounded-[12px] bg-emerald-50 border border-emerald-200 p-3 flex items-start gap-2.5 text-xs text-emerald-800">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 mt-0.5" />
              <div className="leading-relaxed font-medium">{successMsg}</div>
            </div>
          )}

          {/* Auth Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "signup" && (
              <div>
                <label className="block text-xs font-bold text-[#0B1D3A] mb-1.5 uppercase tracking-wider">
                  Full Name
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                    <User className="h-4 w-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Tanmay Sharma"
                    className="w-full rounded-[10px] border border-[#DFE5EE] bg-white py-2.5 pl-9 pr-3 text-xs text-[#0B1D3A] placeholder-[#637086]/60 focus:border-[#0B1D3A] focus:outline-none focus:ring-1 focus:ring-[#0B1D3A] transition"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-[#0B1D3A] mb-1.5 uppercase tracking-wider">
                Email Address
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  className="w-full rounded-[10px] border border-[#DFE5EE] bg-white py-2.5 pl-9 pr-3 text-xs text-[#0B1D3A] placeholder-[#637086]/60 focus:border-[#0B1D3A] focus:outline-none focus:ring-1 focus:ring-[#0B1D3A] transition"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-[#0B1D3A] uppercase tracking-wider">
                  Password
                </label>
              </div>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-[10px] border border-[#DFE5EE] bg-white py-2.5 pl-9 pr-10 text-xs text-[#0B1D3A] placeholder-[#637086]/60 focus:border-[#0B1D3A] focus:outline-none focus:ring-1 focus:ring-[#0B1D3A] transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 rounded-[10px] bg-[#0B1D3A] py-3 px-4 text-xs font-semibold text-white hover:bg-[#0B1D3A]/90 active:bg-[#0B1D3A]/80 transition-all disabled:opacity-50 shadow-sm"
              >
                {loading ? (
                  <span className="inline-flex items-center gap-2">
                    <span className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Processing...
                  </span>
                ) : (
                  <>
                    <span>{mode === "signin" ? "Sign In to Barta" : "Create Account"}</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Quick Demo Bypass Button */}
          <div className="mt-6 pt-6 border-t border-[#DFE5EE] text-center space-y-3">
            <p className="text-[11px] text-[#637086]">
              Evaluating or exploring live calling features?
            </p>
            <Link
              href="/dashboard"
              className="w-full inline-flex items-center justify-center gap-2 rounded-[10px] bg-[#F3F6FA] border border-[#DFE5EE] py-2.5 px-4 text-xs font-bold text-[#0B1D3A] hover:bg-slate-100 transition-colors"
            >
              <Sparkles className="h-3.5 w-3.5 text-[#4169BC]" />
              Explore Workspace Directly
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-[#DFE5EE] bg-white py-4 px-6 text-center text-xs text-[#637086]">
        <p>© 2026 Barta AI · Built for better conversations.</p>
      </footer>
    </div>
  );
}
