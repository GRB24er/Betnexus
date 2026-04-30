"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Loader2,
  DollarSign,
  Shield,
  X,
  Eye,
  Ban,
  CheckCircle,
  UserPlus,
  RefreshCw,
  Mail,
  Calendar,
  Wallet,
  BarChart3,
  Download,
} from "lucide-react";
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
  referralCode?: string;
  referredBy?: string;
  referrer?: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
  } | null;
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
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);

  // Balance adjust modal
  const [balanceModal, setBalanceModal] = useState<AdminUser | null>(null);
  const [balanceAmount, setBalanceAmount] = useState("");
  const [balanceReason, setBalanceReason] = useState("");

  const fetchUsers = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: "20" });
    if (search) params.set("search", search);
    if (statusFilter) params.set("status", statusFilter);
    api
      .get<{ users: AdminUser[]; total: number; pages: number }>(`/api/admin/users?${params}`)
      .then((res) => {
        setUsers(res.users);
        setTotal(res.total);
        setPages(res.pages);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [page, statusFilter, search]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

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

  const exportCSV = () => {
    const headers = "Name,Email,Balance,Status,Role,KYC,Deposited,Withdrawn,Wagered,Won,Joined\n";
    const rows = users.map((u) =>
      `${u.firstName} ${u.lastName},${u.email},${u.balance},${u.status},${u.role},${u.kycStatus || "none"},${u.totalDeposited},${u.totalWithdrawn},${u.totalWagered},${u.totalWon},${new Date(u.createdAt).toISOString()}`
    ).join("\n");
    const blob = new Blob([headers + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `users-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const StatusBadge = ({ status }: { status: string }) => {
    const cls = status === "active" ? "bg-[#00d46e]/10 text-[#00d46e]" :
      status === "suspended" ? "bg-[#ff4757]/10 text-[#ff4757]" :
      "bg-[#ffc107]/10 text-[#ffc107]";
    return <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${cls}`}>{status.toUpperCase()}</span>;
  };

  return (
    <div className="px-3 sm:px-4 lg:px-8 py-4 sm:py-6 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-[#3b82f6]" />
            User Management
          </h1>
          <p className="text-[11px] text-[#5a6485]">{total} total users · Full control over all accounts</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={exportCSV} className="flex items-center gap-1.5 px-3 py-2 bg-[#1c2033] border border-[#2a3050] rounded-lg text-xs text-[#8b95b8] hover:text-white transition-all">
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Export</span>
          </button>
          <button onClick={fetchUsers} className="p-2 text-[#8b95b8] hover:text-[#00d46e] transition-colors">
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
        <div className="bg-[#1c2033] border border-[#2a3050] rounded-xl p-3">
          <p className="text-[10px] text-[#5a6485]">Total Users</p>
          <p className="text-sm font-bold text-[#3b82f6]">{total}</p>
        </div>
        <div className="bg-[#1c2033] border border-[#2a3050] rounded-xl p-3">
          <p className="text-[10px] text-[#5a6485]">Active</p>
          <p className="text-sm font-bold text-[#00d46e]">{users.filter(u => u.status === "active").length}</p>
        </div>
        <div className="bg-[#1c2033] border border-[#2a3050] rounded-xl p-3">
          <p className="text-[10px] text-[#5a6485]">Suspended</p>
          <p className="text-sm font-bold text-[#ff4757]">{users.filter(u => u.status === "suspended").length}</p>
        </div>
        <div className="bg-[#1c2033] border border-[#2a3050] rounded-xl p-3">
          <p className="text-[10px] text-[#5a6485]">Total Balance</p>
          <p className="text-sm font-bold text-[#ffc107]">GHS {users.reduce((s, u) => s + u.balance, 0).toFixed(2)}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5a6485]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && fetchUsers()}
            placeholder="Search users by email, name..."
            className="w-full bg-[#1c2033] border border-[#2a3050] rounded-lg pl-10 pr-4 py-2.5 text-sm text-white placeholder-[#5a6485] focus:outline-none focus:border-[#00d46e]/50"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="bg-[#1c2033] border border-[#2a3050] rounded-lg px-3 py-2 text-xs text-[#8b95b8] focus:outline-none min-w-[120px]"
        >
          <option value="">All Statuses</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
          <option value="self-excluded">Self-Excluded</option>
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-[#00d46e]" /></div>
      ) : users.length === 0 ? (
        <div className="text-center py-16">
          <UserPlus className="w-8 h-8 text-[#5a6485] mx-auto mb-3" />
          <p className="text-sm text-[#8b95b8]">No users found</p>
        </div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden lg:block bg-[#1c2033] border border-[#2a3050] rounded-xl overflow-hidden">
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
                <tbody className="divide-y divide-[#2a3050]/50">
                  {users.map((u) => (
                    <tr key={u._id} className="hover:bg-[#0f1118] transition-colors">
                      <td className="px-4 py-3">
                        <p className="text-xs font-medium text-white">{u.firstName} {u.lastName}</p>
                        <p className="text-[10px] text-[#5a6485]">{u.email}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                          u.role === "admin" ? "bg-[#8b5cf6]/10 text-[#8b5cf6]" :
                          u.role === "subadmin" ? "bg-[#3b82f6]/10 text-[#3b82f6]" :
                          "bg-[#2a3050] text-[#5a6485]"
                        }`}>{u.role.toUpperCase()}</span>
                        {u.referrer && (
                          <p className="text-[9px] text-[#5a6485] mt-1">
                            via {u.referrer.firstName} {u.referrer.lastName}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs font-bold text-[#00d46e]">GHS {u.balance.toFixed(2)}</td>
                      <td className="px-4 py-3"><StatusBadge status={u.status} /></td>
                      <td className="px-4 py-3">
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                          u.kycStatus === "approved" ? "bg-[#00d46e]/10 text-[#00d46e]" :
                          u.kycStatus === "pending" ? "bg-[#ffc107]/10 text-[#ffc107]" :
                          u.kycStatus === "rejected" ? "bg-[#ff4757]/10 text-[#ff4757]" :
                          "bg-[#2a3050] text-[#5a6485]"
                        }`}>{(u.kycStatus || "none").toUpperCase()}</span>
                      </td>
                      <td className="px-4 py-3 text-xs text-[#8b95b8]">GHS {u.totalDeposited.toFixed(2)}</td>
                      <td className="px-4 py-3 text-xs text-[#8b95b8]">GHS {u.totalWagered.toFixed(2)}</td>
                      <td className="px-4 py-3 text-xs text-[#5a6485]">{new Date(u.createdAt).toLocaleDateString()}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1 flex-wrap">
                          <button onClick={() => setSelectedUser(u)} className="text-[10px] px-2 py-1 bg-[#3b82f6]/10 text-[#3b82f6] rounded hover:bg-[#3b82f6]/20 transition-colors">
                            <Eye className="w-3 h-3 inline mr-0.5" /> View
                          </button>
                          {u.status === "active" ? (
                            <button onClick={() => handleAction(u._id, "suspend")} disabled={actionLoading === u._id} className="text-[10px] px-2 py-1 bg-[#ff4757]/10 text-[#ff4757] rounded hover:bg-[#ff4757]/20 transition-colors disabled:opacity-50">
                              <Ban className="w-3 h-3 inline mr-0.5" /> Suspend
                            </button>
                          ) : (
                            <button onClick={() => handleAction(u._id, "activate")} disabled={actionLoading === u._id} className="text-[10px] px-2 py-1 bg-[#00d46e]/10 text-[#00d46e] rounded hover:bg-[#00d46e]/20 transition-colors disabled:opacity-50">
                              <CheckCircle className="w-3 h-3 inline mr-0.5" /> Activate
                            </button>
                          )}
                          <button onClick={() => { setBalanceModal(u); setBalanceAmount(""); setBalanceReason(""); }} className="text-[10px] px-2 py-1 bg-[#ffc107]/10 text-[#ffc107] rounded hover:bg-[#ffc107]/20 transition-colors">
                            <DollarSign className="w-3 h-3 inline" /> Adjust
                          </button>
                          {u.role === "user" && (
                            <>
                              <button onClick={() => { if (confirm(`Make ${u.firstName} a sub-admin (agent)? Their referral code will become the agent link.`)) handleAction(u._id, "set_role", "subadmin"); }} disabled={actionLoading === u._id} className="text-[10px] px-2 py-1 bg-[#3b82f6]/10 text-[#3b82f6] rounded hover:bg-[#3b82f6]/20 transition-colors disabled:opacity-50">
                                <UserPlus className="w-3 h-3 inline" /> Sub-admin
                              </button>
                              <button onClick={() => { if (confirm(`Promote ${u.firstName} to FULL admin? They will have super-admin powers.`)) handleAction(u._id, "set_role", "admin"); }} disabled={actionLoading === u._id} className="text-[10px] px-2 py-1 bg-[#8b5cf6]/10 text-[#8b5cf6] rounded hover:bg-[#8b5cf6]/20 transition-colors disabled:opacity-50">
                                <Shield className="w-3 h-3 inline" /> Admin
                              </button>
                            </>
                          )}
                          {u.role === "subadmin" && (
                            <button onClick={() => { if (confirm(`Revoke sub-admin access for ${u.firstName}? They will become a regular user.`)) handleAction(u._id, "set_role", "user"); }} disabled={actionLoading === u._id} className="text-[10px] px-2 py-1 bg-[#5a6485]/10 text-[#8b95b8] rounded hover:bg-[#5a6485]/20 transition-colors disabled:opacity-50">
                              Revoke
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

          {/* Mobile Cards */}
          <div className="lg:hidden space-y-2">
            {users.map((u) => (
              <div key={u._id} className="bg-[#1c2033] border border-[#2a3050] rounded-xl p-3">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-lg bg-[#3b82f6]/10 flex items-center justify-center shrink-0">
                      <span className="text-xs font-bold text-[#3b82f6]">{u.firstName[0]}{u.lastName[0]}</span>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-white">{u.firstName} {u.lastName}</p>
                      <p className="text-[10px] text-[#5a6485]">{u.email}</p>
                    </div>
                  </div>
                  <StatusBadge status={u.status} />
                </div>
                <div className="grid grid-cols-3 gap-2 mb-3">
                  <div>
                    <p className="text-[9px] text-[#5a6485]">Balance</p>
                    <p className="text-xs font-bold text-[#00d46e]">GHS {u.balance.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-[9px] text-[#5a6485]">Deposited</p>
                    <p className="text-xs font-medium text-white">GHS {u.totalDeposited.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-[9px] text-[#5a6485]">Wagered</p>
                    <p className="text-xs font-medium text-white">GHS {u.totalWagered.toFixed(2)}</p>
                  </div>
                </div>
                <div className="flex gap-1.5 flex-wrap">
                  <button onClick={() => setSelectedUser(u)} className="text-[10px] px-2.5 py-1.5 bg-[#3b82f6]/10 text-[#3b82f6] rounded-lg hover:bg-[#3b82f6]/20 transition-colors">
                    View
                  </button>
                  {u.status === "active" ? (
                    <button onClick={() => handleAction(u._id, "suspend")} disabled={actionLoading === u._id} className="text-[10px] px-2.5 py-1.5 bg-[#ff4757]/10 text-[#ff4757] rounded-lg hover:bg-[#ff4757]/20 transition-colors disabled:opacity-50">
                      Suspend
                    </button>
                  ) : (
                    <button onClick={() => handleAction(u._id, "activate")} disabled={actionLoading === u._id} className="text-[10px] px-2.5 py-1.5 bg-[#00d46e]/10 text-[#00d46e] rounded-lg hover:bg-[#00d46e]/20 transition-colors disabled:opacity-50">
                      Activate
                    </button>
                  )}
                  <button onClick={() => { setBalanceModal(u); setBalanceAmount(""); setBalanceReason(""); }} className="text-[10px] px-2.5 py-1.5 bg-[#ffc107]/10 text-[#ffc107] rounded-lg hover:bg-[#ffc107]/20 transition-colors">
                    Adjust $
                  </button>
                  {u.role === "user" && (
                    <button onClick={() => { if (confirm(`Promote ${u.firstName} to admin?`)) handleAction(u._id, "set_role", "admin"); }} className="text-[10px] px-2.5 py-1.5 bg-[#8b5cf6]/10 text-[#8b5cf6] rounded-lg hover:bg-[#8b5cf6]/20 transition-colors">
                      Admin
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {pages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-xs text-[#5a6485]">Page {page} of {pages} ({total} total)</p>
              <div className="flex gap-1">
                <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page <= 1} className="p-2 bg-[#1c2033] border border-[#2a3050] rounded-lg text-[#8b95b8] hover:text-white disabled:opacity-40 transition-all">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button onClick={() => setPage(Math.min(pages, page + 1))} disabled={page >= pages} className="p-2 bg-[#1c2033] border border-[#2a3050] rounded-lg text-[#8b95b8] hover:text-white disabled:opacity-40 transition-all">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* User Detail Modal */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setSelectedUser(null)}>
          <div className="bg-[#161925] border border-[#2a3050] rounded-2xl w-full max-w-lg p-5 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-white">User Profile</h3>
              <button onClick={() => setSelectedUser(null)} className="text-[#5a6485] hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-12 h-12 rounded-xl bg-[#3b82f6]/10 flex items-center justify-center">
                <span className="text-lg font-bold text-[#3b82f6]">{selectedUser.firstName[0]}{selectedUser.lastName[0]}</span>
              </div>
              <div>
                <p className="text-sm font-bold text-white">{selectedUser.firstName} {selectedUser.lastName}</p>
                <p className="text-xs text-[#5a6485] flex items-center gap-1"><Mail className="w-3 h-3" /> {selectedUser.email}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <InfoCard icon={<Wallet className="w-3.5 h-3.5 text-[#00d46e]" />} label="Balance" value={`GHS ${selectedUser.balance.toFixed(2)}`} />
              <InfoCard icon={<DollarSign className="w-3.5 h-3.5 text-[#ffc107]" />} label="Bonus" value={`GHS ${selectedUser.bonusBalance.toFixed(2)}`} />
              <InfoCard icon={<BarChart3 className="w-3.5 h-3.5 text-[#3b82f6]" />} label="Deposited" value={`GHS ${selectedUser.totalDeposited.toFixed(2)}`} />
              <InfoCard icon={<BarChart3 className="w-3.5 h-3.5 text-[#8b5cf6]" />} label="Withdrawn" value={`GHS ${selectedUser.totalWithdrawn.toFixed(2)}`} />
              <InfoCard icon={<BarChart3 className="w-3.5 h-3.5 text-[#06b6d4]" />} label="Wagered" value={`GHS ${selectedUser.totalWagered.toFixed(2)}`} />
              <InfoCard icon={<BarChart3 className="w-3.5 h-3.5 text-[#00d46e]" />} label="Won" value={`GHS ${selectedUser.totalWon.toFixed(2)}`} />
            </div>
            <div className="space-y-2 mb-4">
              <DetailRow label="Status" value={selectedUser.status} />
              <DetailRow label="Role" value={selectedUser.role} />
              <DetailRow label="KYC" value={selectedUser.kycStatus || "none"} />
              <DetailRow label="Joined" value={new Date(selectedUser.createdAt).toLocaleDateString()} />
              <DetailRow label="Last Login" value={selectedUser.lastLoginAt ? new Date(selectedUser.lastLoginAt).toLocaleString() : "Never"} />
              {selectedUser.referrer && (
                <DetailRow
                  label="Brought by"
                  value={`${selectedUser.referrer.firstName} ${selectedUser.referrer.lastName} (${selectedUser.referrer.role})`}
                />
              )}
              {selectedUser.role === "subadmin" && selectedUser.referralCode && (
                <DetailRow
                  label="Agent code"
                  value={selectedUser.referralCode}
                />
              )}
            </div>
            <div className="flex gap-2 flex-wrap">
              {selectedUser.status === "active" ? (
                <button onClick={() => { handleAction(selectedUser._id, "suspend"); setSelectedUser(null); }} className="flex-1 py-2.5 bg-[#ff4757]/10 border border-[#ff4757]/20 rounded-lg text-xs font-medium text-[#ff4757] hover:bg-[#ff4757]/20 transition-all text-center">
                  Suspend Account
                </button>
              ) : (
                <button onClick={() => { handleAction(selectedUser._id, "activate"); setSelectedUser(null); }} className="flex-1 py-2.5 bg-[#00d46e]/10 border border-[#00d46e]/20 rounded-lg text-xs font-medium text-[#00d46e] hover:bg-[#00d46e]/20 transition-all text-center">
                  Activate Account
                </button>
              )}
              <button onClick={() => { setBalanceModal(selectedUser); setSelectedUser(null); setBalanceAmount(""); setBalanceReason(""); }} className="flex-1 py-2.5 bg-[#ffc107]/10 border border-[#ffc107]/20 rounded-lg text-xs font-medium text-[#ffc107] hover:bg-[#ffc107]/20 transition-all text-center">
                Adjust Balance
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Balance Adjust Modal */}
      {balanceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setBalanceModal(null)}>
          <div className="bg-[#161925] border border-[#2a3050] rounded-2xl p-5 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-white">Adjust Balance</h3>
              <button onClick={() => setBalanceModal(null)} className="text-[#5a6485] hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-[#8b95b8] mb-1">{balanceModal.firstName} {balanceModal.lastName} ({balanceModal.email})</p>
            <p className="text-xs text-[#5a6485] mb-4">Current balance: <span className="text-[#00d46e] font-bold">GHS {balanceModal.balance.toFixed(2)}</span></p>
            <div className="space-y-3">
              <div>
                <label className="text-[10px] text-[#5a6485] uppercase mb-1 block">Amount (use negative to deduct)</label>
                <input type="number" step="0.01" value={balanceAmount} onChange={(e) => setBalanceAmount(e.target.value)} placeholder="e.g. 50.00 or -25.00" className="w-full bg-[#0f1118] border border-[#2a3050] rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#00d46e]/50" />
              </div>
              <div>
                <label className="text-[10px] text-[#5a6485] uppercase mb-1 block">Reason</label>
                <input type="text" value={balanceReason} onChange={(e) => setBalanceReason(e.target.value)} placeholder="e.g. Bonus credit, Refund, Correction" className="w-full bg-[#0f1118] border border-[#2a3050] rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#00d46e]/50" />
              </div>
              <div className="flex gap-2 pt-2">
                <button onClick={() => setBalanceModal(null)} className="flex-1 px-4 py-2.5 text-xs font-medium text-[#8b95b8] bg-[#0f1118] border border-[#2a3050] rounded-lg hover:text-white transition-colors">
                  Cancel
                </button>
                <button onClick={handleBalanceAdjust} className="flex-1 px-4 py-2.5 text-xs font-medium text-white bg-[#00d46e] rounded-lg hover:bg-[#00d46e]/80 transition-colors">
                  Confirm
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Users({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function InfoCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="bg-[#0f1118] border border-[#2a3050] rounded-lg p-3">
      <div className="flex items-center gap-1.5 mb-1">{icon}<span className="text-[10px] text-[#5a6485]">{label}</span></div>
      <p className="text-xs font-bold text-white">{value}</p>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-[#2a3050]/50 last:border-0">
      <span className="text-xs text-[#5a6485]">{label}</span>
      <span className="text-xs font-medium text-white capitalize">{value}</span>
    </div>
  );
}
