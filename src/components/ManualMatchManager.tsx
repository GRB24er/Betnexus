"use client";

import { useEffect, useState } from "react";
import { Loader2, Plus, X, Trash2, Check, AlertTriangle } from "lucide-react";
import { api } from "@/lib/api";

/**
 * Self-contained UI for managing manual (staff-created) matches.
 * Used by both /admin/manual-matches and /subadmin/manual-matches.
 *
 * Both admin and subadmin share these endpoints (gated by requireStaff).
 */

type Outcome = { label: string; odds: number; point?: number; result?: string };
type Market = { key: string; name: string; outcomes: Outcome[] };

type ManualMatch = {
  _id: string;
  sport: string;
  league: string;
  homeTeam: string;
  awayTeam: string;
  startTime: string;
  isLive: boolean;
  minute?: number;
  status: "scheduled" | "live" | "completed" | "cancelled";
  homeScore?: number;
  awayScore?: number;
  markets: Market[];
  createdBy?: { firstName: string; lastName: string; email: string; role: string };
  settledBy?: { firstName: string; lastName: string; email: string };
  createdAt: string;
  settledAt?: string;
  notes?: string;
};

const STATUS_FILTERS = [
  { value: "", label: "All" },
  { value: "scheduled", label: "Scheduled" },
  { value: "live", label: "Live" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

const SPORT_OPTIONS = [
  "football",
  "basketball",
  "tennis",
  "cricket",
  "baseball",
  "ice-hockey",
  "mma",
  "rugby",
];

export default function ManualMatchManager() {
  const [matches, setMatches] = useState<ManualMatch[]>([]);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [settleTarget, setSettleTarget] = useState<ManualMatch | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const params = new URLSearchParams({ limit: "50" });
    if (statusFilter) params.set("status", statusFilter);
    api
      .get<{ matches: ManualMatch[]; total: number }>(
        `/api/admin/manual-matches?${params}`
      )
      .then((r) => {
        if (cancelled) return;
        setMatches(r.matches);
        setTotal(r.total);
        setLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [statusFilter, reloadKey]);

  const refresh = () => setReloadKey((k) => k + 1);

  const cancelMatch = async (m: ManualMatch) => {
    if (
      !confirm(
        `Cancel "${m.homeTeam} vs ${m.awayTeam}"? All pending bets on it will be voided and stakes refunded.`
      )
    )
      return;
    try {
      await api.post(`/api/admin/manual-matches/${m._id}/cancel`, {});
      refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Cancel failed");
    }
  };

  const deleteMatch = async (m: ManualMatch) => {
    if (!confirm(`Delete "${m.homeTeam} vs ${m.awayTeam}"? Only allowed if no bets exist.`)) return;
    try {
      await api.delete(`/api/admin/manual-matches/${m._id}`);
      refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Delete failed");
    }
  };

  return (
    <div className="px-4 lg:px-8 py-6">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-white">Manual Matches</h1>
          <p className="text-xs text-[#5a6485]">
            {total} matches · add events the odds API doesn&apos;t cover, then settle them when results come in.
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="inline-flex items-center gap-2 bg-[#00d46e] hover:bg-[#00b85c] text-black font-semibold text-xs px-4 py-2 rounded-lg transition"
        >
          <Plus className="w-4 h-4" /> Add Match
        </button>
      </div>

      <div className="flex gap-2 mb-4 flex-wrap">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.value || "all"}
            onClick={() => setStatusFilter(f.value)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
              statusFilter === f.value
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
      ) : matches.length === 0 ? (
        <div className="bg-[#1c2033] border border-[#2a3050] rounded-xl p-8 text-center">
          <p className="text-sm text-[#8b95b8]">
            No manual matches yet. Click <strong>Add Match</strong> to create one.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {matches.map((m) => (
            <MatchRow
              key={m._id}
              match={m}
              onSettle={() => setSettleTarget(m)}
              onCancel={() => cancelMatch(m)}
              onDelete={() => deleteMatch(m)}
            />
          ))}
        </div>
      )}

      {showCreate && (
        <CreateMatchModal
          onClose={() => setShowCreate(false)}
          onCreated={() => {
            setShowCreate(false);
            refresh();
          }}
        />
      )}

      {settleTarget && (
        <SettleMatchModal
          match={settleTarget}
          onClose={() => setSettleTarget(null)}
          onSettled={() => {
            setSettleTarget(null);
            refresh();
          }}
        />
      )}
    </div>
  );
}

function MatchRow({
  match,
  onSettle,
  onCancel,
  onDelete,
}: {
  match: ManualMatch;
  onSettle: () => void;
  onCancel: () => void;
  onDelete: () => void;
}) {
  const settled = match.status === "completed" || match.status === "cancelled";
  return (
    <div className="bg-[#1c2033] border border-[#2a3050] rounded-xl p-4">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-sm font-bold text-white">
              {match.homeTeam} vs {match.awayTeam}
            </h3>
            <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${statusClasses(match.status)}`}>
              {match.status}
            </span>
            {match.homeScore != null && match.awayScore != null && (
              <span className="text-xs text-[#8b95b8]">
                {match.homeScore} - {match.awayScore}
              </span>
            )}
          </div>
          <p className="text-[11px] text-[#5a6485] mt-1">
            {match.sport} · {match.league} ·{" "}
            {new Date(match.startTime).toLocaleString()}
          </p>
          {match.createdBy && (
            <p className="text-[10px] text-[#5a6485] mt-0.5">
              Added by {match.createdBy.firstName} {match.createdBy.lastName} ({match.createdBy.role})
              {match.settledBy &&
                ` · Settled by ${match.settledBy.firstName} ${match.settledBy.lastName}`}
            </p>
          )}
        </div>
        <div className="flex gap-2 flex-wrap">
          {!settled && (
            <>
              <button
                onClick={onSettle}
                className="text-[11px] px-3 py-1.5 bg-[#00d46e]/15 text-[#00d46e] rounded-md hover:bg-[#00d46e]/25 font-semibold transition"
              >
                Settle
              </button>
              <button
                onClick={onCancel}
                className="text-[11px] px-3 py-1.5 bg-[#ff4757]/15 text-[#ff4757] rounded-md hover:bg-[#ff4757]/25 font-semibold transition"
              >
                Cancel
              </button>
              <button
                onClick={onDelete}
                title="Hard-delete (only if no bets exist)"
                className="text-[11px] px-2 py-1.5 bg-[#5a6485]/15 text-[#8b95b8] rounded-md hover:bg-[#5a6485]/25 transition"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-3">
        {match.markets.map((mk) => (
          <div key={mk.key} className="bg-[#0f1118] border border-[#2a3050] rounded-lg p-2">
            <p className="text-[10px] uppercase text-[#5a6485] tracking-wide">{mk.name}</p>
            <div className="flex flex-wrap gap-1.5 mt-1.5">
              {mk.outcomes.map((o) => (
                <span
                  key={o.label}
                  className={`text-[11px] px-2 py-0.5 rounded border ${
                    o.result === "won"
                      ? "border-[#00d46e]/40 text-[#00d46e] bg-[#00d46e]/10"
                      : o.result === "lost"
                      ? "border-[#ff4757]/40 text-[#ff4757] bg-[#ff4757]/10"
                      : o.result === "void"
                      ? "border-[#8b95b8]/40 text-[#8b95b8] bg-[#5a6485]/10"
                      : "border-[#2a3050] text-[#8b95b8]"
                  }`}
                >
                  {o.label} <span className="text-white">{o.odds.toFixed(2)}</span>
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function statusClasses(status: string): string {
  switch (status) {
    case "live":
      return "bg-[#ff4757]/15 text-[#ff4757]";
    case "completed":
      return "bg-[#00d46e]/15 text-[#00d46e]";
    case "cancelled":
      return "bg-[#5a6485]/20 text-[#8b95b8]";
    default:
      return "bg-[#3b82f6]/15 text-[#3b82f6]";
  }
}

/* ──────────────────────────── Create modal ─────────────────────────────── */

function CreateMatchModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: () => void;
}) {
  const [sport, setSport] = useState("football");
  const [league, setLeague] = useState("");
  const [homeTeam, setHomeTeam] = useState("");
  const [awayTeam, setAwayTeam] = useState("");
  const [startTime, setStartTime] = useState(() =>
    new Date(Date.now() + 60 * 60 * 1000).toISOString().slice(0, 16)
  );
  const [isLive, setIsLive] = useState(false);
  const [notes, setNotes] = useState("");
  const [markets, setMarkets] = useState<Market[]>(() => [
    {
      key: "h2h",
      name: "Match Result",
      outcomes: [
        { label: "", odds: 2 },
        { label: "Draw", odds: 3.2 },
        { label: "", odds: 2.5 },
      ],
    },
  ]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-fill home/away outcome labels when teams change.
  useEffect(() => {
    setMarkets((prev) =>
      prev.map((m) =>
        m.key === "h2h"
          ? {
              ...m,
              outcomes: m.outcomes.map((o, i) =>
                i === 0
                  ? { ...o, label: homeTeam || o.label }
                  : i === 2
                  ? { ...o, label: awayTeam || o.label }
                  : o
              ),
            }
          : m
      )
    );
  }, [homeTeam, awayTeam]);

  const updateMarket = (idx: number, patch: Partial<Market>) => {
    setMarkets((prev) => prev.map((m, i) => (i === idx ? { ...m, ...patch } : m)));
  };
  const updateOutcome = (mIdx: number, oIdx: number, patch: Partial<Outcome>) => {
    setMarkets((prev) =>
      prev.map((m, i) =>
        i === mIdx
          ? {
              ...m,
              outcomes: m.outcomes.map((o, j) => (j === oIdx ? { ...o, ...patch } : o)),
            }
          : m
      )
    );
  };
  const addMarket = () =>
    setMarkets((prev) => [
      ...prev,
      {
        key: `market_${prev.length + 1}`,
        name: "",
        outcomes: [
          { label: "", odds: 2 },
          { label: "", odds: 2 },
        ],
      },
    ]);
  const removeMarket = (idx: number) =>
    setMarkets((prev) => prev.filter((_, i) => i !== idx));
  const addOutcome = (mIdx: number) =>
    setMarkets((prev) =>
      prev.map((m, i) =>
        i === mIdx ? { ...m, outcomes: [...m.outcomes, { label: "", odds: 2 }] } : m
      )
    );
  const removeOutcome = (mIdx: number, oIdx: number) =>
    setMarkets((prev) =>
      prev.map((m, i) =>
        i === mIdx ? { ...m, outcomes: m.outcomes.filter((_, j) => j !== oIdx) } : m
      )
    );

  const submit = async () => {
    setError(null);
    if (!homeTeam.trim() || !awayTeam.trim() || !league.trim()) {
      setError("Home team, away team, and league are required");
      return;
    }
    for (const m of markets) {
      if (!m.name.trim() || !m.key.trim()) {
        setError(`Each market needs a name and key`);
        return;
      }
      if (m.outcomes.length < 2) {
        setError(`Market "${m.name}" needs at least 2 outcomes`);
        return;
      }
      for (const o of m.outcomes) {
        if (!o.label.trim() || !(o.odds > 1)) {
          setError(`Outcomes need a label and odds > 1`);
          return;
        }
      }
    }

    setSubmitting(true);
    try {
      await api.post("/api/admin/manual-matches", {
        sport,
        league,
        homeTeam,
        awayTeam,
        startTime: new Date(startTime).toISOString(),
        isLive,
        markets,
        notes: notes.trim() || undefined,
      });
      onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Create failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal title="Add Match" onClose={onClose} maxWidth="max-w-2xl">
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Sport">
            <select
              value={sport}
              onChange={(e) => setSport(e.target.value)}
              className="input"
            >
              {SPORT_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </Field>
          <Field label="League / Competition">
            <input
              value={league}
              onChange={(e) => setLeague(e.target.value)}
              className="input"
              placeholder="Premier League"
            />
          </Field>
          <Field label="Home Team">
            <input
              value={homeTeam}
              onChange={(e) => setHomeTeam(e.target.value)}
              className="input"
            />
          </Field>
          <Field label="Away Team">
            <input
              value={awayTeam}
              onChange={(e) => setAwayTeam(e.target.value)}
              className="input"
            />
          </Field>
          <Field label="Kick-off">
            <input
              type="datetime-local"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="input"
            />
          </Field>
          <Field label="Status">
            <label className="flex items-center gap-2 text-sm text-white pt-2">
              <input
                type="checkbox"
                checked={isLive}
                onChange={(e) => setIsLive(e.target.checked)}
                className="accent-[#00d46e]"
              />
              Mark as live
            </label>
          </Field>
        </div>

        <div className="border-t border-[#2a3050] pt-3">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-semibold text-white uppercase">Markets</h3>
            <button
              onClick={addMarket}
              className="text-[11px] text-[#3b82f6] hover:underline flex items-center gap-1"
            >
              <Plus className="w-3 h-3" /> Add market
            </button>
          </div>

          {markets.map((mk, mIdx) => (
            <div
              key={mIdx}
              className="bg-[#0f1118] border border-[#2a3050] rounded-lg p-3 mb-2"
            >
              <div className="grid grid-cols-2 gap-2 mb-2">
                <Field label="Market name">
                  <input
                    value={mk.name}
                    onChange={(e) => updateMarket(mIdx, { name: e.target.value })}
                    className="input text-xs"
                    placeholder="Match Result"
                  />
                </Field>
                <Field label="Key (unique)">
                  <input
                    value={mk.key}
                    onChange={(e) => updateMarket(mIdx, { key: e.target.value })}
                    className="input text-xs"
                    placeholder="h2h"
                  />
                </Field>
              </div>

              {mk.outcomes.map((o, oIdx) => (
                <div key={oIdx} className="flex items-center gap-2 mb-1.5">
                  <input
                    value={o.label}
                    onChange={(e) => updateOutcome(mIdx, oIdx, { label: e.target.value })}
                    className="input text-xs flex-1"
                    placeholder="Outcome label"
                  />
                  <input
                    type="number"
                    step="0.01"
                    value={o.odds}
                    onChange={(e) =>
                      updateOutcome(mIdx, oIdx, { odds: parseFloat(e.target.value) || 0 })
                    }
                    className="input text-xs w-24"
                    placeholder="Odds"
                  />
                  {mk.outcomes.length > 2 && (
                    <button
                      onClick={() => removeOutcome(mIdx, oIdx)}
                      className="text-[#ff4757]"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              ))}
              <div className="flex justify-between mt-1.5">
                <button
                  onClick={() => addOutcome(mIdx)}
                  className="text-[11px] text-[#3b82f6] hover:underline"
                >
                  + outcome
                </button>
                {markets.length > 1 && (
                  <button
                    onClick={() => removeMarket(mIdx)}
                    className="text-[11px] text-[#ff4757] hover:underline"
                  >
                    Remove market
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        <Field label="Notes (optional)">
          <input
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="input"
            placeholder="Source URL, reminders, etc."
          />
        </Field>

        {error && (
          <p className="text-xs text-[#ff4757] flex items-center gap-2">
            <AlertTriangle className="w-3.5 h-3.5" /> {error}
          </p>
        )}

        <div className="flex gap-2 pt-2">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 text-xs text-[#8b95b8] bg-[#0f1118] border border-[#2a3050] rounded-lg hover:text-white"
          >
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={submitting}
            className="flex-1 py-2.5 text-xs font-bold text-black bg-[#00d46e] rounded-lg hover:bg-[#00b85c] disabled:opacity-50 inline-flex items-center justify-center gap-2"
          >
            {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            Create Match
          </button>
        </div>
      </div>
    </Modal>
  );
}

/* ──────────────────────────── Settle modal ─────────────────────────────── */

function SettleMatchModal({
  match,
  onClose,
  onSettled,
}: {
  match: ManualMatch;
  onClose: () => void;
  onSettled: () => void;
}) {
  const [homeScore, setHomeScore] = useState<number | "">(
    match.homeScore ?? ""
  );
  const [awayScore, setAwayScore] = useState<number | "">(
    match.awayScore ?? ""
  );
  // results[market.key][outcome.label] = "won" | "lost" | "void"
  const [results, setResults] = useState<Record<string, Record<string, string>>>(() => {
    const init: Record<string, Record<string, string>> = {};
    for (const mk of match.markets) {
      init[mk.key] = {};
      for (const o of mk.outcomes) {
        init[mk.key][o.label] =
          o.result && o.result !== "pending" ? o.result : "lost";
      }
    }
    return init;
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<{
    betsTouched: number;
    betsWon: number;
    betsLost: number;
    betsVoided: number;
    totalPaidOut: number;
  } | null>(null);

  const setOutcomeResult = (marketKey: string, outcome: string, value: string) => {
    setResults((prev) => {
      const next = { ...prev, [marketKey]: { ...prev[marketKey] } };
      if (value === "won") {
        // Enforce single-winner per market: flip every other outcome to "lost".
        for (const k of Object.keys(next[marketKey])) {
          next[marketKey][k] = k === outcome ? "won" : "lost";
        }
      } else {
        next[marketKey][outcome] = value;
      }
      return next;
    });
  };

  const submit = async () => {
    setError(null);
    setSubmitting(true);
    try {
      const res = await api.post<{
        summary: {
          betsTouched: number;
          betsWon: number;
          betsLost: number;
          betsVoided: number;
          totalPaidOut: number;
        };
      }>(`/api/admin/manual-matches/${match._id}/settle`, {
        homeScore: typeof homeScore === "number" ? homeScore : undefined,
        awayScore: typeof awayScore === "number" ? awayScore : undefined,
        results,
      });
      setSummary(res.summary);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Settle failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal title={`Settle: ${match.homeTeam} vs ${match.awayTeam}`} onClose={onClose} maxWidth="max-w-2xl">
      {summary ? (
        <div className="space-y-3">
          <div className="bg-[#00d46e]/10 border border-[#00d46e]/30 rounded-lg p-4">
            <h3 className="text-sm font-bold text-[#00d46e] flex items-center gap-2">
              <Check className="w-4 h-4" /> Settled
            </h3>
            <p className="text-xs text-[#8b95b8] mt-2">
              Bets touched: <strong className="text-white">{summary.betsTouched}</strong> · Won: <strong className="text-[#00d46e]">{summary.betsWon}</strong> · Lost: <strong className="text-[#ff4757]">{summary.betsLost}</strong> · Voided: <strong className="text-[#8b95b8]">{summary.betsVoided}</strong>
            </p>
            <p className="text-xs text-[#8b95b8] mt-1">
              Total paid out: <strong className="text-white">{summary.totalPaidOut.toFixed(2)}</strong>
            </p>
          </div>
          <button
            onClick={onSettled}
            className="w-full py-2.5 text-xs font-bold text-black bg-[#00d46e] rounded-lg hover:bg-[#00b85c]"
          >
            Done
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Home Score">
              <input
                type="number"
                min={0}
                value={homeScore}
                onChange={(e) =>
                  setHomeScore(e.target.value === "" ? "" : parseInt(e.target.value))
                }
                className="input"
              />
            </Field>
            <Field label="Away Score">
              <input
                type="number"
                min={0}
                value={awayScore}
                onChange={(e) =>
                  setAwayScore(e.target.value === "" ? "" : parseInt(e.target.value))
                }
                className="input"
              />
            </Field>
          </div>

          {match.markets.map((mk) => (
            <div
              key={mk.key}
              className="bg-[#0f1118] border border-[#2a3050] rounded-lg p-3"
            >
              <p className="text-[10px] uppercase tracking-wide text-[#5a6485] mb-2">
                {mk.name}
              </p>
              {mk.outcomes.map((o) => (
                <div key={o.label} className="flex items-center justify-between mb-1.5">
                  <span className="text-xs text-white">
                    {o.label} <span className="text-[#5a6485]">@ {o.odds.toFixed(2)}</span>
                  </span>
                  <div className="flex gap-1">
                    {(["won", "lost", "void"] as const).map((r) => (
                      <button
                        key={r}
                        onClick={() => setOutcomeResult(mk.key, o.label, r)}
                        className={`text-[10px] uppercase font-bold px-2 py-1 rounded ${
                          results[mk.key]?.[o.label] === r
                            ? r === "won"
                              ? "bg-[#00d46e] text-black"
                              : r === "lost"
                              ? "bg-[#ff4757] text-white"
                              : "bg-[#8b95b8] text-black"
                            : "bg-[#1c2033] text-[#8b95b8] hover:bg-[#2a3050]"
                        }`}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ))}

          <p className="text-[10px] text-[#5a6485]">
            Pick exactly one <strong>won</strong> per market (the others auto-flip to <strong>lost</strong>).
            Use <strong>void</strong> for outcomes you want to refund.
          </p>

          {error && (
            <p className="text-xs text-[#ff4757] flex items-center gap-2">
              <AlertTriangle className="w-3.5 h-3.5" /> {error}
            </p>
          )}

          <div className="flex gap-2 pt-2">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 text-xs text-[#8b95b8] bg-[#0f1118] border border-[#2a3050] rounded-lg hover:text-white"
            >
              Cancel
            </button>
            <button
              onClick={submit}
              disabled={submitting}
              className="flex-1 py-2.5 text-xs font-bold text-black bg-[#00d46e] rounded-lg hover:bg-[#00b85c] disabled:opacity-50 inline-flex items-center justify-center gap-2"
            >
              {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Settle & Pay Out
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}

/* ──────────────────────────── Shared bits ─────────────────────────────── */

function Modal({
  title,
  onClose,
  children,
  maxWidth = "max-w-md",
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  maxWidth?: string;
}) {
  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className={`bg-[#161925] border border-[#2a3050] rounded-2xl w-full ${maxWidth} my-8`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-[#2a3050]">
          <h3 className="text-sm font-bold text-white">{title}</h3>
          <button onClick={onClose} className="text-[#8b95b8] hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-[10px] uppercase tracking-wide text-[#5a6485] mb-1 block">
        {label}
      </label>
      {children}
    </div>
  );
}
