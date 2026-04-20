"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Search, X, Zap, Loader2 } from "lucide-react";
import Link from "next/link";
import { api } from "@/lib/api";

type SearchResult = {
  id: string;
  home: string;
  away: string;
  league: string;
  sport: string;
  time: string;
  isLive: boolean;
};

export function useSearchModal() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return { open, setOpen };
}

export default function SearchModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    if (open) {
      setQuery("");
      setResults([]);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  const search = useCallback((q: string) => {
    if (q.length < 2) {
      setResults([]);
      return;
    }
    setLoading(true);
    api
      .get<{ results: SearchResult[] }>(`/api/search?q=${encodeURIComponent(q)}`)
      .then((r) => setResults(r.results))
      .catch(() => setResults([]))
      .finally(() => setLoading(false));
  }, []);

  const handleChange = (val: string) => {
    setQuery(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(val), 300);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 sm:pt-32">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg mx-4 bg-[#1c2033] border border-[#2a3050] rounded-xl shadow-2xl overflow-hidden">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-[#2a3050]">
          <Search className="w-4 h-4 text-[#5a6485] shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => handleChange(e.target.value)}
            placeholder="Search events, teams, or markets..."
            className="flex-1 bg-transparent text-sm text-white placeholder-[#5a6485] outline-none"
          />
          {loading && <Loader2 className="w-4 h-4 animate-spin text-[#00d46e]" />}
          <button onClick={onClose} className="p-1 text-[#5a6485] hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="max-h-80 overflow-y-auto">
          {results.length > 0 ? (
            <div className="py-2">
              {results.map((r) => (
                <Link
                  key={r.id}
                  href={`/sports/${r.sport.toLowerCase()}/${r.id}`}
                  onClick={onClose}
                  className="flex items-center gap-3 px-4 py-2.5 hover:bg-[#232840] transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white truncate">
                      {r.home} vs {r.away}
                    </p>
                    <p className="text-[11px] text-[#5a6485]">
                      {r.league} &middot; {r.sport}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    {r.isLive ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#ff4757]">
                        <Zap className="w-3 h-3" /> LIVE
                      </span>
                    ) : (
                      <span className="text-[10px] text-[#5a6485]">{r.time}</span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          ) : query.length >= 2 && !loading ? (
            <p className="text-sm text-[#5a6485] text-center py-8">
              No results for &ldquo;{query}&rdquo;
            </p>
          ) : (
            <div className="py-8 text-center">
              <p className="text-xs text-[#5a6485]">Type to search events, teams, and markets</p>
              <p className="text-[10px] text-[#5a6485] mt-1">Press ESC to close</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
