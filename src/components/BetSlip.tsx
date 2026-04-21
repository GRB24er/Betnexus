"use client";

import { useState, useSyncExternalStore } from "react";
import { X, Trash2, ChevronUp, ChevronDown, Receipt, Loader2, CheckCircle, Zap } from "lucide-react";
import { betSlipStore } from "@/store/betslip";
import { useSession, sessionStore } from "@/store/session";
import { api } from "@/lib/api";

const QUICK_STAKES = [5, 10, 20, 50, 100];

export default function BetSlip() {
  const { items, isOpen } = useSyncExternalStore(
    betSlipStore.subscribe,
    betSlipStore.getSnapshot,
    betSlipStore.getServerSnapshot
  );
  const { user } = useSession();
  const [stakes, setStakes] = useState<Record<string, string>>({});
  const [betType, setBetType] = useState<"single" | "acca">("single");
  const [placing, setPlacing] = useState(false);
  const [placed, setPlaced] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const totalOdds = items.reduce((acc, item) => acc * item.odds, 1);
  const accaStake = stakes["acca"] || "";

  const getTotalStake = () => {
    if (betType === "acca") return parseFloat(accaStake) || 0;
    return items.reduce((acc, item) => acc + (parseFloat(stakes[item.id] || "0") || 0), 0);
  };

  const getPotentialWin = () => {
    if (betType === "acca") return (parseFloat(accaStake) || 0) * totalOdds;
    return items.reduce((acc, item) => {
      const stake = parseFloat(stakes[item.id] || "0") || 0;
      return acc + stake * item.odds;
    }, 0);
  };

  const setQuickStake = (amount: number) => {
    if (betType === "acca") {
      setStakes({ ...stakes, acca: String(amount) });
    } else if (items.length === 1) {
      setStakes({ ...stakes, [items[0].id]: String(amount) });
    }
  };

  if (items.length === 0) return null;

  return (
    <>
      {/* Floating Badge (collapsed) */}
      {!isOpen && (
        <button
          onClick={() => betSlipStore.toggleOpen()}
          className="fixed bottom-20 right-4 lg:bottom-6 lg:right-6 z-50 gradient-green text-white rounded-2xl px-5 py-3.5 flex items-center gap-2.5 shadow-lg shadow-[#00d46e]/25 hover:shadow-[#00d46e]/40 hover:scale-105 transition-all min-h-[48px] glow-green"
        >
          <Receipt className="w-5 h-5" />
          <span className="font-bold text-sm">{items.length}</span>
          <div className="w-px h-4 bg-white/30" />
          <span className="text-xs font-semibold">{user?.currency || "$"}{getTotalStake().toFixed(2)}</span>
          <ChevronUp className="w-4 h-4" />
        </button>
      )}

      {/* Bet Slip Panel */}
      {isOpen && (
        <div className="fixed bottom-14 right-0 left-0 sm:bottom-16 sm:left-auto sm:right-0 lg:bottom-4 lg:right-4 lg:left-auto lg:w-[400px] w-full sm:w-full z-50 slide-up">
          <div className="bg-[#161925]/98 backdrop-blur-xl border border-[#2a3050] lg:rounded-2xl rounded-t-2xl shadow-2xl shadow-black/40 max-h-[70vh] sm:max-h-[75vh] lg:max-h-[80vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#2a3050]">
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg gradient-green flex items-center justify-center">
                  <Receipt className="w-3.5 h-3.5 text-white" />
                </div>
                <h3 className="font-bold text-white text-sm">Bet Slip</h3>
                <span className="bg-[#00d46e] text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
                  {items.length}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => betSlipStore.clearAll()}
                  className="p-2.5 text-[#5a6485] hover:text-[#ff4757] transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
                  title="Clear all"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => betSlipStore.toggleOpen()}
                  className="p-2.5 text-[#5a6485] hover:text-white transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
                >
                  <ChevronDown className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Bet Type Tabs */}
            {items.length > 1 && (
              <div className="flex gap-1 p-1.5 mx-3 mt-3 bg-[#0f1118] rounded-xl">
                <button
                  onClick={() => setBetType("single")}
                  className={`flex-1 text-xs font-bold py-2 rounded-lg transition-all ${
                    betType === "single"
                      ? "bg-[#00d46e] text-white shadow-md shadow-[#00d46e]/20"
                      : "text-[#8b95b8] hover:text-white"
                  }`}
                >
                  Singles ({items.length})
                </button>
                <button
                  onClick={() => setBetType("acca")}
                  className={`flex-1 text-xs font-bold py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                    betType === "acca"
                      ? "bg-[#ffc107] text-black shadow-md shadow-[#ffc107]/20"
                      : "text-[#8b95b8] hover:text-white"
                  }`}
                >
                  <Zap className="w-3 h-3" />
                  Accumulator
                </button>
              </div>
            )}

            {/* Bet Items */}
            <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="bg-[#1c2033] rounded-xl p-3 border border-[#2a3050] hover:border-[#2a3050]/80 transition-all"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] text-[#5a6485] mb-0.5 uppercase tracking-wider">
                        {item.market}
                      </p>
                      <p className="text-sm font-bold text-white truncate">
                        {item.selection}
                      </p>
                      <p className="text-xs text-[#8b95b8] mt-0.5 truncate">
                        {item.match}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 ml-2">
                      <span className="text-sm font-bold text-[#00d46e] bg-[#00d46e]/10 px-2 py-0.5 rounded-lg">
                        {item.odds.toFixed(2)}
                      </span>
                      <button
                        onClick={() => betSlipStore.removeBet(item.id)}
                        className="p-1.5 text-[#5a6485] hover:text-[#ff4757] hover:bg-[#ff4757]/10 rounded-lg transition-all"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  {betType === "single" && (
                    <div className="flex items-center gap-2 bg-[#0f1118] rounded-lg p-2">
                      <span className="text-[11px] text-[#5a6485] font-medium">Stake</span>
                      <input
                        type="number"
                        placeholder="0.00"
                        value={stakes[item.id] || ""}
                        onChange={(e) =>
                          setStakes({ ...stakes, [item.id]: e.target.value })
                        }
                        className="flex-1 bg-transparent text-sm text-white placeholder-[#5a6485] focus:outline-none text-right font-bold"
                      />
                      <span className="text-[11px] text-[#5a6485]">
                        Win:{" "}
                        <span className="text-[#00d46e] font-bold">
                          {user?.currency || "$"}
                          {(
                            (parseFloat(stakes[item.id] || "0") || 0) *
                            item.odds
                          ).toFixed(2)}
                        </span>
                      </span>
                    </div>
                  )}
                </div>
              ))}

              {/* Acca Stake */}
              {betType === "acca" && items.length > 1 && (
                <div className="bg-[#1c2033] rounded-xl p-3 border border-[#ffc107]/20">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-[#8b95b8] font-medium">
                      Combined Odds
                    </span>
                    <span className="text-sm font-bold text-[#ffc107] bg-[#ffc107]/10 px-2 py-0.5 rounded-lg">
                      {totalOdds.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 bg-[#0f1118] rounded-lg p-2">
                    <span className="text-[11px] text-[#5a6485] font-medium">Stake</span>
                    <input
                      type="number"
                      placeholder="0.00"
                      value={accaStake}
                      onChange={(e) =>
                        setStakes({ ...stakes, acca: e.target.value })
                      }
                      className="flex-1 bg-transparent text-sm text-white placeholder-[#5a6485] focus:outline-none text-right font-bold"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Quick Stakes */}
            <div className="px-3 py-2 border-t border-[#2a3050]/50">
              <div className="flex gap-1.5">
                {QUICK_STAKES.map((amount) => (
                  <button
                    key={amount}
                    onClick={() => setQuickStake(amount)}
                    className="flex-1 text-[11px] font-bold text-[#8b95b8] bg-[#0f1118] border border-[#2a3050] rounded-lg py-1.5 hover:text-white hover:border-[#00d46e]/30 transition-all"
                  >
                    +{amount}
                  </button>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="px-4 py-3 border-t border-[#2a3050] space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-[#8b95b8]">Total Stake</span>
                <span className="font-bold text-white">
                  {user?.currency || "$"}{getTotalStake().toFixed(2)}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-[#8b95b8]">Potential Win</span>
                <span className="font-extrabold text-[#00d46e] text-base">
                  {user?.currency || "$"}{getPotentialWin().toFixed(2)}
                </span>
              </div>
              {error && (
                <div className="bg-[#ff4757]/10 border border-[#ff4757]/30 rounded-lg px-2.5 py-1.5 text-[11px] text-[#ff4757] flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-[#ff4757] rounded-full shrink-0" />
                  {error}
                </div>
              )}
              {placed && (
                <div className="bg-[#00d46e]/10 border border-[#00d46e]/30 rounded-lg px-2.5 py-1.5 flex items-center gap-1.5 text-[11px] text-[#00d46e] font-semibold">
                  <CheckCircle className="w-3.5 h-3.5" />
                  Bet placed successfully!
                </div>
              )}
              <button
                disabled={placing || getTotalStake() <= 0}
                onClick={async () => {
                  if (!user) {
                    setError("Please sign in to place bets");
                    return;
                  }
                  setPlacing(true);
                  setError(null);
                  setPlaced(false);
                  try {
                    // Use matchId directly from the item — no more splitting on "-"
                    const selections = items.map((i) => ({
                      matchId: i.matchId,
                      match: i.match,
                      market: i.market,
                      selection: i.selection,
                      odds: i.odds,
                    }));
                    const stake = getTotalStake();
                    const type = betType === "acca" && items.length > 1 ? "accumulator" : "single";
                    const res = await api.post<{ balance: number }>(
                      "/api/bets/place",
                      { selections, stake, type }
                    );
                    sessionStore.setBalance(res.balance);
                    setPlaced(true);
                    setTimeout(() => {
                      betSlipStore.clearAll();
                      setStakes({});
                      setPlaced(false);
                    }, 2000);
                  } catch (err) {
                    setError(err instanceof Error ? err.message : "Failed to place bet");
                  } finally {
                    setPlacing(false);
                  }
                }}
                className="w-full gradient-green text-white font-bold text-sm py-3.5 rounded-xl hover:opacity-90 transition-all mt-1 disabled:opacity-40 flex items-center justify-center gap-2 glow-green"
              >
                {placing && <Loader2 className="w-4 h-4 animate-spin" />}
                {placing ? "Placing Bet..." : `Place Bet — ${user?.currency || "$"}${getTotalStake().toFixed(2)}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
