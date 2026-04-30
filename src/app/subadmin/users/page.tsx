"use client";

import { useEffect, useState } from "react";
import { Loader2, Search } from "lucide-react";
import { api } from "@/lib/api";

type ReferredUser = {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  country?: string;
  balance: number;
  totalDeposited: number;
  totalWagered: number;
  totalWon: number;
  kycStatus: string;
  status: string;
  createdAt: string;
};

export default function SubAdminUsers() {
  const [users, setUsers] = useState<ReferredUser[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const params = new URLSearchParams({ page: String(page), limit: "30" });
    if (search) params.set("search", search);
    api
      .get<{ users: ReferredUser[]; total: number; pages: number }>(
        `/api/subadmin/users?${params}`
      )
      .then((r) => {
        if (cancelled) return;
        setUsers(r.users);
        setTotal(r.total);
        setPages(r.pages);
        setLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [page, search]);

  return (
    <div className="px-4 lg:px-8 py-6">
      <div className="mb-4">
        <h1 className="text-xl font-bold text-white">My Users</h1>
        <p className="text-xs text-[#5a6485]">{total} users referred by you</p>
      </div>

      <div className="relative mb-4">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#5a6485]" />
        <input
          value={search}
          onChange={(e) => {
            setPage(1);
            setSearch(e.target.value);
          }}
          placeholder="Search name or email..."
          className="w-full bg-[#1c2033] border border-[#2a3050] rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder-[#5a6485] focus:outline-none focus:border-[#00d46e]/50"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-[#00d46e]" />
        </div>
      ) : users.length === 0 ? (
        <p className="text-sm text-[#5a6485] text-center py-16">
          No users yet. Share your referral link from the dashboard to start earning.
        </p>
      ) : (
        <div className="overflow-x-auto bg-[#1c2033] border border-[#2a3050] rounded-xl">
          <table className="w-full text-sm">
            <thead className="bg-[#161925] text-[11px] text-[#5a6485] uppercase tracking-wide">
              <tr>
                <th className="text-left px-4 py-3">User</th>
                <th className="text-left px-4 py-3">Status</th>
                <th className="text-right px-4 py-3">Balance</th>
                <th className="text-right px-4 py-3">Deposited</th>
                <th className="text-right px-4 py-3">Wagered</th>
                <th className="text-right px-4 py-3">Won</th>
                <th className="text-right px-4 py-3">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2a3050]">
              {users.map((u) => (
                <tr key={u._id} className="text-white">
                  <td className="px-4 py-3">
                    <p className="font-medium">
                      {u.firstName} {u.lastName}
                    </p>
                    <p className="text-[11px] text-[#5a6485]">{u.email}</p>
                  </td>
                  <td className="px-4 py-3 text-xs">
                    <span
                      className={`px-2 py-0.5 rounded ${
                        u.status === "active"
                          ? "bg-[#00d46e]/15 text-[#00d46e]"
                          : "bg-[#ff4757]/15 text-[#ff4757]"
                      }`}
                    >
                      {u.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">{u.balance.toFixed(2)}</td>
                  <td className="px-4 py-3 text-right">{u.totalDeposited.toFixed(2)}</td>
                  <td className="px-4 py-3 text-right">{u.totalWagered.toFixed(2)}</td>
                  <td className="px-4 py-3 text-right">{u.totalWon.toFixed(2)}</td>
                  <td className="px-4 py-3 text-right text-xs text-[#8b95b8]">
                    {new Date(u.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {pages > 1 && (
        <div className="flex items-center justify-center gap-3 mt-4 text-sm text-[#8b95b8]">
          <button
            disabled={page === 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="px-3 py-1.5 rounded bg-[#1c2033] border border-[#2a3050] disabled:opacity-40"
          >
            Prev
          </button>
          <span>
            Page {page} of {pages}
          </span>
          <button
            disabled={page >= pages}
            onClick={() => setPage((p) => p + 1)}
            className="px-3 py-1.5 rounded bg-[#1c2033] border border-[#2a3050] disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
