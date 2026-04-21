"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  Shield,
  Bell,
  Globe,
  Moon,
  ChevronRight,
} from "lucide-react";
import { useSession } from "@/store/session";

export default function SettingsPage() {
  const { user } = useSession();

  const [notifications, setNotifications] = useState({
    betResults: true,
    promotions: true,
    deposits: true,
    liveAlerts: false,
  });

  const [odds, setOdds] = useState("decimal");
  const [timezone, setTimezone] = useState("GMT+0");

  return (
    <div className="min-h-screen">
      <div className="bg-[#161925] border-b border-[#2a3050]">
        <div className="px-4 lg:px-6 py-4">
          <div className="flex items-center gap-3">
            <Link
              href="/account"
              className="p-2 text-[#5a6485] hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-lg font-bold text-white">Account Settings</h1>
          </div>
        </div>
      </div>

      <div className="px-4 lg:px-6 py-6 max-w-2xl">
        {/* Personal Info */}
        <section className="mb-8">
          <h2 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
            <User className="w-4 h-4 text-[#8b5cf6]" /> Personal Information
          </h2>
          <div className="bg-[#1c2033] border border-[#2a3050] rounded-xl divide-y divide-[#2a3050]">
            <SettingRow
              label="Full Name"
              value={
                user ? `${user.firstName} ${user.lastName}` : "—"
              }
            />
            <SettingRow
              label="Email"
              value={user?.email ?? "—"}
              icon={<Mail className="w-3.5 h-3.5" />}
            />
            <SettingRow
              label="Phone"
              value="—"
              icon={<Phone className="w-3.5 h-3.5" />}
            />
            <SettingRow label="Date of Birth" value="—" />
            <SettingRow
              label="Country"
              value="Ghana"
              icon={<Globe className="w-3.5 h-3.5" />}
            />
          </div>
        </section>

        {/* Security */}
        <section className="mb-8">
          <h2 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
            <Shield className="w-4 h-4 text-[#00d46e]" /> Security
          </h2>
          <div className="bg-[#1c2033] border border-[#2a3050] rounded-xl divide-y divide-[#2a3050]">
            <div className="flex items-center justify-between px-4 py-3">
              <div>
                <p className="text-sm text-white">Change Password</p>
                <p className="text-[11px] text-[#5a6485]">
                  Update your account password
                </p>
              </div>
              <ChevronRight className="w-4 h-4 text-[#5a6485]" />
            </div>
            <div className="flex items-center justify-between px-4 py-3">
              <div>
                <p className="text-sm text-white">Two-Factor Authentication</p>
                <p className="text-[11px] text-[#5a6485]">
                  Add extra security to your account
                </p>
              </div>
              <span className="text-[10px] font-bold bg-[#ff4757]/20 text-[#ff4757] px-2 py-0.5 rounded">
                OFF
              </span>
            </div>
            <div className="flex items-center justify-between px-4 py-3">
              <div>
                <p className="text-sm text-white">KYC Verification</p>
                <p className="text-[11px] text-[#5a6485]">
                  Verify your identity for higher limits
                </p>
              </div>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                  user?.kycVerified
                    ? "bg-[#00d46e]/20 text-[#00d46e]"
                    : "bg-[#ff4757]/20 text-[#ff4757]"
                }`}
              >
                {user?.kycVerified ? "VERIFIED" : "UNVERIFIED"}
              </span>
            </div>
          </div>
        </section>

        {/* Notifications */}
        <section className="mb-8">
          <h2 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
            <Bell className="w-4 h-4 text-[#ffc107]" /> Notifications
          </h2>
          <div className="bg-[#1c2033] border border-[#2a3050] rounded-xl divide-y divide-[#2a3050]">
            {Object.entries(notifications).map(([key, val]) => (
              <div
                key={key}
                className="flex items-center justify-between px-4 py-3"
              >
                <span className="text-sm text-white capitalize">
                  {key.replace(/([A-Z])/g, " $1").trim()}
                </span>
                <button
                  onClick={() =>
                    setNotifications({ ...notifications, [key]: !val })
                  }
                  aria-label={`Toggle ${key}`}
                  aria-pressed={val}
                  className={`w-12 h-7 rounded-full relative transition-colors shrink-0 ${
                    val ? "bg-[#00d46e]" : "bg-[#2a3050]"
                  }`}
                >
                  <div
                    className={`w-5 h-5 bg-white rounded-full absolute top-1 transition-transform ${
                      val ? "right-1" : "left-1"
                    }`}
                  />
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* Preferences */}
        <section className="mb-8">
          <h2 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
            <Moon className="w-4 h-4 text-[#3b82f6]" /> Preferences
          </h2>
          <div className="bg-[#1c2033] border border-[#2a3050] rounded-xl divide-y divide-[#2a3050]">
            <div className="flex items-center justify-between px-4 py-3">
              <span className="text-sm text-white">Odds Format</span>
              <div className="flex gap-1 bg-[#0f1118] rounded-lg p-0.5">
                {["decimal", "fractional", "american"].map((f) => (
                  <button
                    key={f}
                    onClick={() => setOdds(f)}
                    className={`px-2.5 py-1 rounded text-[11px] font-medium capitalize transition-all ${
                      odds === f ? "bg-[#2a3050] text-white" : "text-[#5a6485]"
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center justify-between px-4 py-3">
              <span className="text-sm text-white">Timezone</span>
              <select
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="bg-[#0f1118] border border-[#2a3050] rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none"
              >
                <option value="GMT+0">GMT+0 (Accra)</option>
                <option value="GMT+1">GMT+1 (Lagos)</option>
                <option value="GMT-5">GMT-5 (New York)</option>
                <option value="GMT+3">GMT+3 (Nairobi)</option>
              </select>
            </div>
            <div className="flex items-center justify-between px-4 py-3">
              <span className="text-sm text-white">Language</span>
              <span className="text-xs text-[#8b95b8]">English</span>
            </div>
          </div>
        </section>

        <button className="w-full bg-[#1c2033] border border-[#2a3050] text-[#00d46e] font-semibold text-sm py-3 rounded-xl hover:bg-[#232840] transition-colors">
          Save Changes
        </button>
      </div>
    </div>
  );
}

function SettingRow({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between px-4 py-3">
      <div className="flex items-center gap-2">
        {icon && <span className="text-[#5a6485]">{icon}</span>}
        <span className="text-xs text-[#5a6485]">{label}</span>
      </div>
      <span className="text-sm text-white">{value}</span>
    </div>
  );
}
