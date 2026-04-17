"use client";

import { useSyncExternalStore } from "react";
import { api } from "@/lib/api";

export type SessionUser = {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  balance: number;
  currency: string;
  kycVerified: boolean;
  role: "user" | "admin";
  totalDeposited: number;
  totalWithdrawn: number;
  totalWagered: number;
  totalWon: number;
};

type SessionState = {
  user: SessionUser | null;
  loading: boolean;
  error: string | null;
};

let state: SessionState = { user: null, loading: true, error: null };
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

function setState(next: Partial<SessionState>) {
  state = { ...state, ...next };
  emit();
}

let initialized = false;
async function init() {
  if (initialized) return;
  initialized = true;
  try {
    const data = await api.get<{ user: SessionUser }>("/api/auth/me");
    setState({ user: data.user, loading: false, error: null });
  } catch {
    setState({ user: null, loading: false, error: null });
  }
}

export const sessionStore = {
  subscribe(l: () => void) {
    if (typeof window !== "undefined") void init();
    listeners.add(l);
    return () => listeners.delete(l);
  },
  getSnapshot(): SessionState {
    return state;
  },
  getServerSnapshot(): SessionState {
    return { user: null, loading: true, error: null };
  },
  async refresh() {
    try {
      const data = await api.get<{ user: SessionUser }>("/api/auth/me");
      setState({ user: data.user, loading: false, error: null });
    } catch {
      setState({ user: null, loading: false, error: null });
    }
  },
  async login(email: string, password: string) {
    setState({ loading: true, error: null });
    try {
      const data = await api.post<{ user: SessionUser }>("/api/auth/login", {
        email,
        password,
      });
      setState({ user: data.user, loading: false, error: null });
      return data.user;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Login failed";
      setState({ loading: false, error: message });
      throw err;
    }
  },
  async register(input: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
    dateOfBirth?: string;
    country?: string;
  }) {
    setState({ loading: true, error: null });
    try {
      const data = await api.post<{ user: SessionUser }>(
        "/api/auth/register",
        input
      );
      setState({ user: data.user, loading: false, error: null });
      return data.user;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Registration failed";
      setState({ loading: false, error: message });
      throw err;
    }
  },
  async logout() {
    await api.post("/api/auth/logout");
    setState({ user: null, loading: false, error: null });
  },
  setBalance(balance: number) {
    if (state.user) {
      setState({ user: { ...state.user, balance } });
    }
  },
};

export function useSession(): SessionState {
  return useSyncExternalStore(
    sessionStore.subscribe,
    sessionStore.getSnapshot,
    sessionStore.getServerSnapshot
  );
}
