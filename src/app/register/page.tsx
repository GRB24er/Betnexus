"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Zap, Eye, EyeOff, Mail, Lock, User, Phone, Calendar, Loader2, Gift, Shield, TrendingUp } from "lucide-react";
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
    <div className="min-h-screen flex">
      {/* Left Side — Branding (hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 gradient-hero-premium relative items-center justify-center p-12">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/3 right-1/4 w-72 h-72 bg-[#00d46e] rounded-full blur-[180px] opacity-[0.06]" />
          <div className="absolute bottom-1/3 left-1/4 w-56 h-56 bg-[#8b5cf6] rounded-full blur-[150px] opacity-[0.05]" />
        </div>
        <div className="relative max-w-md">
          <Link href="/" className="inline-flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-xl gradient-green flex items-center justify-center glow-green-strong">
              <Zap className="w-7 h-7 text-white" fill="white" />
            </div>
            <span className="text-3xl font-extrabold text-white">
              Bet<span className="text-gradient-green">Nexus</span>
            </span>
          </Link>
          <h2 className="text-3xl font-extrabold text-white leading-tight mb-4">
            Join the Winning<br />Community Today.
          </h2>
          <p className="text-base text-[#8b95b8] mb-8">
            Create your account in seconds and start betting on live sports with real odds from top leagues worldwide.
          </p>
          <div className="space-y-4">
            {[
              { icon: <Gift className="w-4 h-4" />, text: "Welcome bonus on your first deposit", color: "text-[#00d46e]" },
              { icon: <TrendingUp className="w-4 h-4" />, text: "16+ leagues with live betting", color: "text-[#3b82f6]" },
              { icon: <Shield className="w-4 h-4" />, text: "Your data is encrypted & secure", color: "text-[#ffc107]" },
            ].map((item) => (
              <div key={item.text} className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg bg-[#1c2033] border border-[#2a3050] flex items-center justify-center ${item.color}`}>
                  {item.icon}
                </div>
                <span className="text-sm text-[#8b95b8]">{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Side — Register Form */}
      <div className="flex-1 flex items-center justify-center px-4 py-8 bg-[#0f1118]">
        <div className="w-full max-w-md fade-in-up">
          {/* Mobile Logo */}
          <div className="text-center mb-6 lg:hidden">
            <Link href="/" className="inline-flex items-center gap-2 mb-3">
              <div className="w-10 h-10 rounded-xl gradient-green flex items-center justify-center">
                <Zap className="w-6 h-6 text-white" fill="white" />
              </div>
              <span className="text-2xl font-bold text-white">
                Bet<span className="text-[#00d46e]">Nexus</span>
              </span>
            </Link>
          </div>

          <div className="mb-5 lg:mb-6">
            <h1 className="text-2xl font-extrabold text-white mb-1">Create Account</h1>
            <p className="text-sm text-[#5a6485]">Join BetNexus and start winning today</p>
          </div>

          {/* Form */}
          <div className="bg-[#161925] border border-[#2a3050] rounded-2xl p-6 sm:p-8">
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Full Name */}
              <div>
                <label className="text-xs font-medium text-[#8b95b8] mb-1.5 block">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5a6485]" />
                  <input type="text" value={form.fullName} onChange={(e) => update("fullName", e.target.value)} placeholder="John Doe" className="w-full bg-[#0f1118] border border-[#2a3050] rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-[#5a6485] focus:outline-none focus:border-[#00d46e]/50 focus:ring-1 focus:ring-[#00d46e]/20 transition-all" required />
                </div>
              </div>

              {/* Email & Phone row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-[#8b95b8] mb-1.5 block">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5a6485]" />
                    <input type="email" value={form.email} onChange={(e) => update("email", e.target.value)} placeholder="you@example.com" className="w-full bg-[#0f1118] border border-[#2a3050] rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-[#5a6485] focus:outline-none focus:border-[#00d46e]/50 focus:ring-1 focus:ring-[#00d46e]/20 transition-all" required />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-[#8b95b8] mb-1.5 block">Phone Number</label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5a6485]" />
                    <input type="tel" value={form.phone} onChange={(e) => update("phone", e.target.value)} placeholder="024 XXX XXXX" className="w-full bg-[#0f1118] border border-[#2a3050] rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-[#5a6485] focus:outline-none focus:border-[#00d46e]/50 focus:ring-1 focus:ring-[#00d46e]/20 transition-all" required />
                  </div>
                </div>
              </div>

              {/* Date of Birth */}
              <div>
                <label className="text-xs font-medium text-[#8b95b8] mb-1.5 block">Date of Birth</label>
                <div className="relative">
                  <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5a6485]" />
                  <input type="date" value={form.dob} onChange={(e) => update("dob", e.target.value)} className="w-full bg-[#0f1118] border border-[#2a3050] rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-[#5a6485] focus:outline-none focus:border-[#00d46e]/50 focus:ring-1 focus:ring-[#00d46e]/20 transition-all" required />
                </div>
                <p className="text-[10px] text-[#5a6485] mt-1">You must be 18 or older to register</p>
              </div>

              {/* Password row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-[#8b95b8] mb-1.5 block">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5a6485]" />
                    <input type={showPassword ? "text" : "password"} value={form.password} onChange={(e) => update("password", e.target.value)} placeholder="Min. 8 characters" className="w-full bg-[#0f1118] border border-[#2a3050] rounded-xl pl-10 pr-10 py-3 text-sm text-white placeholder-[#5a6485] focus:outline-none focus:border-[#00d46e]/50 focus:ring-1 focus:ring-[#00d46e]/20 transition-all" required minLength={8} />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#5a6485] hover:text-white">
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-[#8b95b8] mb-1.5 block">Confirm Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5a6485]" />
                    <input type="password" value={form.confirmPassword} onChange={(e) => update("confirmPassword", e.target.value)} placeholder="Repeat password" className="w-full bg-[#0f1118] border border-[#2a3050] rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-[#5a6485] focus:outline-none focus:border-[#00d46e]/50 focus:ring-1 focus:ring-[#00d46e]/20 transition-all" required />
                  </div>
                </div>
              </div>

              {/* Agreements */}
              <div className="space-y-3 pt-2">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <button type="button" onClick={() => setAgreedTerms(!agreedTerms)} className={`w-4 h-4 mt-0.5 rounded border flex items-center justify-center shrink-0 transition-all ${agreedTerms ? "bg-[#00d46e] border-[#00d46e]" : "border-[#2a3050] bg-[#0f1118]"}`}>
                    {agreedTerms && <svg className="w-3 h-3 text-white" viewBox="0 0 12 12" fill="none"><path d="M2 6L5 9L10 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                  </button>
                  <span className="text-xs text-[#8b95b8]">
                    I agree to the <Link href="/help" className="text-[#3b82f6] hover:underline">Terms of Service</Link> and <Link href="/help" className="text-[#3b82f6] hover:underline">Privacy Policy</Link>
                  </span>
                </label>
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <button type="button" onClick={() => setAgreedAge(!agreedAge)} className={`w-4 h-4 mt-0.5 rounded border flex items-center justify-center shrink-0 transition-all ${agreedAge ? "bg-[#00d46e] border-[#00d46e]" : "border-[#2a3050] bg-[#0f1118]"}`}>
                    {agreedAge && <svg className="w-3 h-3 text-white" viewBox="0 0 12 12" fill="none"><path d="M2 6L5 9L10 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                  </button>
                  <span className="text-xs text-[#8b95b8]">
                    I confirm I am at least 18 years old and agree to <Link href="/responsible-gaming" className="text-[#3b82f6] hover:underline">Responsible Gaming</Link> guidelines
                  </span>
                </label>
              </div>

              {error && (
                <div className="bg-[#ff4757]/10 border border-[#ff4757]/30 rounded-xl px-3 py-2.5 text-xs text-[#ff4757] flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-[#ff4757] rounded-full shrink-0" />
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={!agreedTerms || !agreedAge || submitting}
                className="w-full gradient-green text-white font-bold text-sm py-3.5 rounded-xl hover:opacity-90 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 glow-green"
              >
                {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                {submitting ? "Creating Account..." : "Create Account"}
              </button>
            </form>
          </div>

          <p className="text-center text-sm text-[#5a6485] mt-6">
            Already have an account?{" "}
            <Link href="/login" className="text-[#00d46e] font-semibold hover:underline">Sign In</Link>
          </p>

          {/* Trust badges */}
          <div className="flex items-center justify-center gap-4 mt-5">
            {["18+", "SSL Secured", "Licensed"].map((badge) => (
              <span key={badge} className="text-[10px] text-[#5a6485] bg-[#1c2033] px-2.5 py-1 rounded-lg border border-[#2a3050]">{badge}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
