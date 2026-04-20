"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { api } from "@/lib/api";

type AuditEntry = {
  _id: string;
  action: string;
  resource?: string;
  resourceId?: string;
  ip?: string;
  details?: Record<string, unknown>;
  userId?: { firstName: string; lastName: string; email: string } | null;
  adminId?: { firstName: string; lastName: string } | null;
  createdAt: string;
};

export default function AdminAuditPage() {
  const [logs, setLogs] = useState<AuditEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [actionFilter, setActionFilter] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: "30" });
    if (actionFilter) params.set("action", actionFilter);
    api
      .get<{ logs: AuditEntry[]; total: number; pages: number }>(`/api/admin/audit?${params}`)
      .then((r) => { setLogs(r.logs); setTotal(r.total); setPages(r.pages); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [page, actionFilter]);

  return (
    <div className="px-4 lg:px-8 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-white">Audit Logs</h1>
          <p className="text-xs text-[#5a6485]">{total} entries</p>
        </div>
        <select
          value={actionFilter}
          onChange={(e) => { setActionFilter(e.target.value); setPage(1); }}
          className="bg-[#1c2033] border border-[#2a3050] rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
        >
          <option value="">All Actions</option>
          <option value="user.login">Login</option>
          <option value="user.register">Register</option>
          <option value="bet.place">Bet Placed</option>
          <option value="bet.cashout">Cashout</option>
          <option value="deposit.success">Deposit</option>
          <option value="withdraw.request">Withdrawal</option>
          <option value="promo.redeem">Promo Redeem</option>
          <option value="admin.balance_adjust">Balance Adjust</option>
          <option value="user.kyc_submit">KYC Submit</option>
          <option value="user.kyc_approve">KYC Approve</option>
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-[#00d46e]" /></div>
      ) : (
        <>
          <div className="space-y-1.5">
            {logs.map((log) => (
              <div key={log._id} className="bg-[#1c2033] border border-[#2a3050] rounded-lg px-4 py-2.5 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold bg-[#3b82f6]/20 text-[#3b82f6] px-1.5 py-0.5 rounded font-mono">
                      {log.action}
                    </span>
                    {log.userId && (
                      <span className="text-[11px] text-[#8b95b8]">
                        {log.userId.firstName} {log.userId.lastName}
                      </span>
                    )}
                    {log.adminId && (
                      <span className="text-[10px] text-[#ffc107]">
                        by admin: {log.adminId.firstName}
                      </span>
                    )}
                  </div>
                  {log.details && (
                    <p className="text-[10px] text-[#5a6485] font-mono truncate mt-0.5">
                      {JSON.stringify(log.details).slice(0, 100)}
                    </p>
                  )}
                </div>
                <div className="text-right shrink-0">
                  <p className="text-[10px] text-[#5a6485]">
                    {new Date(log.createdAt).toLocaleString()}
                  </p>
                  {log.ip && <p className="text-[10px] text-[#5a6485] font-mono">{log.ip}</p>}
                </div>
              </div>
            ))}
          </div>

          {pages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-4">
              <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1} className="p-2 text-[#5a6485] hover:text-white disabled:opacity-30"><ChevronLeft className="w-4 h-4" /></button>
              <span className="text-xs text-[#8b95b8]">Page {page} of {pages}</span>
              <button onClick={() => setPage(Math.min(pages, page + 1))} disabled={page === pages} className="p-2 text-[#5a6485] hover:text-white disabled:opacity-30"><ChevronRight className="w-4 h-4" /></button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
