"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Loader2,
  RefreshCw,
  Check,
  X,
  Banknote,
  Bitcoin,
  Smartphone,
  Landmark,
  Copy,
  ChevronRight,
} from "lucide-react";
import { api } from "@/lib/api";

type Payout = {
  _id: string;
  subadminId?: {
    _id: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    commissionRate?: number;
    referralCode?: string;
  };
  amount: number;
  currency: string;
  method: "crypto" | "mtn_momo" | "telecel_cash" | "bank_transfer";
  status: "pending" | "approved" | "rejected" | "paid";
  cryptoAddress?: string;
  cryptoNetwork?: string;
  momoNumber?: string;
  momoName?: string;
  momoNetwork?: string;
  bankName?: string;
  accountName?: string;
  accountNumber?: string;
  swiftCode?: string;
  routingNumber?: string;
  note?: string;
  rejectionReason?: string;
  txReference?: string;
  createdAt: string;
  processedAt?: string;
};

const ICONS: Record<string, React.ReactNode> = {
  crypto: <Bitcoin className="w-3.5 h-3.5 text-[#F7931A]" />,
  mtn_momo: <Smartphone className="w-3.5 h-3.5 text-[#FFCB05]" />,
  telecel_cash: <Smartphone className="w-3.5 h-3.5 text-[#E30613]" />,
  bank_transfer: <Landmark className="w-3.5 h-3.5 text-[#3b82f6]" />,
};

