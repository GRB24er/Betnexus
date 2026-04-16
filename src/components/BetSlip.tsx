"use client";

import { useState, useSyncExternalStore } from "react";
import { X, Trash2, ChevronUp, ChevronDown, Receipt } from "lucide-react";
import { betSlipStore } from "@/store/betslip";

export default function BetSlip() {
  const { items, isOpen } = useSyncExternalStore(
    betSlipStore.subscribe,
    betSlipStore.getSnapshot,
    betSlipStore.getSnapshot
  );
  const [stakes, setStakes] = useState<Record<string, string>>({});
  const [betType, setBetType] = useState<"single" | "acca">("single");

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

  if (items.length === 0) return null;

  return (
    <>
      {/* Floating Badge (collapsed) */}
      {!isOpen && (
        <button
          onClick={() => betSlipStore.toggleOpen()}
          className="fixed bottom-20 right-4 lg:bottom-6 lg:right-6 z-50 gradient-green text-white rounded-full px-4 py-3 flex items-center gap-2 shadow-lg shadow-[#00d46e]/20 hover:shadow-[#00d46e]/40 transition-all"
        >
          <Receipt className="w-5 h-5" />
          <span className="font-bold">{items.length}</span>
          <ChevronUp className="w-4 h-4" />
        </button>
      )}

      {/* Bet Slip Panel */}
      {isOpen && (
        <div className="fixed bottom-0 right-0 lg:bottom-4 lg:right-4 lg:w-[380px] w-full z-50 slide-up">
          <div className="bg-[#161925] border border-[#2a3050] lg:rounded-xl shadow-2xl max-h-[80vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#2a3050]">
              <div className="flex items-center gap-3">
                <h3 className="font-bold text-white text-sm">Bet Slip</h3>
                <span className="bg-[#00d46e] text-white text-[11px] font-bold px-2 py-0.5 rounded-full">
                  {items.length}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => betSlipStore.clearAll()}
                  className="p-1.5 text-[#5a6485] hover:text-[#ff4757] transition-colors"
                  title="Clear all"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => betSlipStore.toggleOpen()}
                  className="p-1.5 text-[#5a6485] hover:text-white transition-colors"
                >
                  <ChevronDown className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Bet Type Tabs */}
            {items.length > 1 && (
              <div className="flex gap-1 p-2 mx-3 mt-2 bg-[#0f1118] rounded-lg">
                <button
                  onClick={() => setBetType("single")}
                  className={`flex-1 text-xs font-semibold py-1.5 rounded-md transition-all ${
                    betType === "single"
                      ? "bg-[#00d46e] text-white"
                      : "text-[#8b95b8] hover:text-white"
                  }`}
                >
                  Singles ({items.length})
                </button>
                <button
                  onClick={() => setBetType("acca")}
                  className={`flex-1 text-xs font-semibold py-1.5 rounded-md transition-all ${
                    betType === "acca"
                      ? "bg-[#00d46e] text-white"
                      : "text-[#8b95b8] hover:text-white"
                  }`}
                >
                  Accumulator
                </button>
              </div>
            )}

            {/* Bet Items */}
            <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="bg-[#1c2033] rounded-lg p-3 border border-[#2a3050]"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <p className="text-[11px] text-[#5a6485] mb-0.5">
                        {item.market}
                      </p>
                      <p className="text-sm font-semibold text-white">
                        {item.selection}
                      </p>
                      <p className="text-xs text-[#8b95b8] mt-0.5">
                        {item.match}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-[#00d46e]">
                        {item.odds.toFixed(2)}
                      </span>
                      <button
                        onClick={() => betSlipStore.removeBet(item.id)}
                        className="p-1 text-[#5a6485] hover:text-[#ff4757] transition-colors"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  {betType === "single" && (
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-[#5a6485]">$</span>
                      <input
                        type="number"
                        placeholder="0.00"
                        value={stakes[item.id] || ""}
                        onChange={(e) =>
                          setStakes({ ...stakes, [item.id]: e.target.value })
                        }
                        className="flex-1 bg-[#0f1118] border border-[#2a3050] rounded px-2 py-1 text-sm text-white placeholder-[#5a6485] focus:outline-none focus:border-[#00d46e]/50"
                      />
                      <span className="text-[11px] text-[#5a6485]">
                        Win:{" "}
                        <span className="text-[#00d46e] font-semibold">
                          $
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
                <div className="bg-[#1c2033] rounded-lg p-3 border border-[#2a3050]">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-[#8b95b8]">
                      Total Odds
                    </span>
                    <span className="text-sm font-bold text-[#ffc107]">
                      {totalOdds.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-[#5a6485]">$</span>
                    <input
                      type="number"
                      placeholder="0.00"
                      value={accaStake}
                      onChange={(e) =>
                        setStakes({ ...stakes, acca: e.target.value })
                      }
                      className="flex-1 bg-[#0f1118] border border-[#2a3050] rounded px-2 py-1 text-sm text-white placeholder-[#5a6485] focus:outline-none focus:border-[#00d46e]/50"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-4 py-3 border-t border-[#2a3050] space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-[#8b95b8]">Total Stake</span>
                <span className="font-semibold text-white">
                  ${getTotalStake().toFixed(2)}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-[#8b95b8]">Potential Win</span>
                <span className="font-bold text-[#00d46e]">
                  ${getPotentialWin().toFixed(2)}
                </span>
              </div>
              <button className="w-full gradient-green text-white font-bold text-sm py-3 rounded-lg hover:opacity-90 transition-opacity mt-1">
                Place Bet — ${getTotalStake().toFixed(2)}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
