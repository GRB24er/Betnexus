"use client";

import { BetItem } from "@/lib/data";

let listeners: (() => void)[] = [];
let betSlipItems: BetItem[] = [];
let isOpen = false;

// Cached snapshot — React's useSyncExternalStore requires getSnapshot to return
// the exact same reference when nothing has changed, otherwise it triggers an
// infinite re-render loop. We only create a new object when state actually mutates.
type BetSlipSnapshot = { items: BetItem[]; isOpen: boolean };
let snapshot: BetSlipSnapshot = { items: betSlipItems, isOpen };

// Stable server-side snapshot — always the same empty reference on the server
const serverSnapshot: BetSlipSnapshot = { items: [], isOpen: false };

function emitChange() {
  // Rebuild the cached snapshot so getSnapshot returns a new reference only
  // when something has genuinely changed.
  snapshot = { items: betSlipItems, isOpen };
  listeners.forEach((l) => l());
}

export const betSlipStore = {
  subscribe(listener: () => void) {
    listeners = [...listeners, listener];
    return () => {
      listeners = listeners.filter((l) => l !== listener);
    };
  },

  // Returns the same object reference until state changes — required by React
  getSnapshot(): BetSlipSnapshot {
    return snapshot;
  },

  // Returns a stable, cached empty snapshot for SSR — avoids hydration mismatch
  getServerSnapshot(): BetSlipSnapshot {
    return serverSnapshot;
  },

  addBet(item: BetItem) {
    const exists = betSlipItems.find((b) => b.id === item.id);
    if (exists) {
      betSlipItems = betSlipItems.filter((b) => b.id !== item.id);
    } else {
      betSlipItems = [...betSlipItems, item];
    }
    if (betSlipItems.length > 0) isOpen = true;
    emitChange();
  },

  removeBet(id: string) {
    betSlipItems = betSlipItems.filter((b) => b.id !== id);
    if (betSlipItems.length === 0) isOpen = false;
    emitChange();
  },

  clearAll() {
    betSlipItems = [];
    isOpen = false;
    emitChange();
  },

  toggleOpen() {
    isOpen = !isOpen;
    emitChange();
  },

  isSelected(id: string) {
    return betSlipItems.some((b) => b.id === id);
  },
};