export default function AdminPayoutsPage() {
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("pending");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (status !== "all") params.set("status", status);
      const res = await api.get<{ payouts: Payout[] }>(
        `/api/admin/payouts?${params}`
      );
      setPayouts(res.payouts);
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const approve = async (id: string) => {
    await api.patch("/api/admin/payouts", { id, action: "approve" });
    fetchData();
  };

  const reject = async (id: string) => {
    const reason = prompt("Rejection reason?");
    if (reason === null) return;
    await api.patch("/api/admin/payouts", {
      id,
      action: "reject",
      rejectionReason: reason,
    });
    fetchData();
  };

  const markPaid = async (id: string) => {
    const txReference = prompt("Tx reference / receipt ID?");
    if (txReference === null) return;
    await api.patch("/api/admin/payouts", {
      id,
      action: "mark_paid",
      txReference,
    });
    fetchData();
  };

  const copy = async (s?: string) => {
    if (!s) return;
    await navigator.clipboard.writeText(s);
  };

  return (
    <div className="px-3 sm:px-4 lg:px-8 py-4 sm:py-6 max-w-[1300px] mx-auto">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
            <Banknote className="w-5 h-5 text-[#ffc107]" />
            Sub-Admin Payout Requests
          </h1>
          <p className="text-[11px] text-[#5a6485]">
            Approve, reject, or mark commission withdrawals as paid
          </p>
        </div>
        <button
          onClick={fetchData}
          className="p-2 text-[#8b95b8] hover:text-[#00d46e]"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      <div className="flex gap-2 mb-4 bg-[#1c2033] p-1 rounded-lg border border-[#2a3050] w-fit">
        {["pending", "approved", "paid", "rejected", "all"].map((s) => (
          <button
            key={s}
            onClick={() => setStatus(s)}
            className={`px-3 py-1.5 rounded text-xs font-medium capitalize transition-all ${
              status === s
                ? "bg-[#00d46e] text-white"
                : "text-[#8b95b8] hover:text-white"
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-[#00d46e]" />
        </div>
      ) : payouts.length === 0 ? (
        <div className="text-center py-16 bg-[#1c2033] border border-[#2a3050] rounded-xl">
          <Banknote className="w-8 h-8 text-[#5a6485] mx-auto mb-3" />
          <p className="text-sm text-[#8b95b8]">No requests in this view</p>
        </div>
      ) : (
        <div className="space-y-3">
          {payouts.map((p) => (
            <div
              key={p._id}
              className="bg-[#1c2033] border border-[#2a3050] rounded-xl p-4"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="text-sm font-bold text-white">
                    {p.subadminId?.firstName} {p.subadminId?.lastName}
                  </p>
                  <p className="text-[11px] text-[#5a6485]">
                    {p.subadminId?.email}
                    {p.subadminId?.referralCode && (
                      <span className="ml-2">·{p.subadminId.referralCode}</span>
                    )}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-[#ffc107]">
                    GHS {p.amount.toFixed(2)}
                  </p>
                  <div className="flex items-center justify-end gap-1.5 mt-0.5">
                    {ICONS[p.method]}
                    <span className="text-[11px] text-[#8b95b8] capitalize">
                      {p.method.replace("_", " ")}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-[#0f1118] border border-[#2a3050] rounded-lg p-3 mb-3 text-xs space-y-1.5">
                {p.method === "crypto" && (
                  <>
                    <DetailWithCopy
                      label="Address"
                      value={p.cryptoAddress}
                      onCopy={copy}
                    />
                    <Detail label="Network" value={p.cryptoNetwork} />
                  </>
                )}
                {(p.method === "mtn_momo" ||
                  p.method === "telecel_cash") && (
                  <>
                    <DetailWithCopy
                      label="Number"
                      value={p.momoNumber}
                      onCopy={copy}
                    />
                    <Detail label="Name" value={p.momoName} />
                    {p.momoNetwork && (
                      <Detail label="Network" value={p.momoNetwork} />
                    )}
                  </>
                )}
                {p.method === "bank_transfer" && (
                  <>
                    <Detail label="Bank" value={p.bankName} />
                    <Detail label="Name" value={p.accountName} />
                    <DetailWithCopy
                      label="Account #"
                      value={p.accountNumber}
                      onCopy={copy}
                    />
                    {p.swiftCode && (
                      <Detail label="SWIFT" value={p.swiftCode} />
                    )}
                    {p.routingNumber && (
                      <Detail label="Routing" value={p.routingNumber} />
                    )}
                  </>
                )}
                {p.note && <Detail label="Note" value={p.note} />}
                <Detail
                  label="Requested"
                  value={new Date(p.createdAt).toLocaleString()}
                />
                {p.txReference && (
                  <Detail label="Tx Ref" value={p.txReference} />
                )}
                {p.rejectionReason && (
                  <Detail
                    label="Rejection"
                    value={p.rejectionReason}
                  />
                )}
              </div>

              <div className="flex items-center justify-between">
                <StatusPill status={p.status} />
                <div className="flex gap-1.5">
                  {p.status === "pending" && (
                    <>
                      <button
                        onClick={() => reject(p._id)}
                        className="text-xs px-3 py-1.5 bg-[#ff4757]/10 text-[#ff4757] rounded-lg flex items-center gap-1 hover:bg-[#ff4757]/20"
                      >
                        <X className="w-3 h-3" /> Reject
                      </button>
                      <button
                        onClick={() => approve(p._id)}
                        className="text-xs px-3 py-1.5 bg-[#3b82f6]/10 text-[#3b82f6] rounded-lg flex items-center gap-1 hover:bg-[#3b82f6]/20"
                      >
                        <Check className="w-3 h-3" /> Approve
                      </button>
                    </>
                  )}
                  {(p.status === "pending" || p.status === "approved") && (
                    <button
                      onClick={() => markPaid(p._id)}
                      className="text-xs px-3 py-1.5 bg-[#00d46e]/10 text-[#00d46e] rounded-lg flex items-center gap-1 hover:bg-[#00d46e]/20"
                    >
                      <ChevronRight className="w-3 h-3" /> Mark Paid
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Detail({ label, value }: { label: string; value?: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-[#5a6485]">{label}</span>
      <span className="text-white font-medium text-right max-w-[60%] break-all">
        {value || "—"}
      </span>
    </div>
  );
}

function DetailWithCopy({
  label,
  value,
  onCopy,
}: {
  label: string;
  value?: string;
  onCopy: (s?: string) => void;
}) {
  return (
    <div className="flex justify-between items-start gap-2">
      <span className="text-[#5a6485]">{label}</span>
      <div className="flex items-center gap-1 max-w-[70%]">
        <span className="text-white font-mono text-[11px] break-all text-right">
          {value || "—"}
        </span>
        {value && (
          <button
            onClick={() => onCopy(value)}
            className="text-[#8b95b8] hover:text-white shrink-0"
          >
            <Copy className="w-3 h-3" />
          </button>
        )}
      </div>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    pending: "bg-[#ffc107]/15 text-[#ffc107]",
    approved: "bg-[#3b82f6]/15 text-[#3b82f6]",
    paid: "bg-[#00d46e]/15 text-[#00d46e]",
    rejected: "bg-[#ff4757]/15 text-[#ff4757]",
  };
  return (
    <span
      className={`text-[9px] font-bold px-2 py-1 rounded ${
        map[status] || "bg-[#2a3050] text-[#5a6485]"
      }`}
    >
      {status.toUpperCase()}
    </span>
  );
}
