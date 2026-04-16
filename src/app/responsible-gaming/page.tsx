"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Shield,
  ArrowLeft,
  Clock,
  DollarSign,
  AlertTriangle,
  Phone,
  Heart,
  CheckCircle,
} from "lucide-react";

export default function ResponsibleGamingPage() {
  const [depositLimit, setDepositLimit] = useState("500");
  const [lossLimit, setLossLimit] = useState("200");
  const [sessionLimit, setSessionLimit] = useState("120");

  return (
    <div className="min-h-screen">
      <div className="bg-gradient-to-r from-[#06b6d4]/10 via-[#161925] to-[#06b6d4]/10 border-b border-[#06b6d4]/20">
        <div className="px-4 lg:px-6 py-5">
          <div className="flex items-center gap-3">
            <Link href="/" className="p-2 text-[#5a6485] hover:text-white transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="w-10 h-10 bg-[#06b6d4]/20 rounded-xl flex items-center justify-center">
              <Shield className="w-5 h-5 text-[#06b6d4]" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Responsible Gaming</h1>
              <p className="text-xs text-[#8b95b8]">Play safe, stay in control</p>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 lg:px-6 py-6 max-w-2xl">
        {/* Commitment Statement */}
        <div className="bg-[#1c2033] border border-[#06b6d4]/20 rounded-xl p-5 mb-6">
          <div className="flex items-start gap-3">
            <Heart className="w-5 h-5 text-[#06b6d4] shrink-0 mt-0.5" />
            <div>
              <h2 className="text-sm font-bold text-white mb-2">Our Commitment to You</h2>
              <p className="text-xs text-[#8b95b8] leading-relaxed">
                At BetNexus, we believe gambling should always be fun and entertaining. We are committed
                to providing a safe environment and the tools you need to stay in control. If gambling
                stops being fun, we&apos;re here to help.
              </p>
            </div>
          </div>
        </div>

        {/* Set Your Limits */}
        <section className="mb-8">
          <h2 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-[#00d46e]" /> Set Your Limits
          </h2>
          <div className="space-y-4">
            <div className="bg-[#1c2033] border border-[#2a3050] rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm text-white font-medium">Daily Deposit Limit</label>
                <span className="text-xs text-[#5a6485]">Current: GHS {depositLimit}</span>
              </div>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={depositLimit}
                  onChange={(e) => setDepositLimit(e.target.value)}
                  className="flex-1 bg-[#0f1118] border border-[#2a3050] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#06b6d4]/50"
                />
                <button className="px-4 py-2 bg-[#06b6d4]/20 text-[#06b6d4] rounded-lg text-xs font-semibold hover:bg-[#06b6d4]/30 transition-colors">
                  Update
                </button>
              </div>
            </div>

            <div className="bg-[#1c2033] border border-[#2a3050] rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm text-white font-medium">Daily Loss Limit</label>
                <span className="text-xs text-[#5a6485]">Current: GHS {lossLimit}</span>
              </div>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={lossLimit}
                  onChange={(e) => setLossLimit(e.target.value)}
                  className="flex-1 bg-[#0f1118] border border-[#2a3050] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#06b6d4]/50"
                />
                <button className="px-4 py-2 bg-[#06b6d4]/20 text-[#06b6d4] rounded-lg text-xs font-semibold hover:bg-[#06b6d4]/30 transition-colors">
                  Update
                </button>
              </div>
            </div>

            <div className="bg-[#1c2033] border border-[#2a3050] rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm text-white font-medium">Session Time Limit</label>
                <span className="text-xs text-[#5a6485]">Current: {sessionLimit} minutes</span>
              </div>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={sessionLimit}
                  onChange={(e) => setSessionLimit(e.target.value)}
                  className="flex-1 bg-[#0f1118] border border-[#2a3050] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#06b6d4]/50"
                />
                <button className="px-4 py-2 bg-[#06b6d4]/20 text-[#06b6d4] rounded-lg text-xs font-semibold hover:bg-[#06b6d4]/30 transition-colors">
                  Update
                </button>
              </div>
              <p className="text-[10px] text-[#5a6485] mt-1">You&apos;ll receive a reminder when you reach this time</p>
            </div>
          </div>
        </section>

        {/* Self-Exclusion */}
        <section className="mb-8">
          <h2 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#ffc107]" /> Take a Break
          </h2>
          <div className="bg-[#1c2033] border border-[#2a3050] rounded-xl p-4">
            <p className="text-xs text-[#8b95b8] mb-4">
              Need some time away? You can temporarily exclude yourself from the platform.
              During this period, you won&apos;t be able to place bets or deposit funds.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {["24 Hours", "7 Days", "30 Days", "6 Months"].map((period) => (
                <button
                  key={period}
                  className="bg-[#0f1118] border border-[#2a3050] rounded-lg py-2.5 text-xs font-medium text-[#8b95b8] hover:text-white hover:border-[#ffc107]/30 transition-all"
                >
                  {period}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Warning Signs */}
        <section className="mb-8">
          <h2 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-[#ff4757]" /> Warning Signs
          </h2>
          <div className="bg-[#1c2033] border border-[#2a3050] rounded-xl p-4">
            <p className="text-xs text-[#8b95b8] mb-3">You may have a gambling problem if you:</p>
            <ul className="space-y-2">
              {[
                "Spend more money or time on gambling than you can afford",
                "Find it hard to manage or stop your gambling",
                "Have arguments with family or friends about money and gambling",
                "Lose interest in usual activities or hobbies",
                "Always think or talk about gambling",
                "Lie about your gambling or hide it from others",
                "Chase your losses or gamble to get out of financial trouble",
                "Gamble until all your money is gone",
              ].map((sign) => (
                <li key={sign} className="flex items-start gap-2">
                  <CheckCircle className="w-3.5 h-3.5 text-[#ff4757] shrink-0 mt-0.5" />
                  <span className="text-xs text-[#8b95b8]">{sign}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Help Resources */}
        <section>
          <h2 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
            <Phone className="w-4 h-4 text-[#00d46e]" /> Get Help
          </h2>
          <div className="space-y-2">
            <div className="bg-[#1c2033] border border-[#2a3050] rounded-xl p-4 flex items-center gap-4">
              <div className="w-10 h-10 bg-[#00d46e]/20 rounded-lg flex items-center justify-center shrink-0">
                <Phone className="w-5 h-5 text-[#00d46e]" />
              </div>
              <div>
                <p className="text-sm font-medium text-white">GamCare Helpline</p>
                <p className="text-xs text-[#5a6485]">0808 802 0133 - Available 24/7</p>
              </div>
            </div>
            <div className="bg-[#1c2033] border border-[#2a3050] rounded-xl p-4 flex items-center gap-4">
              <div className="w-10 h-10 bg-[#3b82f6]/20 rounded-lg flex items-center justify-center shrink-0">
                <Heart className="w-5 h-5 text-[#3b82f6]" />
              </div>
              <div>
                <p className="text-sm font-medium text-white">Gamblers Anonymous</p>
                <p className="text-xs text-[#5a6485]">Free peer support groups worldwide</p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
