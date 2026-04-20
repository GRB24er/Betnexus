"use client";

import { useEffect, useState } from "react";
import { Search, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { api } from "@/lib/api";

type AdminUser = {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  balance: number;
  status: string;
  kycStatus: string;
  role: string;
  totalDeposited: number;
  totalWagered: number;
  createdAt: string;
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);

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
    await api.post("/api/admin/users", { userId, action, value });
    fetchUsers();
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
                    <th className="px-4 py-3">Balance</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">KYC</th>
                    <th className="px-4 py-3">Deposited</th>
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
                      <td className="px-4 py-3 text-xs text-[#5a6485]">
                        {new Date(u.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          {u.status === "active" ? (
                            <button
                              onClick={() => handleAction(u._id, "suspend")}
                              className="text-[10px] px-2 py-1 bg-[#ff4757]/10 text-[#ff4757] rounded hover:bg-[#ff4757]/20 transition-colors"
                            >
                              Suspend
                            </button>
                          ) : (
                            <button
                              onClick={() => handleAction(u._id, "activate")}
                              className="text-[10px] px-2 py-1 bg-[#00d46e]/10 text-[#00d46e] rounded hover:bg-[#00d46e]/20 transition-colors"
                            >
                              Activate
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
    </div>
  );
}
