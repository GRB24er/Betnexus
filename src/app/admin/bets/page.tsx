"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { api } from "@/lib/api";

type AdminBet = {
  _id: string;
  reference: string;
  type: string;
  status: string;
  stake: number;
  totalOdds: number;
  potentialWin: number;
  payout: number;
  selections: { match: string; selection: string }[];
  userId: { _id: string; firstName: string; lastName: string; email: string } | null;
  createdAt: string;
};

export default function AdminBetsPage() {
  const [bets, setBets] = useState<AdminBet[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchBets = () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: "20" });
    if (statusFilter) params.set("status", statusFilter);
    api
      .get<{ bets: AdminBet[]; total: number; pages: number }>(
        `/api/admin/bets?${params}`
      )
      .then((res) => { setBets(res.bets); setTotal(res.total); setPages(res.pages); })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchBets(); }, [page, statusFilter]);

  const handleSettle = async (betId: string, result: string) => {
    await api.patch("/api/admin/bets", { betId, action: "settle", result });
    fetchBets();
  };

  return (
    <div className="px-4 lg:px-8 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-white">Bet Management</h1>
          <p className="text-xs text-[#5a6485]">{total} bets</p>
        </div>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="bg-[#1c2033] border border-[#2a3050] rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
        >
          <option value="">All</option>
          <option value="pending">Pending</option>
          <option value="won">Won</option>
          <option value="lost">Lost</option>
          <option value="void">Void</option>
          <option value="cashed_out">Cashed Out</option>
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-[#00d46e]" /></div>
      ) : (
        <>
          <div className="space-y-2">
            {bets.map((bet) => (
              <div key={bet._id} className="bg-[#1c2033] border border-[#2a3050] rounded-xl px-4 py-3">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-mono text-[#5a6485]">{bet.reference}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        bet.status === "won" || bet.status === "cashed_out" ? "bg-[#00d46e]/20 text-[#00d46e]" :
                        bet.status === "lost" ? "bg-[#ff4757]/20 text-[#ff4757]" :
                        bet.status === "void" ? "bg-[#5a6485]/20 text-[#5a6485]" :
                        "bg-[#ffc107]/20 text-[#ffc107]"
                      }`}>
                        {bet.status.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-sm text-white">
                      {bet.type === "accumulator"
                        ? `Acca (${bet.selections.length} legs)`
                        : bet.selections[0]?.match}
                    </p>
                    {bet.userId && (
                      <p className="text-[11px] text-[#5a6485]">
                        {bet.userId.firstName} {bet.userId.lastName} ({bet.userId.email})
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-white">GHS {bet.stake.toFixed(2)}</p>
                    <p className="text-[11px] text-[#5a6485]">
                      Odds: {bet.totalOdds.toFixed(2)} | Win: GHS {bet.potentialWin.toFixed(2)}
                    </p>
                    <p className="text-[10px] text-[#5a6485]">
                      {new Date(bet.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
                {bet.status === "pending" && (
                  <div className="flex gap-2 pt-2 border-t border-[#2a3050]">
                    <button
                      onClick={() => handleSettle(bet._id, "won")}
                      className="text-[11px] px-3 py-1 bg-[#00d46e]/10 text-[#00d46e] rounded hover:bg-[#00d46e]/20 transition-colors"
                    >
                      Settle Won
                    </button>
                    <button
                      onClick={() => handleSettle(bet._id, "lost")}
                      className="text-[11px] px-3 py-1 bg-[#ff4757]/10 text-[#ff4757] rounded hover:bg-[#ff4757]/20 transition-colors"
                    >
                      Settle Lost
                    </button>
                    <button
                      onClick={() => handleSettle(bet._id, "void")}
                      className="text-[11px] px-3 py-1 bg-[#5a6485]/10 text-[#5a6485] rounded hover:bg-[#5a6485]/20 transition-colors"
                    >
                      Void
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>

          {pages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-4">
              <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1} className="p-2 text-[#5a6485] hover:text-white disabled:opacity-30">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs text-[#8b95b8]">Page {page} of {pages}</span>
              <button onClick={() => setPage(Math.min(pages, page + 1))} disabled={page === pages} className="p-2 text-[#5a6485] hover:text-white disabled:opacity-30">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
