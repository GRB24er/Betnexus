"use client";

import { useEffect, useState } from "react";
import { ChevronDown, ChevronUp, Users, Activity } from "lucide-react";

interface LiveScore {
  homeScore: number | null;
  awayScore: number | null;
  minute: number | null;
  status: string;
  isLive: boolean;
}
interface Player {
  id: number | null;
  name: string;
  number: number | null;
  pos: string | null;
  grid: string | null;
}
interface Lineup {
  team: { id: number; name: string; logo: string };
  formation: string;
  startXI: { player: Player }[];
  substitutes: { player: Player }[];
  coach: { id: number; name: string; photo: string } | null;
}
interface Event {
  time: { elapsed: number; extra: number | null };
  team: { id: number; name: string; logo: string };
  player: { id: number | null; name: string };
  assist: { id: number | null; name: string | null };
  type: string;
  detail: string;
  comments: string | null;
}
interface LiveData {
  enabled: boolean;
  score?: LiveScore | null;
  lineups?: Lineup[] | null;
  events?: Event[] | null;
}

interface Props {
  matchId: string;
  homeTeam: string;
  awayTeam: string;
  isLive: boolean;
}

export default function MatchLivePanel({ matchId, homeTeam, awayTeam, isLive }: Props) {
  const [data, setData] = useState<LiveData | null>(null);
  const [activeTab, setActiveTab] = useState<"lineups" | "events">("events");
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const res = await fetch(`/api/matches/${matchId}/live`);
        if (!res.ok) return;
        const json = (await res.json()) as LiveData;
        if (!cancelled) setData(json);
      } catch {
        // silent: panel just stays hidden if this fails
      }
    };

    load();
    // Only poll while live — otherwise one fetch is enough.
    if (!isLive) return () => { cancelled = true; };
    const interval = setInterval(load, 30_000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [matchId, isLive]);

  if (!data || !data.enabled) return null;

  const hasLineups = (data.lineups?.length ?? 0) >= 2;
  const hasEvents = (data.events?.length ?? 0) > 0;
  if (!hasLineups && !hasEvents) return null;

  // Default to the tab that has data
  const defaultTab = hasEvents ? "events" : "lineups";
  const currentTab = (activeTab === "lineups" && !hasLineups) ||
                     (activeTab === "events" && !hasEvents)
    ? defaultTab
    : activeTab;

  return (
    <div className="max-w-5xl mx-auto px-3 lg:px-6 mt-3">
      <div className="bg-[#1c2033] border border-[#2a3050] rounded-xl overflow-hidden">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-[#2a3050]/30 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-[#00d46e]" />
            <span className="text-xs font-bold text-white uppercase tracking-wider">
              Match Center
            </span>
            {isLive && (
              <span className="flex items-center gap-1 bg-[#ff4757]/10 px-1.5 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 bg-[#ff4757] rounded-full live-pulse" />
                <span className="text-[9px] font-bold text-[#ff4757]">LIVE</span>
              </span>
            )}
          </div>
          {collapsed ? <ChevronDown className="w-4 h-4 text-[#5a6485]" /> : <ChevronUp className="w-4 h-4 text-[#5a6485]" />}
        </button>

        {!collapsed && (
          <>
            <div className="flex border-b border-[#2a3050]">
              {hasEvents && (
                <TabButton
                  active={currentTab === "events"}
                  onClick={() => setActiveTab("events")}
                  label="Events"
                  count={data.events!.length}
                />
              )}
              {hasLineups && (
                <TabButton
                  active={currentTab === "lineups"}
                  onClick={() => setActiveTab("lineups")}
                  label="Lineups"
                  count={data.lineups!.length}
                />
              )}
            </div>

            {currentTab === "events" && hasEvents && (
              <EventsList events={data.events!} homeTeam={homeTeam} />
            )}
            {currentTab === "lineups" && hasLineups && (
              <LineupsView lineups={data.lineups!} homeTeam={homeTeam} awayTeam={awayTeam} />
            )}
          </>
        )}
      </div>
    </div>
  );
}

