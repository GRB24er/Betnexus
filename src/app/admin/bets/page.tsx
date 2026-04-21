"use client";

import { useEffect, useState, useCallback } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  Search,
  RefreshCw,
  Eye,
  X,
  CheckCircle,
  XCircle,
  Clock,
  Ban,
  Ticket,
  TrendingUp,
  DollarSign,
} from "lucide-react";
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
  cashoutValue?: number;
  selections: { match: string; selection: string; odds?: number }[];
  userId: { _id: string; firstName: string; lastName: string; email: string } | null;
  createdAt: string;
};

export default function AdminBetsPage() {
  const [bets, setBets] = useState<AdminBet[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [selectedBet, setSelectedBet] = useState<AdminBet | null>(null);

  const fetchBets = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: "20" });
    if (statusFilter) params.set("status", statusFilter);
    if (search) params.set("search", search);
    api
      .get<{ bets: AdminBet[]; total: number; pages: number }>(`/api/admin/bets?${params}`)
      .then((res) => { setBets(res.bets); setTotal(res.total); setPages(res.pages); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [page, statusFilter, search]);

  useEffect(() => { fetchBets(); }, [fetchBets]);

  const handleSettle = async (betId: string, result: string) => {
    if (!confirm(`Are you sure you want to settle this bet as ${result.toUpperCase()}?`)) return;
    setActionLoading(betId);
    try {
      await api.patch("/api/admin/bets", { betId, action: "settle", result });
      fetchBets();
      setSelectedBet(null);
    } catch {
      alert("Failed to settle bet");
    } finally {
      setActionLoading(null);
    }
  };

  const totalStake = bets.reduce((s, b) => s + b.stake, 0);
  const totalPotentialWin = bets.reduce((s, b) => s + b.potentialWin, 0);
  const pendingCount = bets.filter(b => b.status === "pending").length;

  return (
    <div className="px-3 sm:px-4 lg:px-8 py-4 sm:py-6 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
            <Ticket className="w-5 h-5 text-[#ffc107]" />
            Bet Management
          </h1>
          <p className="text-[11px] text-[#5a6485]">{total} total bets · Settle, void, and monitor all bets</p>
        </div>
        <button onClick={fetchBets} className="p-2 text-[#8b95b8] hover:text-[#00d46e] transition-colors self-end">
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
        <div className="bg-[#1c2033] border border-[#2a3050] rounded-xl p-3">
          <p className="text-[10px] text-[#5a6485]">Total Bets</p>
          <p className="text-sm font-bold text-[#3b82f6]">{total}</p>
        </div>
        <div className="bg-[#1c2033] border border-[#2a3050] rounded-xl p-3">
          <p className="text-[10px] text-[#5a6485]">Pending</p>
          <p className="text-sm font-bold text-[#ffc107]">{pendingCount}</p>
        </div>
        <div className="bg-[#1c2033] border border-[#2a3050] rounded-xl p-3">
          <p className="text-[10px] text-[#5a6485]">Total Stakes</p>
          <p className="text-sm font-bold text-[#00d46e]">GHS {totalStake.toFixed(2)}</p>
        </div>
        <div className="bg-[#1c2033] border border-[#2a3050] rounded-xl p-3">
          <p className="text-[10px] text-[#5a6485]">Potential Liability</p>
          <p className="text-sm font-bold text-[#ff4757]">GHS {totalPotentialWin.toFixed(2)}</p>
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
            onKeyDown={(e) => e.key === "Enter" && fetchBets()}
            placeholder="Search by reference, user..."
            className="w-full bg-[#1c2033] border border-[#2a3050] rounded-lg pl-10 pr-4 py-2.5 text-sm text-white placeholder-[#5a6485] focus:outline-none focus:border-[#00d46e]/50"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="bg-[#1c2033] border border-[#2a3050] rounded-lg px-3 py-2 text-xs text-[#8b95b8] focus:outline-none min-w-[120px]"
        >
          <option value="">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="won">Won</option>
          <option value="lost">Lost</option>
          <option value="void">Void</option>
          <option value="cashed_out">Cashed Out</option>
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-[#00d46e]" /></div>
      ) : bets.length === 0 ? (
        <div className="text-center py-16">
          <Ticket className="w-8 h-8 text-[#5a6485] mx-auto mb-3" />
          <p className="text-sm text-[#8b95b8]">No bets found</p>
        </div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden lg:block bg-[#1c2033] border border-[#2a3050] rounded-xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#2a3050]">
                  <th className="text-left text-[10px] text-[#5a6485] font-medium px-4 py-3">REF</th>
                  <th className="text-left text-[10px] text-[#5a6485] font-medium px-4 py-3">USER</th>
                  <th className="text-left text-[10px] text-[#5a6485] font-medium px-4 py-3">TYPE</th>
                  <th className="text-left text-[10px] text-[#5a6485] font-medium px-4 py-3">MATCH</th>
                  <th className="text-right text-[10px] text-[#5a6485] font-medium px-4 py-3">STAKE</th>
                  <th className="text-right text-[10px] text-[#5a6485] font-medium px-4 py-3">ODDS</th>
                  <th className="text-right text-[10px] text-[#5a6485] font-medium px-4 py-3">POT. WIN</th>
                  <th className="text-center text-[10px] text-[#5a6485] font-medium px-4 py-3">STATUS</th>
                  <th className="text-center text-[10px] text-[#5a6485] font-medium px-4 py-3">ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {bets.map((bet) => (
                  <tr key={bet._id} className="border-b border-[#2a3050]/50 hover:bg-[#0f1118] transition-all">
                    <td className="px-4 py-3 text-[10px] font-mono text-[#5a6485]">{bet.reference?.slice(-8) || bet._id.slice(-8)}</td>
                    <td className="px-4 py-3">
                      <p className="text-xs text-white">{bet.userId?.firstName || "—"} {bet.userId?.lastName || ""}</p>
                      <p className="text-[10px] text-[#5a6485]">{bet.userId?.email || ""}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${bet.type === "accumulator" ? "bg-[#8b5cf6]/10 text-[#8b5cf6]" : "bg-[#3b82f6]/10 text-[#3b82f6]"}`}>
                        {bet.type === "accumulator" ? `ACCA (${bet.selections.length})` : "SINGLE"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-white max-w-[200px] truncate">
                      {bet.type === "accumulator" ? `${bet.selections.length} selections` : bet.selections[0]?.match || "—"}
                    </td>
                    <td className="px-4 py-3 text-right text-xs font-medium text-white">GHS {bet.stake.toFixed(2)}</td>
                    <td className="px-4 py-3 text-right text-xs text-[#8b95b8]">{bet.totalOdds.toFixed(2)}</td>
                    <td className="px-4 py-3 text-right text-xs font-medium text-[#ffc107]">GHS {bet.potentialWin.toFixed(2)}</td>
                    <td className="px-4 py-3 text-center"><StatusBadge status={bet.status} /></td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1">
                        <button onClick={() => setSelectedBet(bet)} className="p-1.5 text-[#5a6485] hover:text-white transition-colors">
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        {bet.status === "pending" && (
                          <>
                            <button onClick={() => handleSettle(bet._id, "won")} disabled={actionLoading === bet._id} className="p-1.5 text-[#00d46e] hover:text-[#00d46e]/80 transition-colors disabled:opacity-40">
                              {actionLoading === bet._id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
                            </button>
                            <button onClick={() => handleSettle(bet._id, "lost")} disabled={actionLoading === bet._id} className="p-1.5 text-[#ff4757] hover:text-[#ff4757]/80 transition-colors disabled:opacity-40">
                              <XCircle className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => handleSettle(bet._id, "void")} disabled={actionLoading === bet._id} className="p-1.5 text-[#8b95b8] hover:text-white transition-colors disabled:opacity-40">
                              <Ban className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="lg:hidden space-y-2">
            {bets.map((bet) => (
              <div key={bet._id} className="bg-[#1c2033] border border-[#2a3050] rounded-xl p-3" onClick={() => setSelectedBet(bet)}>
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${bet.type === "accumulator" ? "bg-[#8b5cf6]/10 text-[#8b5cf6]" : "bg-[#3b82f6]/10 text-[#3b82f6]"}`}>
                        {bet.type === "accumulator" ? `ACCA (${bet.selections.length})` : "SINGLE"}
                      </span>
                      <StatusBadge status={bet.status} />
                    </div>
                    <p className="text-xs text-white">{bet.type === "accumulator" ? `${bet.selections.length} selections` : bet.selections[0]?.match || "—"}</p>
                    <p className="text-[10px] text-[#5a6485]">{bet.userId?.firstName} {bet.userId?.lastName}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-white">GHS {bet.stake.toFixed(2)}</p>
                    <p className="text-[10px] text-[#ffc107]">Win: GHS {bet.potentialWin.toFixed(2)}</p>
                  </div>
                </div>
                {bet.status === "pending" && (
                  <div className="flex gap-2 pt-2 border-t border-[#2a3050]/50">
                    <button onClick={(e) => { e.stopPropagation(); handleSettle(bet._id, "won"); }} className="flex-1 text-[10px] py-1.5 bg-[#00d46e]/10 text-[#00d46e] rounded-lg hover:bg-[#00d46e]/20 transition-colors text-center">
                      Won
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); handleSettle(bet._id, "lost"); }} className="flex-1 text-[10px] py-1.5 bg-[#ff4757]/10 text-[#ff4757] rounded-lg hover:bg-[#ff4757]/20 transition-colors text-center">
                      Lost
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); handleSettle(bet._id, "void"); }} className="flex-1 text-[10px] py-1.5 bg-[#5a6485]/10 text-[#5a6485] rounded-lg hover:bg-[#5a6485]/20 transition-colors text-center">
                      Void
                    </button>
                  </div>
                )}
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

      {/* Bet Detail Modal */}
      {selectedBet && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setSelectedBet(null)}>
          <div className="bg-[#161925] border border-[#2a3050] rounded-2xl w-full max-w-lg p-5 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Ticket className="w-4 h-4 text-[#ffc107]" /> Bet Details
              </h3>
              <button onClick={() => setSelectedBet(null)} className="text-[#5a6485] hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-[#0f1118] border border-[#2a3050] rounded-lg p-3">
                <p className="text-[10px] text-[#5a6485]">Stake</p>
                <p className="text-sm font-bold text-white">GHS {selectedBet.stake.toFixed(2)}</p>
              </div>
              <div className="bg-[#0f1118] border border-[#2a3050] rounded-lg p-3">
                <p className="text-[10px] text-[#5a6485]">Potential Win</p>
                <p className="text-sm font-bold text-[#ffc107]">GHS {selectedBet.potentialWin.toFixed(2)}</p>
              </div>
              <div className="bg-[#0f1118] border border-[#2a3050] rounded-lg p-3">
                <p className="text-[10px] text-[#5a6485]">Total Odds</p>
                <p className="text-sm font-bold text-[#3b82f6]">{selectedBet.totalOdds.toFixed(2)}</p>
              </div>
              <div className="bg-[#0f1118] border border-[#2a3050] rounded-lg p-3">
                <p className="text-[10px] text-[#5a6485]">Payout</p>
                <p className="text-sm font-bold text-[#00d46e]">GHS {selectedBet.payout.toFixed(2)}</p>
              </div>
            </div>

            <div className="space-y-2 mb-4">
              <DetailRow label="Reference" value={selectedBet.reference || selectedBet._id.slice(-12)} />
              <DetailRow label="Type" value={selectedBet.type} />
              <DetailRow label="Status" value={selectedBet.status} />
              <DetailRow label="User" value={selectedBet.userId ? `${selectedBet.userId.firstName} ${selectedBet.userId.lastName}` : "—"} />
              <DetailRow label="Email" value={selectedBet.userId?.email || "—"} />
              <DetailRow label="Date" value={new Date(selectedBet.createdAt).toLocaleString()} />
              {selectedBet.cashoutValue && <DetailRow label="Cashout Value" value={`GHS ${selectedBet.cashoutValue.toFixed(2)}`} />}
            </div>

            <div className="mb-4">
              <p className="text-xs font-bold text-white mb-2">Selections ({selectedBet.selections.length})</p>
              <div className="space-y-1.5">
                {selectedBet.selections.map((sel, i) => (
                  <div key={i} className="bg-[#0f1118] border border-[#2a3050] rounded-lg p-2.5 flex items-center justify-between">
                    <div>
                      <p className="text-xs text-white">{sel.match}</p>
                      <p className="text-[10px] text-[#5a6485]">{sel.selection}</p>
                    </div>
                    {sel.odds && <span className="text-xs font-bold text-[#ffc107]">{sel.odds.toFixed(2)}</span>}
                  </div>
                ))}
              </div>
            </div>

            {selectedBet.status === "pending" && (
              <div className="flex gap-2">
                <button onClick={() => handleSettle(selectedBet._id, "won")} disabled={actionLoading === selectedBet._id} className="flex-1 py-2.5 bg-[#00d46e]/10 border border-[#00d46e]/20 rounded-lg text-xs font-medium text-[#00d46e] hover:bg-[#00d46e]/20 transition-all text-center disabled:opacity-40">
                  Settle Won
                </button>
                <button onClick={() => handleSettle(selectedBet._id, "lost")} disabled={actionLoading === selectedBet._id} className="flex-1 py-2.5 bg-[#ff4757]/10 border border-[#ff4757]/20 rounded-lg text-xs font-medium text-[#ff4757] hover:bg-[#ff4757]/20 transition-all text-center disabled:opacity-40">
                  Settle Lost
                </button>
                <button onClick={() => handleSettle(selectedBet._id, "void")} disabled={actionLoading === selectedBet._id} className="flex-1 py-2.5 bg-[#5a6485]/10 border border-[#5a6485]/20 rounded-lg text-xs font-medium text-[#5a6485] hover:bg-[#5a6485]/20 transition-all text-center disabled:opacity-40">
                  Void
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pending: "bg-[#ffc107]/10 text-[#ffc107]",
    won: "bg-[#00d46e]/10 text-[#00d46e]",
    lost: "bg-[#ff4757]/10 text-[#ff4757]",
    void: "bg-[#8b95b8]/10 text-[#8b95b8]",
    cashed_out: "bg-[#3b82f6]/10 text-[#3b82f6]",
  };
  return <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${styles[status] || styles.pending}`}>{status.replace("_", " ").toUpperCase()}</span>;
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-[#2a3050]/50 last:border-0">
      <span className="text-xs text-[#5a6485]">{label}</span>
      <span className="text-xs font-medium text-white capitalize">{value}</span>
    </div>
  );
}
