"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { api } from "@/lib/api";

type BetSelection = {
  match: string;
  market: string;
  selection: string;
  odds: number;
  result?: string;
};

type AgentBet = {
  _id: string;
  reference: string;
  type: string;
  selections: BetSelection[];
  stake: number;
  totalOdds: number;
  potentialWin: number;
  payout?: number;
  status: string;
  currency: string;
  createdAt: string;
  userId: { firstName: string; lastName: string; email: string } | null;
};

const STATUS_FILTERS = [
  { value: "", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "won", label: "Won" },
  { value: "lost", label: "Lost" },
  { value: "cashed_out", label: "Cashed Out" },
  { value: "void", label: "Void" },
];

export default function SubAdminBets() {
  const [bets, setBets] = useState<AgentBet[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const params = new URLSearchParams({ page: String(page), limit: "25" });
    if (status) params.set("status", status);
    api
      .get<{ bets: AgentBet[]; total: number; pages: number }>(
        `/api/subadmin/bets?${params}`
      )
      .then((r) => {
        if (cancelled) return;
        setBets(r.bets);
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
  }, [page, status]);

  return (
    <div className="px-4 lg:px-8 py-6">
      <div className="mb-4">
        <h1 className="text-xl font-bold text-white">My Users&apos; Bets</h1>
        <p className="text-xs text-[#5a6485]">{total} bets · read-only</p>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.value || "all"}
            onClick={() => {
              setPage(1);
              setStatus(f.value);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
              status === f.value
                ? "bg-[#00d46e]/15 text-[#00d46e] border border-[#00d46e]/30"
                : "bg-[#1c2033] text-[#8b95b8] border border-[#2a3050]"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-[#00d46e]" />
        </div>
      ) : bets.length === 0 ? (
        <p className="text-sm text-[#5a6485] text-center py-16">No bets to show.</p>
      ) : (
        <div className="space-y-3">
          {bets.map((b) => (
            <div
              key={b._id}
              className="bg-[#1c2033] border border-[#2a3050] rounded-xl p-4"
            >
              <div className="flex items-start justify-between mb-2 flex-wrap gap-2">
                <div>
                  <p className="text-sm font-medium text-white">
                    {b.userId
                      ? `${b.userId.firstName} ${b.userId.lastName}`
                      : "Unknown user"}
                  </p>
                  <p className="text-[11px] text-[#5a6485]">
                    {b.userId?.email} · Ref {b.reference}
                  </p>
                </div>
                <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded ${statusClasses(b.status)}`}>
                  {b.status}
                </span>
              </div>
              <div className="space-y-1 mb-3">
                {b.selections.map((s, i) => (
                  <p key={i} className="text-xs text-[#8b95b8]">
                    <span className="text-white">{s.match}</span> — {s.market}: {s.selection} @ {s.odds.toFixed(2)}
                  </p>
                ))}
              </div>
              <div className="flex flex-wrap gap-4 text-[11px] text-[#5a6485]">
                <span>Stake: <span className="text-white">{b.currency} {b.stake.toFixed(2)}</span></span>
                <span>Odds: <span className="text-white">{b.totalOdds.toFixed(2)}</span></span>
                <span>Potential: <span className="text-white">{b.currency} {b.potentialWin.toFixed(2)}</span></span>
                {b.payout != null && (
                  <span>
                    Payout: <span className="text-white">{b.currency} {b.payout.toFixed(2)}</span>
                  </span>
                )}
                <span className="ml-auto">{new Date(b.createdAt).toLocaleString()}</span>
              </div>
            </div>
          ))}
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
          <span>Page {page} of {pages}</span>
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

function statusClasses(s: string): string {
  switch (s) {
    case "won":
    case "cashed_out":
      return "bg-[#00d46e]/15 text-[#00d46e]";
    case "lost":
      return "bg-[#ff4757]/15 text-[#ff4757]";
    case "void":
      return "bg-[#8b95b8]/15 text-[#8b95b8]";
    default:
      return "bg-[#3b82f6]/15 text-[#3b82f6]";
  }
}
