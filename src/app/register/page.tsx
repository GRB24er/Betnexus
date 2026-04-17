"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Zap, Eye, EyeOff, Mail, Lock, User, Phone, Calendar, Loader2 } from "lucide-react";
import { sessionStore } from "@/store/session";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    dob: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [agreedTerms, setAgreedTerms] = useState(false);
  const [agreedAge, setAgreedAge] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const update = (field: string, value: string) =>
    setForm({ ...form, [field]: value });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    const [firstName, ...rest] = form.fullName.trim().split(/\s+/);
    const lastName = rest.join(" ") || firstName;
    setSubmitting(true);
    try {
      await sessionStore.register({
        email: form.email,
        password: form.password,
        firstName,
        lastName,
        phone: form.phone,
        dateOfBirth: form.dob,
      });
      router.push("/account");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-4">
            <div className="w-10 h-10 rounded-xl gradient-green flex items-center justify-center">
              <Zap className="w-6 h-6 text-white" fill="white" />
            </div>
            <span className="text-2xl font-bold text-white">
              Bet<span className="text-[#00d46e]">Nexus</span>
            </span>
          </Link>
          <h1 className="text-xl font-bold text-white mb-1">Create Account</h1>
          <p className="text-sm text-[#5a6485]">
            Join BetNexus and start winning today
          </p>
        </div>

        {/* Form */}
        <div className="bg-[#161925] border border-[#2a3050] rounded-2xl p-6 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full Name */}
            <div>
              <label className="text-xs font-medium text-[#8b95b8] mb-1.5 block">Full Name</label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5a6485]" />
                <input
                  type="text"
                  value={form.fullName}
                  onChange={(e) => update("fullName", e.target.value)}
                  placeholder="John Doe"
                  className="w-full bg-[#0f1118] border border-[#2a3050] rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-[#5a6485] focus:outline-none focus:border-[#00d46e]/50 focus:ring-1 focus:ring-[#00d46e]/20 transition-all"
                  required
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="text-xs font-medium text-[#8b95b8] mb-1.5 block">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5a6485]" />
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => update("email", e.target.value)}
                  placeholder="you@example.com"
                  className="w-full bg-[#0f1118] border border-[#2a3050] rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-[#5a6485] focus:outline-none focus:border-[#00d46e]/50 focus:ring-1 focus:ring-[#00d46e]/20 transition-all"
                  required
                />
              </div>
            </div>

            {/* Phone */}
            <div>
              <label className="text-xs font-medium text-[#8b95b8] mb-1.5 block">Phone Number</label>
              <div className="relative">
                <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5a6485]" />
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => update("phone", e.target.value)}
                  placeholder="024 XXX XXXX"
                  className="w-full bg-[#0f1118] border border-[#2a3050] rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-[#5a6485] focus:outline-none focus:border-[#00d46e]/50 focus:ring-1 focus:ring-[#00d46e]/20 transition-all"
                  required
                />
              </div>
            </div>

            {/* Date of Birth */}
            <div>
              <label className="text-xs font-medium text-[#8b95b8] mb-1.5 block">Date of Birth</label>
              <div className="relative">
                <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5a6485]" />
                <input
                  type="date"
                  value={form.dob}
                  onChange={(e) => update("dob", e.target.value)}
                  className="w-full bg-[#0f1118] border border-[#2a3050] rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-[#5a6485] focus:outline-none focus:border-[#00d46e]/50 focus:ring-1 focus:ring-[#00d46e]/20 transition-all"
                  required
                />
              </div>
              <p className="text-[10px] text-[#5a6485] mt-1">You must be 18 or older to register</p>
            </div>

            {/* Password */}
            <div>
              <label className="text-xs font-medium text-[#8b95b8] mb-1.5 block">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5a6485]" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={(e) => update("password", e.target.value)}
                  placeholder="Min. 8 characters"
                  className="w-full bg-[#0f1118] border border-[#2a3050] rounded-xl pl-10 pr-10 py-3 text-sm text-white placeholder-[#5a6485] focus:outline-none focus:border-[#00d46e]/50 focus:ring-1 focus:ring-[#00d46e]/20 transition-all"
                  required
                  minLength={8}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#5a6485] hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="text-xs font-medium text-[#8b95b8] mb-1.5 block">Confirm Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5a6485]" />
                <input
                  type="password"
                  value={form.confirmPassword}
                  onChange={(e) => update("confirmPassword", e.target.value)}
                  placeholder="Repeat your password"
                  className="w-full bg-[#0f1118] border border-[#2a3050] rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-[#5a6485] focus:outline-none focus:border-[#00d46e]/50 focus:ring-1 focus:ring-[#00d46e]/20 transition-all"
                  required
                />
              </div>
            </div>

            {/* Agreements */}
            <div className="space-y-3 pt-2">
              <label className="flex items-start gap-2.5 cursor-pointer">
                <button
                  type="button"
                  onClick={() => setAgreedTerms(!agreedTerms)}
                  className={`w-4 h-4 mt-0.5 rounded border flex items-center justify-center shrink-0 transition-all ${
                    agreedTerms ? "bg-[#00d46e] border-[#00d46e]" : "border-[#2a3050] bg-[#0f1118]"
                  }`}
                >
                  {agreedTerms && (
                    <svg className="w-3 h-3 text-white" viewBox="0 0 12 12" fill="none"><path d="M2 6L5 9L10 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  )}
                </button>
                <span className="text-xs text-[#8b95b8]">
                  I agree to the{" "}
                  <Link href="/help" className="text-[#3b82f6] hover:underline">Terms of Service</Link> and{" "}
                  <Link href="/help" className="text-[#3b82f6] hover:underline">Privacy Policy</Link>
                </span>
              </label>
              <label className="flex items-start gap-2.5 cursor-pointer">
                <button
                  type="button"
                  onClick={() => setAgreedAge(!agreedAge)}
                  className={`w-4 h-4 mt-0.5 rounded border flex items-center justify-center shrink-0 transition-all ${
                    agreedAge ? "bg-[#00d46e] border-[#00d46e]" : "border-[#2a3050] bg-[#0f1118]"
                  }`}
                >
                  {agreedAge && (
                    <svg className="w-3 h-3 text-white" viewBox="0 0 12 12" fill="none"><path d="M2 6L5 9L10 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  )}
                </button>
                <span className="text-xs text-[#8b95b8]">
                  I confirm I am at least 18 years old and agree to{" "}
                  <Link href="/responsible-gaming" className="text-[#3b82f6] hover:underline">Responsible Gaming</Link> guidelines
                </span>
              </label>
            </div>

            {error && (
              <div className="bg-[#ff4757]/10 border border-[#ff4757]/30 rounded-xl px-3 py-2 text-xs text-[#ff4757]">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={!agreedTerms || !agreedAge || submitting}
              className="w-full gradient-green text-white font-bold text-sm py-3.5 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {submitting ? "Creating Account..." : "Create Account"}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-[#5a6485] mt-6">
          Already have an account?{" "}
          <Link href="/login" className="text-[#00d46e] font-semibold hover:underline">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}
