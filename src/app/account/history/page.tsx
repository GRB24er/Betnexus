"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useSession } from "@/store/session";
import { api } from "@/lib/api";

const filters = ["All", "Won", "Lost", "Pending", "Cashed_out"];

type HistoryBet = {
  _id: string;
  reference: string;
  type: string;
  status: string;
  selections: { match: string; selection: string; odds: number; league?: string; market?: string }[];
  stake: number;
  totalOdds: number;
  potentialWin: number;
  payout: number;
  createdAt: string;
};

export default function BetHistoryPage() {
  const router = useRouter();
  const { user, loading: sessionLoading } = useSession();
  const [activeFilter, setActiveFilter] = useState("All");
  const [bets, setBets] = useState<HistoryBet[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!sessionLoading && !user) {
      router.push("/login");
    }
  }, [sessionLoading, user, router]);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    api
      .get<{ bets: HistoryBet[] }>("/api/bets/history?limit=50")
      .then((res) => setBets(res.bets))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user]);

  const filtered =
    activeFilter === "All"
      ? bets
      : bets.filter((b) => b.status === activeFilter.toLowerCase());

  const totalStaked = bets.reduce((a, b) => a + b.stake, 0);
  const totalWon = bets
    .filter((b) => b.status === "won" || b.status === "cashed_out")
    .reduce((a, b) => a + b.payout, 0);

  const cur = user?.currency || "GHS";

  return (
    <div className="min-h-screen">
      <div className="bg-[#161925] border-b border-[#2a3050]">
        <div className="px-4 lg:px-6 py-4">
          <div className="flex items-center gap-3 mb-4">
            <Link href="/account" className="p-2 text-[#5a6485] hover:text-white transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-lg font-bold text-white">Bet History</h1>
          </div>

          {/* Summary */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="bg-[#0f1118] border border-[#2a3050] rounded-lg px-3 py-2 text-center">
              <p className="text-[10px] text-[#5a6485]">Total Staked</p>
              <p className="text-sm font-bold text-white">
                {cur} {totalStaked.toFixed(2)}
              </p>
            </div>
            <div className="bg-[#0f1118] border border-[#2a3050] rounded-lg px-3 py-2 text-center">
              <p className="text-[10px] text-[#5a6485]">Total Won</p>
              <p className="text-sm font-bold text-[#00d46e]">
                {cur} {totalWon.toFixed(2)}
              </p>
            </div>
            <div className="bg-[#0f1118] border border-[#2a3050] rounded-lg px-3 py-2 text-center">
              <p className="text-[10px] text-[#5a6485]">Profit</p>
              <p
                className={`text-sm font-bold ${
                  totalWon - totalStaked >= 0 ? "text-[#00d46e]" : "text-[#ff4757]"
                }`}
              >
                {totalWon - totalStaked >= 0 ? "+" : ""}
                {cur} {(totalWon - totalStaked).toFixed(2)}
              </p>
            </div>
          </div>

          {/* Filters */}
          <div className="flex gap-2 overflow-x-auto scrollbar-hide">
            {filters.map((f) => (
              <button
                key={f}
                onClick={() => setActiveFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                  activeFilter === f
                    ? "bg-[#00d46e]/10 text-[#00d46e] border border-[#00d46e]/30"
                    : "bg-[#1c2033] text-[#8b95b8] border border-[#2a3050]"
                }`}
              >
                {f === "Cashed_out" ? "Cashout" : f}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="px-4 lg:px-6 py-4 max-w-3xl">
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-[#00d46e]" />
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((bet) => {
              const sel = bet.selections[0];
              const dateStr = new Date(bet.createdAt).toLocaleString();
              return (
                <div
                  key={bet._id}
                  className="bg-[#1c2033] border border-[#2a3050] rounded-xl px-4 py-3"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">
                        {bet.type === "accumulator"
                          ? `Accumulator (${bet.selections.length} legs)`
                          : sel?.match}
                      </p>
                      <p className="text-[11px] text-[#5a6485]">
                        {sel?.league || bet.reference}
                      </p>
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded shrink-0 ml-2 ${
                        bet.status === "won" || bet.status === "cashed_out"
                          ? "bg-[#00d46e]/20 text-[#00d46e]"
                          : bet.status === "lost"
                          ? "bg-[#ff4757]/20 text-[#ff4757]"
                          : "bg-[#ffc107]/20 text-[#ffc107]"
                      }`}
                    >
                      {bet.status.toUpperCase().replace("_", " ")}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-[#8b95b8]">
                        {sel?.selection}{" "}
                        {bet.selections.length > 1 &&
                          `+${bet.selections.length - 1} more`}
                      </p>
                      <p className="text-[10px] text-[#5a6485] mt-0.5">
                        {dateStr}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-[#5a6485]">
                        Stake: {cur} {bet.stake.toFixed(2)} @{" "}
                        {bet.totalOdds.toFixed(2)}
                      </p>
                      {(bet.status === "won" || bet.status === "cashed_out") && (
                        <p className="text-sm font-bold text-[#00d46e]">
                          +{cur} {bet.payout.toFixed(2)}
                        </p>
                      )}
                      {bet.status === "lost" && (
                        <p className="text-sm font-bold text-[#ff4757]">
                          -{cur} {bet.stake.toFixed(2)}
                        </p>
                      )}
                      {bet.status === "pending" && (
                        <p className="text-sm font-bold text-[#ffc107]">
                          Potential: {cur} {bet.potentialWin.toFixed(2)}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div className="text-center py-16">
            <p className="text-sm text-[#5a6485]">No bets found for this filter</p>
          </div>
        )}
      </div>
    </div>
  );
}
