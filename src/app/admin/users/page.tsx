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
  Wallet,
  Download,
  ShieldOff,
  Send,
  Phone,
} from "lucide-react";
import { api } from "@/lib/api";

type AdminUser = {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  username?: string;
  phone?: string;
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
  lastIp?: string;
  knownIps?: string[];
  knownDevices?: string[];
  blockedReason?: string;
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);

  const [balanceModal, setBalanceModal] = useState<AdminUser | null>(null);
  const [balanceAmount, setBalanceAmount] = useState("");
  const [balanceReason, setBalanceReason] = useState("");

  const [emailModal, setEmailModal] = useState<AdminUser | null>(null);
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");
  const [emailSending, setEmailSending] = useState(false);
  const [emailMsg, setEmailMsg] = useState<string | null>(null);

  const [banModal, setBanModal] = useState<AdminUser | null>(null);
  const [banReason, setBanReason] = useState("");

  const fetchUsers = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: "20" });
    if (search) params.set("search", search);
    if (statusFilter) params.set("status", statusFilter);
    if (roleFilter) params.set("role", roleFilter);
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
  }, [page, statusFilter, roleFilter, search]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleAction = async (
    userId: string,
    action: string,
    value?: unknown
  ) => {
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

  const handleSendEmail = async () => {
    if (!emailModal || !emailSubject || !emailBody) return;
    setEmailSending(true);
    setEmailMsg(null);
    try {
      await api.post("/api/admin/email-user", {
        userId: emailModal._id,
        subject: emailSubject,
        body: emailBody.replace(/\n/g, "<br/>"),
      });
      setEmailMsg(`Email sent to ${emailModal.email}`);
      setTimeout(() => {
        setEmailModal(null);
        setEmailSubject("");
        setEmailBody("");
        setEmailMsg(null);
      }, 1200);
    } catch (err) {
      setEmailMsg(err instanceof Error ? err.message : "Failed to send");
    } finally {
      setEmailSending(false);
    }
  };

  const handleBanIp = async () => {
    if (!banModal) return;
    await handleAction(banModal._id, "ban_ip_device", {
      reason: banReason || "Banned by administrator",
    });
    setBanModal(null);
    setBanReason("");
  };

  const exportCSV = () => {
    const headers =
      "Name,Username,Email,Phone,Balance,Status,Role,KYC,Deposited,Wagered,Joined,LastIP\n";
    const rows = users
      .map(
        (u) =>
          `${u.firstName} ${u.lastName},${u.username || ""},${u.email},${u.phone || ""},${u.balance},${u.status},${u.role},${u.kycStatus || "none"},${u.totalDeposited},${u.totalWagered},${new Date(u.createdAt).toISOString()},${u.lastIp || ""}`
      )
      .join("\n");
    const blob = new Blob([headers + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `users-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const StatusBadge = ({ status }: { status: string }) => {
    const cls =
      status === "active"
        ? "bg-[#00d46e]/10 text-[#00d46e]"
        : status === "blocked"
          ? "bg-[#ff4757]/15 text-[#ff4757]"
          : status === "suspended"
            ? "bg-[#ff4757]/10 text-[#ff4757]"
            : "bg-[#ffc107]/10 text-[#ffc107]";
    return (
      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${cls}`}>
        {status.toUpperCase()}
      </span>
    );
  };

  return (
    <div className="px-3 sm:px-4 lg:px-8 py-4 sm:py-6 max-w-[1400px] mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
            <UsersIcon className="w-5 h-5 text-[#3b82f6]" />
            User Management
          </h1>
          <p className="text-[11px] text-[#5a6485]">
            {total} total users · Block, ban, message and search
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={exportCSV}
            className="flex items-center gap-1.5 px-3 py-2 bg-[#1c2033] border border-[#2a3050] rounded-lg text-xs text-[#8b95b8] hover:text-white transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Export</span>
          </button>
          <button
            onClick={fetchUsers}
            className="p-2 text-[#8b95b8] hover:text-[#00d46e] transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
        <div className="bg-[#1c2033] border border-[#2a3050] rounded-xl p-3">
          <p className="text-[10px] text-[#5a6485]">Total Users</p>
          <p className="text-sm font-bold text-[#3b82f6]">{total}</p>
        </div>
        <div className="bg-[#1c2033] border border-[#2a3050] rounded-xl p-3">
          <p className="text-[10px] text-[#5a6485]">Active</p>
          <p className="text-sm font-bold text-[#00d46e]">
            {users.filter((u) => u.status === "active").length}
          </p>
        </div>
        <div className="bg-[#1c2033] border border-[#2a3050] rounded-xl p-3">
          <p className="text-[10px] text-[#5a6485]">Blocked</p>
          <p className="text-sm font-bold text-[#ff4757]">
            {users.filter((u) => u.status === "blocked").length}
          </p>
        </div>
        <div className="bg-[#1c2033] border border-[#2a3050] rounded-xl p-3">
          <p className="text-[10px] text-[#5a6485]">Sub-admins</p>
          <p className="text-sm font-bold text-[#8b5cf6]">
            {users.filter((u) => u.role === "subadmin").length}
          </p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5a6485]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && fetchUsers()}
            placeholder="Search by username, email, phone, name, code…"
            className="w-full bg-[#1c2033] border border-[#2a3050] rounded-lg pl-10 pr-4 py-2.5 text-sm text-white placeholder-[#5a6485] focus:outline-none focus:border-[#00d46e]/50"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          className="bg-[#1c2033] border border-[#2a3050] rounded-lg px-3 py-2 text-xs text-[#8b95b8] focus:outline-none min-w-[120px]"
        >
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
          <option value="blocked">Blocked</option>
          <option value="self-excluded">Self-Excluded</option>
        </select>
        <select
          value={roleFilter}
          onChange={(e) => {
            setRoleFilter(e.target.value);
            setPage(1);
          }}
          className="bg-[#1c2033] border border-[#2a3050] rounded-lg px-3 py-2 text-xs text-[#8b95b8] focus:outline-none min-w-[120px]"
        >
          <option value="">All Roles</option>
          <option value="user">Users</option>
          <option value="subadmin">Sub-admins</option>
          <option value="admin">Admins</option>
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-[#00d46e]" />
        </div>
      ) : users.length === 0 ? (
        <div className="text-center py-16">
          <UserPlus className="w-8 h-8 text-[#5a6485] mx-auto mb-3" />
          <p className="text-sm text-[#8b95b8]">No users found</p>
        </div>
      ) : (
        <>
          <div className="hidden lg:block bg-[#1c2033] border border-[#2a3050] rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="border-b border-[#2a3050]">
                  <tr className="text-[10px] text-[#5a6485] uppercase">
                    <th className="px-4 py-3">User</th>
                    <th className="px-4 py-3">Role</th>
                    <th className="px-4 py-3">Balance</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Deposited</th>
                    <th className="px-4 py-3">Last IP</th>
                    <th className="px-4 py-3">Joined</th>
                    <th className="px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#2a3050]/50">
                  {users.map((u) => (
                    <tr key={u._id} className="hover:bg-[#0f1118] transition-colors">
                      <td className="px-4 py-3">
                        <p className="text-xs font-medium text-white">
                          {u.firstName} {u.lastName}
                          {u.username && (
                            <span className="text-[10px] text-[#5a6485] ml-1">
                              @{u.username}
                            </span>
                          )}
                        </p>
                        <p className="text-[10px] text-[#5a6485]">
                          {u.email}
                        </p>
                        {u.phone && (
                          <p className="text-[10px] text-[#5a6485] flex items-center gap-1">
                            <Phone className="w-2.5 h-2.5" /> {u.phone}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                            u.role === "admin"
                              ? "bg-[#8b5cf6]/10 text-[#8b5cf6]"
                              : u.role === "subadmin"
                                ? "bg-[#06b6d4]/10 text-[#06b6d4]"
                                : "bg-[#2a3050] text-[#5a6485]"
                          }`}
                        >
                          {u.role.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs font-bold text-[#00d46e]">
                        GHS {u.balance.toFixed(2)}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={u.status} />
                      </td>
                      <td className="px-4 py-3 text-xs text-[#8b95b8]">
                        GHS {u.totalDeposited.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-[10px] font-mono text-[#5a6485]">
                        {u.lastIp || "—"}
                      </td>
                      <td className="px-4 py-3 text-xs text-[#5a6485]">
                        {new Date(u.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1 flex-wrap">
                          <button
                            onClick={() => setSelectedUser(u)}
                            className="text-[10px] px-2 py-1 bg-[#3b82f6]/10 text-[#3b82f6] rounded hover:bg-[#3b82f6]/20 transition-colors"
                          >
                            <Eye className="w-3 h-3 inline" />
                          </button>
                          <button
                            onClick={() => {
                              setEmailModal(u);
                              setEmailSubject("");
                              setEmailBody("");
                            }}
                            className="text-[10px] px-2 py-1 bg-[#06b6d4]/10 text-[#06b6d4] rounded hover:bg-[#06b6d4]/20 transition-colors"
                          >
                            <Mail className="w-3 h-3 inline" />
                          </button>
                          {u.status !== "blocked" ? (
                            <button
                              onClick={() => handleAction(u._id, "block")}
                              disabled={actionLoading === u._id}
                              className="text-[10px] px-2 py-1 bg-[#ff4757]/10 text-[#ff4757] rounded hover:bg-[#ff4757]/20 transition-colors disabled:opacity-50"
                            >
                              <Ban className="w-3 h-3 inline mr-0.5" /> Block
                            </button>
                          ) : (
                            <button
                              onClick={() => handleAction(u._id, "unblock")}
                              disabled={actionLoading === u._id}
                              className="text-[10px] px-2 py-1 bg-[#00d46e]/10 text-[#00d46e] rounded hover:bg-[#00d46e]/20 transition-colors disabled:opacity-50"
                            >
                              <CheckCircle className="w-3 h-3 inline mr-0.5" />{" "}
                              Unblock
                            </button>
                          )}
                          <button
                            onClick={() => {
                              setBanModal(u);
                              setBanReason("");
                            }}
                            className="text-[10px] px-2 py-1 bg-[#ff4757]/10 text-[#ff4757] rounded hover:bg-[#ff4757]/20 transition-colors"
                            title="Ban IP & device"
                          >
                            <ShieldOff className="w-3 h-3 inline mr-0.5" /> IP
                          </button>
                          <button
                            onClick={() => {
                              setBalanceModal(u);
                              setBalanceAmount("");
                              setBalanceReason("");
                            }}
                            className="text-[10px] px-2 py-1 bg-[#ffc107]/10 text-[#ffc107] rounded hover:bg-[#ffc107]/20 transition-colors"
                          >
                            <DollarSign className="w-3 h-3 inline" />
                          </button>
                          {u.role === "user" && (
                            <button
                              onClick={() => {
                                if (
                                  confirm(
                                    `Promote ${u.firstName} to sub-admin?`
                                  )
                                )
                                  handleAction(u._id, "set_role", "subadmin");
                              }}
                              className="text-[10px] px-2 py-1 bg-[#06b6d4]/10 text-[#06b6d4] rounded hover:bg-[#06b6d4]/20 transition-colors"
                            >
                              <Shield className="w-3 h-3 inline" /> Sub
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

          <div className="lg:hidden space-y-2">
            {users.map((u) => (
              <div
                key={u._id}
                className="bg-[#1c2033] border border-[#2a3050] rounded-xl p-3"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-lg bg-[#3b82f6]/10 flex items-center justify-center shrink-0">
                      <span className="text-xs font-bold text-[#3b82f6]">
                        {u.firstName[0]}
                        {u.lastName[0]}
                      </span>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-white">
                        {u.firstName} {u.lastName}
                      </p>
                      <p className="text-[10px] text-[#5a6485]">{u.email}</p>
                      {u.phone && (
                        <p className="text-[10px] text-[#5a6485]">{u.phone}</p>
                      )}
                    </div>
                  </div>
                  <StatusBadge status={u.status} />
                </div>
                <div className="flex gap-1.5 flex-wrap">
                  <button
                    onClick={() => setSelectedUser(u)}
                    className="text-[10px] px-2.5 py-1.5 bg-[#3b82f6]/10 text-[#3b82f6] rounded-lg"
                  >
                    View
                  </button>
                  <button
                    onClick={() => {
                      setEmailModal(u);
                      setEmailSubject("");
                      setEmailBody("");
                    }}
                    className="text-[10px] px-2.5 py-1.5 bg-[#06b6d4]/10 text-[#06b6d4] rounded-lg"
                  >
                    Email
                  </button>
                  {u.status !== "blocked" ? (
                    <button
                      onClick={() => handleAction(u._id, "block")}
                      className="text-[10px] px-2.5 py-1.5 bg-[#ff4757]/10 text-[#ff4757] rounded-lg"
                    >
                      Block
                    </button>
                  ) : (
                    <button
                      onClick={() => handleAction(u._id, "unblock")}
                      className="text-[10px] px-2.5 py-1.5 bg-[#00d46e]/10 text-[#00d46e] rounded-lg"
                    >
                      Unblock
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setBanModal(u);
                      setBanReason("");
                    }}
                    className="text-[10px] px-2.5 py-1.5 bg-[#ff4757]/10 text-[#ff4757] rounded-lg"
                  >
                    Ban IP
                  </button>
                  <button
                    onClick={() => {
                      setBalanceModal(u);
                      setBalanceAmount("");
                      setBalanceReason("");
                    }}
                    className="text-[10px] px-2.5 py-1.5 bg-[#ffc107]/10 text-[#ffc107] rounded-lg"
                  >
                    Adjust $
                  </button>
                </div>
              </div>
            ))}
          </div>

          {pages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-xs text-[#5a6485]">
                Page {page} of {pages} ({total} total)
              </p>
              <div className="flex gap-1">
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page <= 1}
                  className="p-2 bg-[#1c2033] border border-[#2a3050] rounded-lg text-[#8b95b8] hover:text-white disabled:opacity-40 transition-all"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setPage(Math.min(pages, page + 1))}
                  disabled={page >= pages}
                  className="p-2 bg-[#1c2033] border border-[#2a3050] rounded-lg text-[#8b95b8] hover:text-white disabled:opacity-40 transition-all"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* User detail modal */}
      {selectedUser && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedUser(null)}
        >
          <div
            className="bg-[#161925] border border-[#2a3050] rounded-2xl w-full max-w-lg p-5 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-white">User Profile</h3>
              <button
                onClick={() => setSelectedUser(null)}
                className="text-[#5a6485] hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <InfoCard
                label="Balance"
                value={`GHS ${selectedUser.balance.toFixed(2)}`}
              />
              <InfoCard
                label="Bonus"
                value={`GHS ${selectedUser.bonusBalance.toFixed(2)}`}
              />
              <InfoCard
                label="Deposited"
                value={`GHS ${selectedUser.totalDeposited.toFixed(2)}`}
              />
              <InfoCard
                label="Wagered"
                value={`GHS ${selectedUser.totalWagered.toFixed(2)}`}
              />
            </div>
            <div className="space-y-2 mb-4">
              <DetailRow label="Status" value={selectedUser.status} />
              <DetailRow label="Role" value={selectedUser.role} />
              <DetailRow
                label="Phone"
                value={selectedUser.phone || "—"}
              />
              <DetailRow
                label="Username"
                value={selectedUser.username || "—"}
              />
              <DetailRow
                label="Last IP"
                value={selectedUser.lastIp || "—"}
              />
              <DetailRow
                label="Known IPs"
                value={(selectedUser.knownIps || []).slice(0, 3).join(", ") || "—"}
              />
              <DetailRow
                label="Devices"
                value={String(selectedUser.knownDevices?.length || 0)}
              />
              {selectedUser.blockedReason && (
                <DetailRow
                  label="Block reason"
                  value={selectedUser.blockedReason}
                />
              )}
            </div>
          </div>
        </div>
      )}

      {/* Balance modal */}
      {balanceModal && (
        <Modal onClose={() => setBalanceModal(null)} title="Adjust Balance">
          <p className="text-xs text-[#8b95b8] mb-1">
            {balanceModal.firstName} {balanceModal.lastName}
          </p>
          <p className="text-xs text-[#5a6485] mb-4">
            Current:{" "}
            <span className="text-[#00d46e] font-bold">
              GHS {balanceModal.balance.toFixed(2)}
            </span>
          </p>
          <div className="space-y-3">
            <FieldText
              label="Amount (negative deducts)"
              value={balanceAmount}
              onChange={setBalanceAmount}
              type="number"
            />
            <FieldText
              label="Reason"
              value={balanceReason}
              onChange={setBalanceReason}
            />
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setBalanceModal(null)}
                className="flex-1 px-4 py-2.5 text-xs font-medium text-[#8b95b8] bg-[#0f1118] border border-[#2a3050] rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleBalanceAdjust}
                className="flex-1 px-4 py-2.5 text-xs font-medium text-white bg-[#00d46e] rounded-lg"
              >
                Confirm
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Email modal */}
      {emailModal && (
        <Modal onClose={() => setEmailModal(null)} title="Send Email to User">
          <p className="text-xs text-[#8b95b8] mb-3">
            To: <span className="text-white">{emailModal.email}</span>
          </p>
          <div className="space-y-3">
            <FieldText
              label="Subject"
              value={emailSubject}
              onChange={setEmailSubject}
            />
            <div>
              <label className="block text-[10px] text-[#5a6485] uppercase mb-1">
                Message
              </label>
              <textarea
                value={emailBody}
                onChange={(e) => setEmailBody(e.target.value)}
                rows={6}
                className="w-full bg-[#0f1118] border border-[#2a3050] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#00d46e]/50"
              />
            </div>
            {emailMsg && (
              <p className="text-xs text-[#00d46e]">{emailMsg}</p>
            )}
            <div className="flex gap-2 pt-1">
              <button
                onClick={() => setEmailModal(null)}
                className="flex-1 px-4 py-2.5 text-xs font-medium text-[#8b95b8] bg-[#0f1118] border border-[#2a3050] rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleSendEmail}
                disabled={emailSending || !emailSubject || !emailBody}
                className="flex-1 px-4 py-2.5 text-xs font-medium text-white bg-[#06b6d4] rounded-lg disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                {emailSending ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Send className="w-3 h-3" />
                )}{" "}
                Send
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Ban IP & device modal */}
      {banModal && (
        <Modal onClose={() => setBanModal(null)} title="Ban IP & Device">
          <div className="bg-[#ff4757]/10 border border-[#ff4757]/20 rounded-lg p-3 mb-3 text-[11px] text-[#ff4757]">
            <p className="font-bold mb-1">This will:</p>
            <ul className="space-y-0.5 list-disc list-inside">
              <li>Block this user&apos;s account</li>
              <li>
                Ban {(banModal.knownIps?.length || 0) + (banModal.lastIp ? 1 : 0)}{" "}
                IP(s)
              </li>
              <li>
                Ban {banModal.knownDevices?.length || 0} device fingerprint(s)
              </li>
              <li>Prevent re-registration from same IP/device</li>
            </ul>
          </div>
          <FieldText label="Reason" value={banReason} onChange={setBanReason} />
          <div className="flex gap-2 pt-3">
            <button
              onClick={() => setBanModal(null)}
              className="flex-1 px-4 py-2.5 text-xs font-medium text-[#8b95b8] bg-[#0f1118] border border-[#2a3050] rounded-lg"
            >
              Cancel
            </button>
            <button
              onClick={handleBanIp}
              className="flex-1 px-4 py-2.5 text-xs font-medium text-white bg-[#ff4757] rounded-lg"
            >
              Confirm Ban
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function Modal({
  onClose,
  title,
  children,
}: {
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="bg-[#161925] border border-[#2a3050] rounded-2xl p-5 w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-white">{title}</h3>
          <button
            onClick={onClose}
            className="text-[#5a6485] hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function FieldText({
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

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-[#0f1118] border border-[#2a3050] rounded-lg p-3">
      <div className="flex items-center gap-1.5 mb-1">
        <Wallet className="w-3 h-3 text-[#00d46e]" />
        <span className="text-[10px] text-[#5a6485]">{label}</span>
      </div>
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

function UsersIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

