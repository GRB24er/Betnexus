"use client";

import { BetItem } from "@/lib/data";

let listeners: (() => void)[] = [];
let betSlipItems: BetItem[] = [];
let isOpen = false;

function emitChange() {
  listeners.forEach((l) => l());
}

export const betSlipStore = {
  subscribe(listener: () => void) {
    listeners = [...listeners, listener];
    return () => {
      listeners = listeners.filter((l) => l !== listener);
    };
  },

  getSnapshot() {
    return { items: betSlipItems, isOpen };
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
