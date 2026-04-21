"use client";

import { useEffect, useState } from "react";
import { Loader2, ChevronLeft, ChevronRight, CheckCircle, XCircle, Clock, DollarSign } from "lucide-react";
import { api } from "@/lib/api";

type Withdrawal = {
  _id: string;
  amount: number;
  status: string;
  note?: string;
  method?: string;
  accountNumber?: string;
  createdAt: string;
  userId: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    balance: number;
  } | null;
};

export default function AdminWithdrawalsPage() {
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState("pending");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchWithdrawals = () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: "20" });
    if (statusFilter) params.set("status", statusFilter);
    api
      .get<{ withdrawals: Withdrawal[]; total: number; pages: number }>(
        `/api/admin/withdrawals?${params}`
      )
      .then((res) => {
        setWithdrawals(res.withdrawals);
        setTotal(res.total);
        setPages(res.pages);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchWithdrawals(); }, [page, statusFilter]);

  const handleAction = async (txId: string, action: "approve" | "reject") => {
    const note = action === "reject"
      ? prompt("Rejection reason (optional):")
      : undefined;
    setActionLoading(txId);
    try {
      await api.patch("/api/admin/withdrawals", {
        transactionId: txId,
        action,
        note: note || undefined,
      });
      fetchWithdrawals();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Action failed");
    } finally {
      setActionLoading(null);
    }
  };

  const pendingTotal = withdrawals
    .filter((w) => w.status === "pending")
    .reduce((sum, w) => sum + w.amount, 0);

  return (
    <div className="px-4 lg:px-8 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-white">Withdrawal Management</h1>
          <p className="text-xs text-[#5a6485]">{total} withdrawals</p>
        </div>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="bg-[#1c2033] border border-[#2a3050] rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
        >
          <option value="pending">Pending</option>
          <option value="success">Approved</option>
          <option value="failed">Rejected</option>
          <option value="">All</option>
        </select>
      </div>

      {/* Summary Cards */}
      {statusFilter === "pending" && withdrawals.length > 0 && (
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-[#1c2033] border border-[#2a3050] rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="w-4 h-4 text-[#ffc107]" />
              <span className="text-[10px] text-[#5a6485] uppercase">Pending Requests</span>
            </div>
            <p className="text-2xl font-bold text-[#ffc107]">{withdrawals.length}</p>
          </div>
          <div className="bg-[#1c2033] border border-[#2a3050] rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="w-4 h-4 text-[#ff4757]" />
              <span className="text-[10px] text-[#5a6485] uppercase">Pending Amount</span>
            </div>
            <p className="text-2xl font-bold text-[#ff4757]">GHS {pendingTotal.toFixed(2)}</p>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-[#00d46e]" />
        </div>
      ) : withdrawals.length === 0 ? (
        <p className="text-sm text-[#5a6485] text-center py-16">
          No {statusFilter || ""} withdrawals
        </p>
      ) : (
        <>
          <div className="space-y-2">
            {withdrawals.map((w) => (
              <div
                key={w._id}
                className="bg-[#1c2033] border border-[#2a3050] rounded-xl px-4 py-3"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 min-w-0">
                    {w.userId && (
                      <>
                        <p className="text-sm font-medium text-white">
                          {w.userId.firstName} {w.userId.lastName}
                        </p>
                        <p className="text-[11px] text-[#5a6485]">
                          {w.userId.email} {w.userId.phone ? `| ${w.userId.phone}` : ""}
                        </p>
                        <p className="text-[10px] text-[#8b95b8] mt-0.5">
                          Current balance: <span className="text-[#00d46e] font-bold">GHS {w.userId.balance.toFixed(2)}</span>
                        </p>
                      </>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-white">GHS {w.amount.toFixed(2)}</p>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        w.status === "pending"
                          ? "bg-[#ffc107]/20 text-[#ffc107]"
                          : w.status === "success"
                          ? "bg-[#00d46e]/20 text-[#00d46e]"
                          : "bg-[#ff4757]/20 text-[#ff4757]"
                      }`}
                    >
                      {w.status.toUpperCase()}
                    </span>
                    <p className="text-[10px] text-[#5a6485] mt-1">
                      {new Date(w.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
                {w.note && (
                  <p className="text-[10px] text-[#8b95b8] bg-[#0f1118] rounded px-2 py-1 mb-2">
                    Note: {w.note}
                  </p>
                )}
                {w.status === "pending" && (
                  <div className="flex gap-2 pt-2 border-t border-[#2a3050]">
                    <button
                      onClick={() => handleAction(w._id, "approve")}
                      disabled={actionLoading === w._id}
                      className="flex items-center gap-1.5 text-[11px] px-4 py-1.5 bg-[#00d46e]/10 text-[#00d46e] rounded-lg hover:bg-[#00d46e]/20 transition-colors disabled:opacity-50"
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      {actionLoading === w._id ? "Processing..." : "Approve & Pay"}
                    </button>
                    <button
                      onClick={() => handleAction(w._id, "reject")}
                      disabled={actionLoading === w._id}
                      className="flex items-center gap-1.5 text-[11px] px-4 py-1.5 bg-[#ff4757]/10 text-[#ff4757] rounded-lg hover:bg-[#ff4757]/20 transition-colors disabled:opacity-50"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      Reject & Refund
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>

          {pages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-4">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="p-2 text-[#5a6485] hover:text-white disabled:opacity-30"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs text-[#8b95b8]">
                Page {page} of {pages}
              </span>
              <button
                onClick={() => setPage(Math.min(pages, page + 1))}
                disabled={page === pages}
                className="p-2 text-[#5a6485] hover:text-white disabled:opacity-30"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