function TabButton({ active, onClick, label, count }: {
  active: boolean;
  onClick: () => void;
  label: string;
  count: number;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 px-4 py-2.5 text-xs font-bold border-b-2 transition-colors ${
        active
          ? "border-[#00d46e] text-[#00d46e]"
          : "border-transparent text-[#5a6485] hover:text-[#8b95b8]"
      }`}
    >
      {label} <span className="opacity-60">({count})</span>
    </button>
  );
}

function EventsList({ events, homeTeam }: { events: Event[]; homeTeam: string }) {
  // Most recent first
  const sorted = [...events].sort((a, b) => b.time.elapsed - a.time.elapsed);
  return (
    <div className="p-3 space-y-1.5 max-h-80 overflow-y-auto">
      {sorted.map((ev, i) => {
        const isHome = ev.team.name.toLowerCase().includes(homeTeam.toLowerCase()) ||
                       homeTeam.toLowerCase().includes(ev.team.name.toLowerCase());
        return (
          <div
            key={i}
            className={`flex items-center gap-2 text-xs ${isHome ? "flex-row" : "flex-row-reverse text-right"}`}
          >
            <div className="w-10 shrink-0 text-[#5a6485] font-mono text-[10px]">
              {ev.time.elapsed}&apos;{ev.time.extra ? `+${ev.time.extra}` : ""}
            </div>
            <div className="shrink-0 text-sm">{eventIcon(ev.type, ev.detail)}</div>
            <div className="flex-1 min-w-0">
              <div className="text-white font-medium truncate">{ev.player.name}</div>
              {ev.assist.name && (
                <div className="text-[10px] text-[#5a6485] truncate">
                  assist: {ev.assist.name}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function eventIcon(type: string, detail: string): string {
  if (type === "Goal") return detail.includes("Own") ? "⚽️🔻" : "⚽";
  if (type === "Card") return detail.includes("Yellow") ? "🟨" : "🟥";
  if (type === "subst") return "🔁";
  if (type === "Var") return "📺";
  return "•";
}

function LineupsView({ lineups, homeTeam, awayTeam }: {
  lineups: Lineup[];
  homeTeam: string;
  awayTeam: string;
}) {
  const home = lineups.find((l) =>
    l.team.name.toLowerCase().includes(homeTeam.toLowerCase()) ||
    homeTeam.toLowerCase().includes(l.team.name.toLowerCase())
  ) ?? lineups[0];
  const away = lineups.find((l) => l !== home) ?? lineups[1];
  return (
    <div className="grid grid-cols-2 gap-2 p-3">
      <LineupColumn lineup={home} label={homeTeam} />
      <LineupColumn lineup={away} label={awayTeam} />
    </div>
  );
}

function LineupColumn({ lineup, label }: { lineup: Lineup; label: string }) {
  return (
    <div className="bg-[#0f1118] rounded-lg p-2.5">
      <div className="flex items-center gap-2 mb-2">
        <Users className="w-3 h-3 text-[#00d46e]" />
        <span className="text-[10px] font-bold text-white truncate">{label}</span>
        {lineup.formation && (
          <span className="ml-auto text-[9px] text-[#5a6485] font-mono">{lineup.formation}</span>
        )}
      </div>
      <div className="space-y-1">
        {lineup.startXI.map((p, i) => (
          <div key={i} className="flex items-center gap-1.5 text-[11px]">
            <span className="w-5 text-[9px] text-[#5a6485] font-mono text-center shrink-0">
              {p.player.number ?? "-"}
            </span>
            <span className="text-white truncate">{p.player.name}</span>
            {p.player.pos && (
              <span className="ml-auto text-[8px] text-[#5a6485] font-bold uppercase shrink-0">
                {p.player.pos}
              </span>
            )}
          </div>
        ))}
      </div>
      {lineup.substitutes.length > 0 && (
        <details className="mt-2 pt-2 border-t border-[#2a3050]">
          <summary className="text-[10px] text-[#5a6485] font-bold cursor-pointer">
            Subs ({lineup.substitutes.length})
          </summary>
          <div className="mt-1.5 space-y-1">
            {lineup.substitutes.map((p, i) => (
              <div key={i} className="flex items-center gap-1.5 text-[10px] text-[#8b95b8]">
                <span className="w-5 font-mono text-center shrink-0">{p.player.number ?? "-"}</span>
                <span className="truncate">{p.player.name}</span>
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  );
}
