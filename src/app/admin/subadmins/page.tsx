"use client";

import { useEffect, useState } from "react";
import {
  Loader2,
  Plus,
  RefreshCw,
  Shield,
  Users,
  Percent,
  Calendar,
  X,
  Copy,
  Check,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";
import { api } from "@/lib/api";

type Subadmin = {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  status: string;
  referralCode: string;
  commissionRate: number;
  payoutDay: number;
  nextPayoutDate?: string;
  referredUsers: number;
  totalDeposits: number;
  totalStakes: number;
  computedCommission: number;
  commissionFromStakes: number;
  commissionFromDeposits: number;
  commissionPaidOut: number;
  pendingPayouts: number;
};

export default function AdminSubadminsPage() {
  const [list, setList] = useState<Subadmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [createResult, setCreateResult] = useState<{
    email: string;
    tempPassword?: string;
    referralCode: string;
  } | null>(null);

  // Create form
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [commissionRate, setCommissionRate] = useState("10");
  const [payoutDay, setPayoutDay] = useState("1");
  const [password, setPassword] = useState("");
  const [creating, setCreating] = useState(false);

  const [copied, setCopied] = useState<string | null>(null);

  const fetchList = async () => {
    setLoading(true);
    try {
      const res = await api.get<{ subadmins: Subadmin[] }>(
        "/api/admin/subadmins"
      );
      setList(res.subadmins);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchList();
  }, []);

  const create = async () => {
    if (!email || !firstName || !lastName) return;
    setCreating(true);
    try {
      const res = await api.post<{
        user: { email: string };
        referralCode: string;
        tempPassword?: string;
      }>("/api/admin/subadmins", {
        email,
        firstName,
        lastName,
        phone,
        commissionRate: parseFloat(commissionRate) || 0,
        payoutDay: parseInt(payoutDay) || 1,
        password: password || undefined,
      });
      setCreateResult({
        email: res.user.email,
        tempPassword: res.tempPassword,
        referralCode: res.referralCode,
      });
      setEmail("");
      setFirstName("");
      setLastName("");
      setPhone("");
      setCommissionRate("10");
      setPayoutDay("1");
      setPassword("");
      fetchList();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed");
    } finally {
      setCreating(false);
    }
  };

  const updateCommission = async (id: string, rate: number) => {
    await api.patch("/api/admin/subadmins", { id, commissionRate: rate });
    fetchList();
  };

  const updatePayoutDay = async (id: string, day: number) => {
    await api.patch("/api/admin/subadmins", { id, payoutDay: day });
    fetchList();
  };

  const revoke = async (id: string) => {
    if (!confirm("Revoke sub-admin status? They will become a regular user."))
      return;
    await api.patch("/api/admin/subadmins", { id, revoke: true });
    fetchList();
  };

  const resetPassword = async (id: string) => {
    if (!confirm("Reset password and email it to the sub-admin?")) return;
    const res = await api.patch<{ tempPassword?: string }>(
      "/api/admin/subadmins",
      { id, resetPassword: true }
    );
    if (res.tempPassword) {
      prompt("New temporary password (also emailed):", res.tempPassword);
    }
  };

  const copy = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(text);
    setTimeout(() => setCopied(null), 1500);
  };

  return (
    <div className="px-3 sm:px-4 lg:px-8 py-4 sm:py-6 max-w-[1400px] mx-auto">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
            <Shield className="w-5 h-5 text-[#06b6d4]" />
            Sub-Admins
          </h1>
          <p className="text-[11px] text-[#5a6485]">
            Create sub-admins, set commission %, configure payout dates
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/admin/payouts"
            className="flex items-center gap-1.5 px-3 py-2 bg-[#1c2033] border border-[#2a3050] rounded-lg text-xs text-[#8b95b8] hover:text-white"
          >
            <Calendar className="w-3.5 h-3.5" /> Payout Requests
          </Link>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-1.5 px-3 py-2 gradient-green rounded-lg text-xs font-bold text-white"
          >
            <Plus className="w-3.5 h-3.5" /> Create Sub-Admin
          </button>
          <button
            onClick={fetchList}
            className="p-2 text-[#8b95b8] hover:text-[#00d46e]"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-[#00d46e]" />
        </div>
      ) : list.length === 0 ? (
        <div className="text-center py-16 bg-[#1c2033] border border-[#2a3050] rounded-xl">
          <Shield className="w-8 h-8 text-[#5a6485] mx-auto mb-3" />
          <p className="text-sm text-[#8b95b8]">No sub-admins yet</p>
          <button
            onClick={() => setShowCreate(true)}
            className="mt-3 text-xs text-[#00d46e] hover:underline"
          >
            Create the first sub-admin
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {list.map((sa) => (
            <div
              key={sa._id}
              className="bg-[#1c2033] border border-[#2a3050] rounded-xl p-4"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="text-sm font-bold text-white">
                    {sa.firstName} {sa.lastName}
                  </p>
                  <p className="text-[11px] text-[#5a6485]">{sa.email}</p>
                  {sa.phone && (
                    <p className="text-[10px] text-[#5a6485]">{sa.phone}</p>
                  )}
                </div>
                <span
                  className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                    sa.status === "active"
                      ? "bg-[#00d46e]/15 text-[#00d46e]"
                      : "bg-[#ff4757]/15 text-[#ff4757]"
                  }`}
                >
                  {sa.status.toUpperCase()}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 mb-3">
                <Stat
                  icon={<Users className="w-3 h-3 text-[#3b82f6]" />}
                  label="Referred"
                  value={String(sa.referredUsers)}
                />
                <Stat
                  icon={<Percent className="w-3 h-3 text-[#06b6d4]" />}
                  label="Rate"
                  value={`${sa.commissionRate}%`}
                />
                <Stat
                  icon={<Calendar className="w-3 h-3 text-[#ffc107]" />}
                  label="Payout Day"
                  value={String(sa.payoutDay)}
                />
              </div>

              <div className="grid grid-cols-2 gap-2 mb-3 text-[10px]">
                <Row
                  label="Total Deposits"
                  value={`GHS ${sa.totalDeposits.toFixed(2)}`}
                />
                <Row
                  label="Total Stakes"
                  value={`GHS ${sa.totalStakes.toFixed(2)}`}
                />
                <Row
                  label="Earned"
                  value={`GHS ${sa.computedCommission.toFixed(2)}`}
                  green
                />
                <Row
                  label="Paid Out"
                  value={`GHS ${sa.commissionPaidOut.toFixed(2)}`}
                />
                <Row
                  label="Next Payout"
                  value={
                    sa.nextPayoutDate
                      ? new Date(sa.nextPayoutDate).toLocaleDateString()
                      : "—"
                  }
                />
                <Row
                  label="Pending"
                  value={String(sa.pendingPayouts)}
                  amber={sa.pendingPayouts > 0}
                />
              </div>

              <div className="bg-[#0f1118] border border-[#2a3050] rounded-lg p-2 mb-3 flex items-center justify-between">
                <code className="text-[10px] font-mono text-[#00d46e]">
                  ?ref={sa.referralCode}
                </code>
                <button
                  onClick={() =>
                    copy(
                      `${typeof window !== "undefined" ? window.location.origin : ""}/register?ref=${sa.referralCode}`
                    )
                  }
                  className="text-[10px] text-[#3b82f6] flex items-center gap-1"
                >
                  {copied?.includes(sa.referralCode) ? (
                    <Check className="w-3 h-3 text-[#00d46e]" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                  Link
                </button>
              </div>

              <div className="flex gap-1 flex-wrap">
                <button
                  onClick={() => {
                    const v = prompt(
                      "New commission % (0-100)",
                      String(sa.commissionRate)
                    );
                    if (v !== null) {
                      const n = parseFloat(v);
                      if (!isNaN(n)) updateCommission(sa._id, n);
                    }
                  }}
                  className="text-[10px] px-2.5 py-1.5 bg-[#06b6d4]/10 text-[#06b6d4] rounded-lg"
                >
                  Edit %
                </button>
                <button
                  onClick={() => {
                    const v = prompt(
                      "Payout day of month (1-31)",
                      String(sa.payoutDay)
                    );
                    if (v !== null) {
                      const n = parseInt(v);
                      if (!isNaN(n)) updatePayoutDay(sa._id, n);
                    }
                  }}
                  className="text-[10px] px-2.5 py-1.5 bg-[#ffc107]/10 text-[#ffc107] rounded-lg"
                >
                  Edit Payout Day
                </button>
                <button
                  onClick={() => resetPassword(sa._id)}
                  className="text-[10px] px-2.5 py-1.5 bg-[#8b5cf6]/10 text-[#8b5cf6] rounded-lg"
                >
                  Reset Password
                </button>
                <button
                  onClick={() => revoke(sa._id)}
                  className="text-[10px] px-2.5 py-1.5 bg-[#ff4757]/10 text-[#ff4757] rounded-lg"
                >
                  Revoke
                </button>
                <Link
                  href={`/admin/users?search=${encodeURIComponent(sa.email)}`}
                  className="text-[10px] px-2.5 py-1.5 bg-[#1c2033] text-[#8b95b8] rounded-lg flex items-center gap-1"
                >
                  Details <ChevronRight className="w-2.5 h-2.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {showCreate && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setShowCreate(false)}
        >
          <div
            className="bg-[#161925] border border-[#2a3050] rounded-2xl w-full max-w-md p-5 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-white">
                Create Sub-Admin
              </h3>
              <button
                onClick={() => setShowCreate(false)}
                className="text-[#5a6485] hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <Field
                  label="First Name"
                  value={firstName}
                  onChange={setFirstName}
                />
                <Field
                  label="Last Name"
                  value={lastName}
                  onChange={setLastName}
                />
              </div>
              <Field label="Email" value={email} onChange={setEmail} />
              <Field
                label="Phone (optional)"
                value={phone}
                onChange={setPhone}
              />
              <div className="grid grid-cols-2 gap-3">
                <Field
                  label="Commission %"
                  type="number"
                  value={commissionRate}
                  onChange={setCommissionRate}
                />
                <Field
                  label="Payout Day (1-31)"
                  type="number"
                  value={payoutDay}
                  onChange={setPayoutDay}
                />
              </div>
              <Field
                label="Password (optional, auto-generated)"
                value={password}
                onChange={setPassword}
              />
              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setShowCreate(false)}
                  className="flex-1 px-4 py-2.5 text-xs font-medium text-[#8b95b8] bg-[#0f1118] border border-[#2a3050] rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={create}
                  disabled={creating || !email || !firstName || !lastName}
                  className="flex-1 px-4 py-2.5 text-xs font-bold text-white gradient-green rounded-lg disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  {creating && <Loader2 className="w-3 h-3 animate-spin" />}{" "}
                  Create
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {createResult && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setCreateResult(null)}
        >
          <div
            className="bg-[#161925] border border-[#00d46e]/30 rounded-2xl w-full max-w-md p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-[#00d46e]">
                Sub-Admin Created
              </h3>
              <button
                onClick={() => setCreateResult(null)}
                className="text-[#5a6485] hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-3">
              <p className="text-xs text-[#8b95b8]">
                Login credentials and referral link have been emailed.
              </p>
              <div className="bg-[#0f1118] border border-[#2a3050] rounded-lg p-3">
                <p className="text-[10px] text-[#5a6485] uppercase mb-1">
                  Email
                </p>
                <p className="text-xs font-mono text-white">
                  {createResult.email}
                </p>
              </div>
              {createResult.tempPassword && (
                <div className="bg-[#0f1118] border border-[#ffc107]/30 rounded-lg p-3">
                  <p className="text-[10px] text-[#ffc107] uppercase mb-1">
                    Temporary Password
                  </p>
                  <p className="text-xs font-mono text-white">
                    {createResult.tempPassword}
                  </p>
                </div>
              )}
              <div className="bg-[#0f1118] border border-[#00d46e]/30 rounded-lg p-3">
                <p className="text-[10px] text-[#00d46e] uppercase mb-1">
                  Referral Code
                </p>
                <p className="text-xs font-mono text-white">
                  {createResult.referralCode}
                </p>
              </div>
              <button
                onClick={() => setCreateResult(null)}
                className="w-full px-4 py-2.5 text-xs font-bold text-white gradient-green rounded-lg"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="bg-[#0f1118] border border-[#2a3050] rounded-lg p-2">
      <div className="flex items-center gap-1 mb-0.5">
        {icon}
        <span className="text-[9px] text-[#5a6485] uppercase">{label}</span>
      </div>
      <p className="text-xs font-bold text-white">{value}</p>
    </div>
  );
}

function Row({
  label,
  value,
  green,
  amber,
}: {
  label: string;
  value: string;
  green?: boolean;
  amber?: boolean;
}) {
  return (
    <div className="flex justify-between">
      <span className="text-[#5a6485]">{label}</span>
      <span
        className={`font-bold ${
          green ? "text-[#00d46e]" : amber ? "text-[#ffc107]" : "text-white"
        }`}
      >
        {value}
      </span>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <div>
      <label className="text-[10px] text-[#5a6485] uppercase mb-1 block">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-[#0f1118] border border-[#2a3050] rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#00d46e]/50"
      />
    </div>
  );
}
