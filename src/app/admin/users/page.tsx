"use client";

import { useEffect, useState } from "react";
import { Search, ChevronLeft, ChevronRight, Loader2, DollarSign, Shield, X } from "lucide-react";
import { api } from "@/lib/api";

type AdminUser = {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  balance: number;
  bonusBalance: number;
  status: string;
  kycStatus: string;
  role: string;
  totalDeposited: number;
  totalWithdrawn: number;
  totalWagered: number;
  totalWon: number;
  createdAt: string;
  lastLoginAt?: string;
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Balance adjust modal
  const [balanceModal, setBalanceModal] = useState<AdminUser | null>(null);
  const [balanceAmount, setBalanceAmount] = useState("");
  const [balanceReason, setBalanceReason] = useState("");

  const fetchUsers = () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: "20" });
    if (search) params.set("search", search);
    if (statusFilter) params.set("status", statusFilter);
    api
      .get<{ users: AdminUser[]; total: number; pages: number }>(
        `/api/admin/users?${params}`
      )
      .then((res) => {
        setUsers(res.users);
        setTotal(res.total);
        setPages(res.pages);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchUsers(); }, [page, statusFilter]);

  const handleAction = async (userId: string, action: string, value?: unknown) => {
    setActionLoading(userId);
    try {
      await api.patch("/api/admin/users", { userId, action, value });
      fetchUsers();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Action failed");
    } finally {
      setActionLoading(null);
    }
  };

  const handleBalanceAdjust = async () => {
    if (!balanceModal || !balanceAmount) return;
    const amount = parseFloat(balanceAmount);
    if (isNaN(amount) || amount === 0) return alert("Enter a valid amount");
    await handleAction(balanceModal._id, "adjust_balance", {
      amount,
      reason: balanceReason || "Admin adjustment",
    });
    setBalanceModal(null);
    setBalanceAmount("");
    setBalanceReason("");
  };

  return (
    <div className="px-4 lg:px-8 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-white">User Management</h1>
          <p className="text-xs text-[#5a6485]">{total} total users</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5a6485]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && fetchUsers()}
            placeholder="Search users by email, name, phone..."
            className="w-full bg-[#1c2033] border border-[#2a3050] rounded-lg pl-10 pr-4 py-2 text-sm text-white placeholder-[#5a6485] focus:outline-none focus:border-[#00d46e]/50"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="bg-[#1c2033] border border-[#2a3050] rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
        >
          <option value="">All Statuses</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
          <option value="self-excluded">Self-Excluded</option>
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-[#00d46e]" /></div>
      ) : (
        <>
          <div className="bg-[#1c2033] border border-[#2a3050] rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="border-b border-[#2a3050]">
                  <tr className="text-[10px] text-[#5a6485] uppercase">
                    <th className="px-4 py-3">User</th>
                    <th className="px-4 py-3">Role</th>
                    <th className="px-4 py-3">Balance</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">KYC</th>
                    <th className="px-4 py-3">Deposited</th>
                    <th className="px-4 py-3">Wagered</th>
                    <th className="px-4 py-3">Joined</th>
                    <th className="px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#2a3050]">
                  {users.map((u) => (
                    <tr key={u._id} className="hover:bg-[#232840] transition-colors">
                      <td className="px-4 py-3">
                        <p className="text-sm font-medium text-white">{u.firstName} {u.lastName}</p>
                        <p className="text-[11px] text-[#5a6485]">{u.email}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          u.role === "admin" ? "bg-[#8b5cf6]/20 text-[#8b5cf6]" : "bg-[#2a3050] text-[#5a6485]"
                        }`}>
                          {u.role.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm font-semibold text-[#00d46e]">
                        GHS {u.balance.toFixed(2)}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          u.status === "active" ? "bg-[#00d46e]/20 text-[#00d46e]" :
                          u.status === "suspended" ? "bg-[#ff4757]/20 text-[#ff4757]" :
                          "bg-[#ffc107]/20 text-[#ffc107]"
                        }`}>
                          {u.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          u.kycStatus === "approved" ? "bg-[#00d46e]/20 text-[#00d46e]" :
                          u.kycStatus === "pending" ? "bg-[#ffc107]/20 text-[#ffc107]" :
                          u.kycStatus === "rejected" ? "bg-[#ff4757]/20 text-[#ff4757]" :
                          "bg-[#2a3050] text-[#5a6485]"
                        }`}>
                          {(u.kycStatus || "none").toUpperCase()}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-[#8b95b8]">
                        GHS {u.totalDeposited.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-xs text-[#8b95b8]">
                        GHS {u.totalWagered.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-xs text-[#5a6485]">
                        {new Date(u.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1 flex-wrap">
                          {u.status === "active" ? (
                            <button
                              onClick={() => handleAction(u._id, "suspend")}
                              disabled={actionLoading === u._id}
                              className="text-[10px] px-2 py-1 bg-[#ff4757]/10 text-[#ff4757] rounded hover:bg-[#ff4757]/20 transition-colors disabled:opacity-50"
                            >
                              Suspend
                            </button>
                          ) : (
                            <button
                              onClick={() => handleAction(u._id, "activate")}
                              disabled={actionLoading === u._id}
                              className="text-[10px] px-2 py-1 bg-[#00d46e]/10 text-[#00d46e] rounded hover:bg-[#00d46e]/20 transition-colors disabled:opacity-50"
                            >
                              Activate
                            </button>
                          )}
                          <button
                            onClick={() => { setBalanceModal(u); setBalanceAmount(""); setBalanceReason(""); }}
                            className="text-[10px] px-2 py-1 bg-[#3b82f6]/10 text-[#3b82f6] rounded hover:bg-[#3b82f6]/20 transition-colors"
                          >
                            <DollarSign className="w-3 h-3 inline" /> Adjust
                          </button>
                          {u.role === "user" && (
                            <button
                              onClick={() => {
                                if (confirm(`Promote ${u.firstName} ${u.lastName} to admin?`)) {
                                  handleAction(u._id, "set_role", "admin");
                                }
                              }}
                              disabled={actionLoading === u._id}
                              className="text-[10px] px-2 py-1 bg-[#8b5cf6]/10 text-[#8b5cf6] rounded hover:bg-[#8b5cf6]/20 transition-colors disabled:opacity-50"
                            >
                              <Shield className="w-3 h-3 inline" /> Admin
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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
              <span className="text-xs text-[#8b95b8]">Page {page} of {pages}</span>
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

      {/* Balance Adjust Modal */}
      {balanceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-[#1c2033] border border-[#2a3050] rounded-xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-white">Adjust Balance</h3>
              <button onClick={() => setBalanceModal(null)} className="text-[#5a6485] hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-[#8b95b8] mb-1">
              {balanceModal.firstName} {balanceModal.lastName} ({balanceModal.email})
            </p>
            <p className="text-xs text-[#5a6485] mb-4">
              Current balance: <span className="text-[#00d46e] font-bold">GHS {balanceModal.balance.toFixed(2)}</span>
            </p>
            <div className="space-y-3">
              <div>
                <label className="text-[10px] text-[#5a6485] uppercase mb-1 block">Amount (use negative to deduct)</label>
                <input
                  type="number"
                  step="0.01"
                  value={balanceAmount}
                  onChange={(e) => setBalanceAmount(e.target.value)}
                  placeholder="e.g. 50.00 or -25.00"
                  className="w-full bg-[#0f1118] border border-[#2a3050] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#00d46e]/50"
                />
              </div>
              <div>
                <label className="text-[10px] text-[#5a6485] uppercase mb-1 block">Reason</label>
                <input
                  type="text"
                  value={balanceReason}
                  onChange={(e) => setBalanceReason(e.target.value)}
                  placeholder="e.g. Bonus credit, Refund, Correction"
                  className="w-full bg-[#0f1118] border border-[#2a3050] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#00d46e]/50"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setBalanceModal(null)}
                  className="flex-1 px-4 py-2 text-xs font-medium text-[#8b95b8] bg-[#0f1118] border border-[#2a3050] rounded-lg hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleBalanceAdjust}
                  className="flex-1 px-4 py-2 text-xs font-medium text-white bg-[#00d46e] rounded-lg hover:bg-[#00d46e]/80 transition-colors"
                >
                  Confirm Adjustment
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
