"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Banknote,
  Search,
  Loader2,
  CheckCircle,
  Clock,
  XCircle,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Eye,
  Ban,
  Check,
  AlertTriangle,
  User,
} from "lucide-react";
import { api } from "@/lib/api";

type CashoutBet = {
  _id: string;
  userId?: { _id: string; firstName?: string; lastName?: string; email?: string; balance?: number };
  matchId: string;
  matchName?: string;
  homeTeam: string;
  awayTeam: string;
  selection: string;
  odds: number;
  stake: number;
  potentialWin: number;
  cashoutValue?: number;
  status: string;
  createdAt: string;
};

type BetResponse = {
  bets: CashoutBet[];
  total: number;
  page: number;
  pages: number;
};

export default function AdminCashoutsPage() {
  const [bets, setBets] = useState<CashoutBet[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("cashed_out");
  const [selectedBet, setSelectedBet] = useState<CashoutBet | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchBets = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "20" });
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (search) params.set("search", search);
      const data = await api.get<BetResponse>(`/api/admin/bets?${params}`);
      setBets(data.bets || []);
      setTotal(data.total || 0);
      setPages(data.pages || 1);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, search]);

  useEffect(() => { fetchBets(); }, [fetchBets]);

  const handleVoidCashout = async (betId: string) => {
    if (!confirm("Are you sure you want to void this cashout? The user's balance will be adjusted.")) return;
    setActionLoading(betId);
    try {
      await api.patch(`/api/admin/bets`, { betId, action: "void" });
      fetchBets();
    } catch {
      alert("Failed to void cashout");
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="px-3 sm:px-4 lg:px-8 py-4 sm:py-6 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
            <Banknote className="w-5 h-5 text-[#00d46e]" />
            Cashout Management
          </h1>
          <p className="text-[11px] text-[#5a6485]">{total} total cashouts · Monitor and control all bet cashouts</p>
        </div>
        <button onClick={fetchBets} className="p-2 text-[#8b95b8] hover:text-[#00d46e] transition-colors self-end">
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mb-5">
        <div className="bg-[#1c2033] border border-[#2a3050] rounded-xl p-3">
          <p className="text-[10px] text-[#5a6485]">Total Cashouts</p>
          <p className="text-sm font-bold text-[#00d46e]">{total}</p>
        </div>
        <div className="bg-[#1c2033] border border-[#2a3050] rounded-xl p-3">
          <p className="text-[10px] text-[#5a6485]">Cashout Value</p>
          <p className="text-sm font-bold text-[#ffc107]">
            GHS {bets.reduce((sum, b) => sum + (b.cashoutValue || 0), 0).toFixed(2)}
          </p>
        </div>
        <div className="bg-[#1c2033] border border-[#2a3050] rounded-xl p-3">
          <p className="text-[10px] text-[#5a6485]">Original Stakes</p>
          <p className="text-sm font-bold text-[#3b82f6]">
            GHS {bets.reduce((sum, b) => sum + b.stake, 0).toFixed(2)}
          </p>
        </div>
        <div className="bg-[#1c2033] border border-[#2a3050] rounded-xl p-3">
          <p className="text-[10px] text-[#5a6485]">Potential Wins Avoided</p>
          <p className="text-sm font-bold text-[#8b5cf6]">
            GHS {bets.reduce((sum, b) => sum + b.potentialWin - (b.cashoutValue || 0), 0).toFixed(2)}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5a6485]" />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search by user or match..."
            className="w-full bg-[#1c2033] border border-[#2a3050] rounded-lg pl-10 pr-4 py-2.5 text-sm text-white placeholder-[#5a6485] focus:outline-none focus:border-[#00d46e]/50"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="bg-[#1c2033] border border-[#2a3050] rounded-lg px-3 py-2 text-xs text-[#8b95b8] focus:outline-none min-w-[120px]"
        >
          <option value="cashed_out">Cashed Out</option>
          <option value="all">All Bets</option>
          <option value="pending">Pending</option>
          <option value="won">Won</option>
          <option value="lost">Lost</option>
          <option value="void">Voided</option>
        </select>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-[#00d46e]" />
        </div>
      ) : bets.length === 0 ? (
        <div className="text-center py-16">
          <Banknote className="w-8 h-8 text-[#5a6485] mx-auto mb-3" />
          <p className="text-sm text-[#8b95b8]">No cashouts found</p>
        </div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden md:block bg-[#1c2033] border border-[#2a3050] rounded-xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#2a3050]">
                  <th className="text-left text-[10px] text-[#5a6485] font-medium px-4 py-3">DATE</th>
                  <th className="text-left text-[10px] text-[#5a6485] font-medium px-4 py-3">USER</th>
                  <th className="text-left text-[10px] text-[#5a6485] font-medium px-4 py-3">MATCH</th>
                  <th className="text-left text-[10px] text-[#5a6485] font-medium px-4 py-3">SELECTION</th>
                  <th className="text-right text-[10px] text-[#5a6485] font-medium px-4 py-3">STAKE</th>
                  <th className="text-right text-[10px] text-[#5a6485] font-medium px-4 py-3">CASHOUT</th>
                  <th className="text-center text-[10px] text-[#5a6485] font-medium px-4 py-3">STATUS</th>
                  <th className="text-center text-[10px] text-[#5a6485] font-medium px-4 py-3">ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {bets.map((bet) => (
                  <tr key={bet._id} className="border-b border-[#2a3050]/50 hover:bg-[#0f1118] transition-all">
                    <td className="px-4 py-3 text-xs text-[#8b95b8]">
                      {new Date(bet.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-xs font-medium text-white">{bet.userId?.firstName || "Unknown"} {bet.userId?.lastName || ""}</p>
                      <p className="text-[10px] text-[#5a6485]">{bet.userId?.email || ""}</p>
                    </td>
                    <td className="px-4 py-3 text-xs text-white">{bet.homeTeam} vs {bet.awayTeam}</td>
                    <td className="px-4 py-3 text-xs text-[#8b95b8]">{bet.selection} @ {bet.odds}</td>
                    <td className="px-4 py-3 text-right text-xs font-medium text-white">GHS {bet.stake.toFixed(2)}</td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-xs font-bold text-[#00d46e]">GHS {(bet.cashoutValue || 0).toFixed(2)}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <StatusBadge status={bet.status} />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button onClick={() => setSelectedBet(bet)} className="p-1.5 text-[#5a6485] hover:text-white transition-colors">
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        {bet.status === "cashed_out" && (
                          <button
                            onClick={() => handleVoidCashout(bet._id)}
                            disabled={actionLoading === bet._id}
                            className="p-1.5 text-[#ff4757] hover:text-[#ff4757]/80 transition-colors disabled:opacity-40"
                          >
                            {actionLoading === bet._id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Ban className="w-3.5 h-3.5" />}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-2">
            {bets.map((bet) => (
              <div key={bet._id} className="bg-[#1c2033] border border-[#2a3050] rounded-xl p-3" onClick={() => setSelectedBet(bet)}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-[#00d46e]/10 flex items-center justify-center">
                      <Banknote className="w-4 h-4 text-[#00d46e]" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-white">{bet.homeTeam} vs {bet.awayTeam}</p>
                      <p className="text-[10px] text-[#5a6485]">{bet.userId?.firstName} · {bet.selection} @ {bet.odds}</p>
                    </div>
                  </div>
                  <StatusBadge status={bet.status} />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] text-[#5a6485]">Stake: GHS {bet.stake.toFixed(2)}</p>
                  </div>
                  <p className="text-sm font-bold text-[#00d46e]">GHS {(bet.cashoutValue || 0).toFixed(2)}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
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
        </>
      )}

      {/* Detail Modal */}
      {selectedBet && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setSelectedBet(null)}>
          <div className="bg-[#161925] border border-[#2a3050] rounded-2xl w-full max-w-md p-5" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-white">Cashout Details</h3>
              <button onClick={() => setSelectedBet(null)} className="text-[#5a6485] hover:text-white">
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-3">
              <DetailRow label="User" value={`${selectedBet.userId?.firstName || ""} ${selectedBet.userId?.lastName || ""}`} />
              <DetailRow label="Email" value={selectedBet.userId?.email || "—"} />
              <DetailRow label="Match" value={`${selectedBet.homeTeam} vs ${selectedBet.awayTeam}`} />
              <DetailRow label="Selection" value={`${selectedBet.selection} @ ${selectedBet.odds}`} />
              <DetailRow label="Stake" value={`GHS ${selectedBet.stake.toFixed(2)}`} />
              <DetailRow label="Potential Win" value={`GHS ${selectedBet.potentialWin.toFixed(2)}`} />
              <DetailRow label="Cashout Value" value={`GHS ${(selectedBet.cashoutValue || 0).toFixed(2)}`} highlight="green" />
              <DetailRow label="Savings" value={`GHS ${(selectedBet.potentialWin - (selectedBet.cashoutValue || 0)).toFixed(2)}`} highlight="blue" />
              <DetailRow label="Status" value={selectedBet.status} />
              <DetailRow label="Date" value={new Date(selectedBet.createdAt).toLocaleString()} />
            </div>
            {selectedBet.status === "cashed_out" && (
              <button
                onClick={() => { handleVoidCashout(selectedBet._id); setSelectedBet(null); }}
                className="w-full mt-4 py-2.5 bg-[#ff4757]/10 border border-[#ff4757]/20 rounded-lg text-xs font-medium text-[#ff4757] hover:bg-[#ff4757]/20 transition-all"
              >
                Void This Cashout
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, { icon: React.ReactNode; cls: string }> = {
    cashed_out: { icon: <CheckCircle className="w-2.5 h-2.5" />, cls: "text-[#00d46e] bg-[#00d46e]/10" },
    pending: { icon: <Clock className="w-2.5 h-2.5" />, cls: "text-[#ffc107] bg-[#ffc107]/10" },
    won: { icon: <CheckCircle className="w-2.5 h-2.5" />, cls: "text-[#3b82f6] bg-[#3b82f6]/10" },
    lost: { icon: <XCircle className="w-2.5 h-2.5" />, cls: "text-[#ff4757] bg-[#ff4757]/10" },
    void: { icon: <Ban className="w-2.5 h-2.5" />, cls: "text-[#8b95b8] bg-[#8b95b8]/10" },
  };
  const s = styles[status] || styles.pending;
  return (
    <span className={`inline-flex items-center gap-0.5 text-[9px] font-medium px-1.5 py-0.5 rounded ${s.cls}`}>
      {s.icon} {status.replace("_", " ")}
    </span>
  );
}

function DetailRow({ label, value, highlight }: { label: string; value: string; highlight?: "green" | "blue" }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-[#2a3050]/50 last:border-0">
      <span className="text-xs text-[#5a6485]">{label}</span>
      <span className={`text-xs font-medium ${highlight === "green" ? "text-[#00d46e]" : highlight === "blue" ? "text-[#3b82f6]" : "text-white"}`}>
        {value}
      </span>
    </div>
  );
}
