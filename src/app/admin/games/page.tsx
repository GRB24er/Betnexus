"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Loader2,
  Plus,
  RefreshCw,
  Shuffle,
  Trash2,
  Eye,
  EyeOff,
  X,
  Star,
  Crown,
  CheckSquare,
  Square,
  Sparkles,
} from "lucide-react";
import { api } from "@/lib/api";

type Odds = {
  home: number;
  draw: number;
  away: number;
  over15?: number;
  under15?: number;
  over25?: number;
  under25?: number;
  bttsYes?: number;
  bttsNo?: number;
};

type GameRecord = {
  _id: string;
  title: string;
  league: string;
  sport: string;
  homeTeam: string;
  awayTeam: string;
  kickoffAt: string;
  status: string;
  odds: Odds;
  published: boolean;
  premium: boolean;
  accessFee: number;
  visibleToTier: string;
  result?: string;
};

export default function AdminGamesPage() {
  const [games, setGames] = useState<GameRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  // Create form state
  const [title, setTitle] = useState("");
  const [league, setLeague] = useState("EPL");
  const [homeTeam, setHomeTeam] = useState("");
  const [awayTeam, setAwayTeam] = useState("");
  const [kickoffAt, setKickoffAt] = useState("");
  const [premium, setPremium] = useState(false);
  const [accessFee, setAccessFee] = useState("0");
  const [visibleToTier, setVisibleToTier] = useState<"free" | "premium" | "vip">(
    "free"
  );
  const [published, setPublished] = useState(true);
  const [creating, setCreating] = useState(false);

  const fetchGames = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<{ games: GameRecord[] }>("/api/admin/games?limit=200");
      setGames(res.games || []);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGames();
  }, [fetchGames]);

  const toggleSelected = (id: string) => {
    setSelected((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    if (selected.size === games.length) setSelected(new Set());
    else setSelected(new Set(games.map((g) => g._id)));
  };

  const randomizeSelected = async () => {
    const ids = Array.from(selected);
    if (ids.length === 0) {
      alert("Select games first, or click 'Randomize All Visible'");
      return;
    }
    await fetch("/api/admin/games", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ ids }),
    });
    fetchGames();
    setSelected(new Set());
  };

  const randomizeAll = async () => {
    const ids = games.map((g) => g._id);
    if (ids.length === 0) return;
    await fetch("/api/admin/games", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ ids }),
    });
    fetchGames();
  };

  const togglePublished = async (g: GameRecord) => {
    await api.patch("/api/admin/games", {
      id: g._id,
      action: g.published ? "unpublish" : "publish",
    });
    fetchGames();
  };

  const removeGame = async (id: string) => {
    if (!confirm("Delete this game?")) return;
    await api.patch("/api/admin/games", { id, action: "delete" });
    fetchGames();
  };

  const randomizeOne = async (id: string) => {
    await api.patch("/api/admin/games", { id, action: "randomize" });
    fetchGames();
  };

  const create = async () => {
    if (!homeTeam || !awayTeam || !kickoffAt) return;
    setCreating(true);
    try {
      await api.post("/api/admin/games", {
        title: title || `${homeTeam} vs ${awayTeam}`,
        league,
        sport: "football",
        homeTeam,
        awayTeam,
        kickoffAt: new Date(kickoffAt).toISOString(),
        published,
        premium,
        accessFee: parseFloat(accessFee) || 0,
        visibleToTier,
      });
      setShowCreate(false);
      setTitle("");
      setHomeTeam("");
      setAwayTeam("");
      setKickoffAt("");
      setPremium(false);
      setAccessFee("0");
      fetchGames();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to create");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="px-3 sm:px-4 lg:px-8 py-4 sm:py-6 max-w-[1400px] mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#ffc107]" />
            Games & Odds
          </h1>
          <p className="text-[11px] text-[#5a6485]">
            Publish matches, randomize odds, monetize premium picks
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={randomizeAll}
            className="flex items-center gap-1.5 px-3 py-2 bg-[#ffc107]/10 border border-[#ffc107]/30 rounded-lg text-xs font-bold text-[#ffc107] hover:bg-[#ffc107]/20"
          >
            <Shuffle className="w-3.5 h-3.5" /> Randomize All
          </button>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-1.5 px-3 py-2 gradient-green rounded-lg text-xs font-bold text-white"
          >
            <Plus className="w-3.5 h-3.5" /> Add Game
          </button>
          <button
            onClick={fetchGames}
            className="p-2 text-[#8b95b8] hover:text-[#00d46e]"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {selected.size > 0 && (
        <div className="mb-3 bg-[#ffc107]/10 border border-[#ffc107]/30 rounded-lg px-4 py-2.5 flex items-center justify-between">
          <p className="text-xs text-[#ffc107] font-medium">
            {selected.size} game(s) selected
          </p>
          <div className="flex gap-2">
            <button
              onClick={randomizeSelected}
              className="text-xs px-3 py-1.5 bg-[#ffc107] text-black font-bold rounded-lg"
            >
              Randomize Selected
            </button>
            <button
              onClick={() => setSelected(new Set())}
              className="text-xs px-3 py-1.5 bg-[#1c2033] text-[#8b95b8] rounded-lg"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-[#00d46e]" />
        </div>
      ) : games.length === 0 ? (
        <div className="text-center py-16">
          <Sparkles className="w-8 h-8 text-[#5a6485] mx-auto mb-3" />
          <p className="text-sm text-[#8b95b8]">No games yet</p>
          <button
            onClick={() => setShowCreate(true)}
            className="mt-3 text-xs text-[#00d46e] hover:underline"
          >
            Add your first game
          </button>
        </div>
      ) : (
        <div className="bg-[#1c2033] border border-[#2a3050] rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="border-b border-[#2a3050]">
                <tr className="text-[10px] text-[#5a6485] uppercase">
                  <th className="px-3 py-3">
                    <button onClick={selectAll}>
                      {selected.size === games.length && games.length > 0 ? (
                        <CheckSquare className="w-3.5 h-3.5 text-[#00d46e]" />
                      ) : (
                        <Square className="w-3.5 h-3.5 text-[#5a6485]" />
                      )}
                    </button>
                  </th>
                  <th className="px-3 py-3">Match</th>
                  <th className="px-3 py-3">League</th>
                  <th className="px-3 py-3">Kickoff</th>
                  <th className="px-3 py-3">1</th>
                  <th className="px-3 py-3">X</th>
                  <th className="px-3 py-3">2</th>
                  <th className="px-3 py-3">Tier</th>
                  <th className="px-3 py-3">Status</th>
                  <th className="px-3 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2a3050]/50">
                {games.map((g) => (
                  <tr key={g._id} className="hover:bg-[#0f1118]">
                    <td className="px-3 py-3">
                      <button onClick={() => toggleSelected(g._id)}>
                        {selected.has(g._id) ? (
                          <CheckSquare className="w-3.5 h-3.5 text-[#00d46e]" />
                        ) : (
                          <Square className="w-3.5 h-3.5 text-[#5a6485]" />
                        )}
                      </button>
                    </td>
                    <td className="px-3 py-3">
                      <p className="text-xs font-bold text-white">
                        {g.homeTeam} vs {g.awayTeam}
                      </p>
                      {g.premium && (
                        <span className="text-[9px] font-bold text-[#ffc107] flex items-center gap-0.5">
                          <Crown className="w-2.5 h-2.5" /> Premium · GHS{" "}
                          {g.accessFee.toFixed(2)}
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-3 text-xs text-[#8b95b8]">
                      {g.league}
                    </td>
                    <td className="px-3 py-3 text-xs text-[#8b95b8]">
                      {new Date(g.kickoffAt).toLocaleString("en-GB", {
                        day: "2-digit",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="px-3 py-3 text-xs font-bold text-[#00d46e]">
                      {g.odds.home.toFixed(2)}
                    </td>
                    <td className="px-3 py-3 text-xs font-bold text-[#8b95b8]">
                      {g.odds.draw.toFixed(2)}
                    </td>
                    <td className="px-3 py-3 text-xs font-bold text-[#3b82f6]">
                      {g.odds.away.toFixed(2)}
                    </td>
                    <td className="px-3 py-3">
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                          g.visibleToTier === "vip"
                            ? "bg-[#8b5cf6]/15 text-[#8b5cf6]"
                            : g.visibleToTier === "premium"
                              ? "bg-[#ffc107]/15 text-[#ffc107]"
                              : "bg-[#2a3050] text-[#8b95b8]"
                        }`}
                      >
                        {g.visibleToTier.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      {g.published ? (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-[#00d46e]/15 text-[#00d46e]">
                          LIVE
                        </span>
                      ) : (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-[#2a3050] text-[#5a6485]">
                          DRAFT
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex gap-1 justify-end">
                        <button
                          onClick={() => randomizeOne(g._id)}
                          className="p-1.5 text-[#ffc107] hover:bg-[#ffc107]/10 rounded"
                          title="Randomize odds"
                        >
                          <Shuffle className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => togglePublished(g)}
                          className="p-1.5 text-[#3b82f6] hover:bg-[#3b82f6]/10 rounded"
                          title={g.published ? "Unpublish" : "Publish"}
                        >
                          {g.published ? (
                            <EyeOff className="w-3.5 h-3.5" />
                          ) : (
                            <Eye className="w-3.5 h-3.5" />
                          )}
                        </button>
                        <button
                          onClick={() => removeGame(g._id)}
                          className="p-1.5 text-[#ff4757] hover:bg-[#ff4757]/10 rounded"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showCreate && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setShowCreate(false)}
        >
          <div
            className="bg-[#161925] border border-[#2a3050] rounded-2xl w-full max-w-lg p-5 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-[#00d46e]" /> Add New Game
              </h3>
              <button
                onClick={() => setShowCreate(false)}
                className="text-[#5a6485] hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <FormField
                  label="Home Team"
                  value={homeTeam}
                  onChange={setHomeTeam}
                />
                <FormField
                  label="Away Team"
                  value={awayTeam}
                  onChange={setAwayTeam}
                />
              </div>
              <FormField
                label="Title (optional)"
                value={title}
                onChange={setTitle}
              />
              <div className="grid grid-cols-2 gap-3">
                <FormField label="League" value={league} onChange={setLeague} />
                <FormField
                  label="Kickoff (local)"
                  type="datetime-local"
                  value={kickoffAt}
                  onChange={setKickoffAt}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-[#5a6485] uppercase mb-1 block">
                    Visibility Tier
                  </label>
                  <select
                    value={visibleToTier}
                    onChange={(e) =>
                      setVisibleToTier(
                        e.target.value as "free" | "premium" | "vip"
                      )
                    }
                    className="w-full bg-[#0f1118] border border-[#2a3050] rounded-lg px-3 py-2.5 text-sm text-white"
                  >
                    <option value="free">Free</option>
                    <option value="premium">Premium</option>
                    <option value="vip">VIP</option>
                  </select>
                </div>
                <FormField
                  label="Access Fee (GHS)"
                  type="number"
                  value={accessFee}
                  onChange={setAccessFee}
                />
              </div>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 text-xs text-[#8b95b8] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={published}
                    onChange={(e) => setPublished(e.target.checked)}
                  />
                  Publish immediately
                </label>
                <label className="flex items-center gap-2 text-xs text-[#8b95b8] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={premium}
                    onChange={(e) => setPremium(e.target.checked)}
                  />
                  <Star className="w-3.5 h-3.5 text-[#ffc107]" /> Premium pick
                </label>
              </div>
              <p className="text-[10px] text-[#5a6485]">
                Odds are auto-generated. Use the Randomize button to refresh
                them later.
              </p>
              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setShowCreate(false)}
                  className="flex-1 px-4 py-2.5 text-xs font-medium text-[#8b95b8] bg-[#0f1118] border border-[#2a3050] rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={create}
                  disabled={creating || !homeTeam || !awayTeam || !kickoffAt}
                  className="flex-1 px-4 py-2.5 text-xs font-bold text-white gradient-green rounded-lg disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  {creating && <Loader2 className="w-3 h-3 animate-spin" />}
                  Create
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function FormField({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <div>
      <label className="text-[10px] text-[#5a6485] uppercase mb-1 block">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-[#0f1118] border border-[#2a3050] rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#00d46e]/50"
      />
    </div>
  );
}
