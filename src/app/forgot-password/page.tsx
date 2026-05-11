"use client";
import { useState } from "react";
import Link from "next/link";
import { Mail, ArrowLeft, Loader2, CheckCircle } from "lucide-react";
import { api } from "@/lib/api";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) { setError("Please enter your email address"); return; }
    setError("");
    setLoading(true);
    try {
      await api.post("/api/auth/forgot-password", { email: email.trim() });
      setSent(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-[#0f1118]">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="text-2xl font-bold text-white mb-1">Bet<span className="text-[#00d46e]">Nexus</span></div>
          <p className="text-sm text-[#5a6485]">The Smart Betting Platform</p>
        </div>

        <div className="bg-[#161925] border border-[#2a3050] rounded-2xl p-6">
          {sent ? (
            <div className="text-center py-4">
              <div className="w-16 h-16 bg-[#00d46e]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-[#00d46e]" />
              </div>
              <h2 className="text-lg font-bold text-white mb-2">Check Your Email</h2>
              <p className="text-sm text-[#8b95b8] mb-6">
                If an account with that email exists, we&apos;ve sent a password reset link. It expires in 1 hour.
              </p>
              <Link href="/login" className="text-sm text-[#00d46e] hover:text-[#00b85c] font-medium">
                Back to Login
              </Link>
            </div>
          ) : (
            <>
              <Link href="/login" className="flex items-center gap-1.5 text-xs text-[#5a6485] hover:text-white transition-colors mb-5">
                <ArrowLeft className="w-3.5 h-3.5" /> Back to Login
              </Link>
              <h2 className="text-xl font-bold text-white mb-1">Forgot Password?</h2>
              <p className="text-sm text-[#8b95b8] mb-6">
                Enter your email and we&apos;ll send you a link to reset your password.
              </p>

              {error && (
                <div className="bg-[#ff4757]/10 border border-[#ff4757]/30 rounded-xl px-4 py-3 mb-4 text-xs text-[#ff4757]">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-[#8b95b8] mb-1.5">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5a6485]" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full bg-[#0f1118] border border-[#2a3050] rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-[#5a6485] focus:outline-none focus:border-[#00d46e]/50"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-[#00d46e] to-[#00b85c] text-white font-bold py-3 rounded-xl text-sm hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                  {loading ? "Sending..." : "Send Reset Link"}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
