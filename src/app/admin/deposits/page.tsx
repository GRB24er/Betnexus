"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  ArrowDownCircle,
  Search,
  Loader2,
  CheckCircle,
  Clock,
  XCircle,
  ChevronLeft,
  ChevronRight,
  Filter,
  Download,
  RefreshCw,
  Eye,
  Settings,
  Banknote,
  Smartphone,
  Bitcoin,
  Wallet,
  Wifi,
  WifiOff,
} from "lucide-react";
import { api } from "@/lib/api";

type Transaction = {
  _id: string;
  userId?: {
    _id: string;
    firstName?: string;
    lastName?: string;
    email?: string;
  };
  type: string;
  amount: number;
  status: string;
  method?: string;
  reference?: string;
  metadata?: { providerLabel?: string };
  createdAt: string;
};

type TxResponse = {
  transactions: Transaction[];
  total: number;
  page: number;
  pages: number;
};

type Provider = { id: string; label: string; enabled: boolean };
type Config = { activeProvider: string; providers: Provider[] };

const PROVIDER_ICONS: Record<string, React.ReactNode> = {
  korapay: <Banknote className="w-3.5 h-3.5 text-[#3b82f6]" />,
  paystack: <Banknote className="w-3.5 h-3.5 text-[#0BA4DB]" />,
  mtn_momo: <Smartphone className="w-3.5 h-3.5 text-[#FFCB05]" />,
  telecel_cash: <Smartphone className="w-3.5 h-3.5 text-[#E30613]" />,
  btc: <Bitcoin className="w-3.5 h-3.5 text-[#F7931A]" />,
  usdt_trc20: <Wallet className="w-3.5 h-3.5 text-[#26A17B]" />,
  eth: <Wallet className="w-3.5 h-3.5 text-[#627EEA]" />,
  bank_transfer: <Banknote className="w-3.5 h-3.5 text-[#8b95b8]" />,
};

export default function AdminDepositsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [config, setConfig] = useState<Config | null>(null);
  const [live, setLive] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  const fetchTransactions = useCallback(async () => {
    const params = new URLSearchParams({
      page: String(page),
      limit: "30",
      type: "deposit",
    });
    if (search) params.set("search", search);
    if (statusFilter !== "all") params.set("status", statusFilter);
    try {
      const data = await api.get<TxResponse>(
        `/api/admin/transactions?${params}`
      );
      setTransactions(data.transactions || []);
      setTotal(data.total || 0);
      setPages(data.pages || 1);
      setLastRefresh(new Date());
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter]);

  const fetchConfig = useCallback(async () => {
    try {
      const res = await api.get<{ config: Config }>(
        "/api/admin/payment-config"
      );
      setConfig(res.config);
    } catch {
      // silent
    }
  }, []);

  useEffect(() => {
    fetchTransactions();
    fetchConfig();
  }, [fetchTransactions, fetchConfig]);

  // Real-time polling
  useEffect(() => {
    if (!live) return;
    const intv = setInterval(() => fetchTransactions(), 5000);
    return () => clearInterval(intv);
  }, [live, fetchTransactions]);

  const switchProvider = async (id: string) => {
    if (!config) return;
    try {
      const res = await api.patch<{ config: Config }>(
        "/api/admin/payment-config",
        { activeProvider: id }
      );
      setConfig(res.config);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed");
    }
  };

  const exportCSV = () => {
    const headers =
      "Date,User,Email,Amount,Status,Method,Provider,Reference\n";
    const rows = transactions
      .map(
        (t) =>
          `${new Date(t.createdAt).toISOString()},${t.userId?.firstName || ""} ${t.userId?.lastName || ""},${t.userId?.email || ""},${t.amount},${t.status},${t.method || ""},${t.metadata?.providerLabel || ""},${t.reference || ""}`
      )
      .join("\n");
    const blob = new Blob([headers + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `deposits-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const totalSuccess = transactions
    .filter((t) => t.status === "success")
    .reduce((s, t) => s + t.amount, 0);
  const totalPending = transactions
    .filter((t) => t.status === "pending")
    .reduce((s, t) => s + t.amount, 0);

  return (
    <div className="px-3 sm:px-4 lg:px-8 py-4 sm:py-6 max-w-[1400px] mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-white">
            All Deposits — Real-Time
          </h1>
          <p className="text-[11px] text-[#5a6485]">
            {total} total · Last refresh {lastRefresh.toLocaleTimeString()}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setLive((l) => !l)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all ${
              live
                ? "bg-[#00d46e]/15 text-[#00d46e] border border-[#00d46e]/30"
                : "bg-[#1c2033] text-[#8b95b8] border border-[#2a3050]"
            }`}
          >
            {live ? (
              <Wifi className="w-3.5 h-3.5" />
            ) : (
              <WifiOff className="w-3.5 h-3.5" />
            )}
            <span className="hidden sm:inline">
              {live ? "LIVE" : "Paused"}
            </span>
          </button>
          <button
            onClick={exportCSV}
            className="flex items-center gap-1.5 px-3 py-2 bg-[#1c2033] border border-[#2a3050] rounded-lg text-xs text-[#8b95b8] hover:text-white transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Export</span>
          </button>
          <button
            onClick={fetchTransactions}
            className="p-2 text-[#8b95b8] hover:text-[#00d46e] transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Provider quick-switch */}
      {config && (
        <div className="bg-[#1c2033] border border-[#2a3050] rounded-xl p-4 mb-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                Active Deposit Provider
              </h3>
              <p className="text-[10px] text-[#5a6485] mt-0.5">
                Switch the primary provider users see on the deposit page
              </p>
            </div>
            <Link
              href="/admin/payment-config"
              className="flex items-center gap-1 text-[10px] text-[#3b82f6] hover:text-[#00d46e] transition-colors"
            >
              <Settings className="w-3 h-3" /> Configure
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {config.providers
              .filter((p) => p.enabled)
              .map((p) => (
                <button
                  key={p.id}
                  onClick={() => switchProvider(p.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs transition-all ${
                    config.activeProvider === p.id
                      ? "bg-[#00d46e]/10 border-[#00d46e] text-[#00d46e]"
                      : "bg-[#0f1118] border-[#2a3050] text-[#8b95b8] hover:text-white"
                  }`}
                >
                  {PROVIDER_ICONS[p.id] || (
                    <Wallet className="w-3.5 h-3.5" />
                  )}
                  <span className="font-medium truncate">{p.label}</span>
                </button>
              ))}
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
        <Stat label="On Page" value={String(transactions.length)} color="text-white" />
        <Stat
          label="Success (page)"
          value={`GHS ${totalSuccess.toFixed(2)}`}
          color="text-[#00d46e]"
        />
        <Stat
          label="Pending (page)"
          value={`GHS ${totalPending.toFixed(2)}`}
          color="text-[#ffc107]"
        />
        <Stat label="Total Records" value={String(total)} color="text-[#3b82f6]" />
      </div>

      <div className="flex flex-col sm:flex-row gap-2 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5a6485]" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search by user, email, or reference..."
            className="w-full bg-[#1c2033] border border-[#2a3050] rounded-lg pl-10 pr-4 py-2.5 text-sm text-white placeholder-[#5a6485] focus:outline-none focus:border-[#00d46e]/50"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          className="bg-[#1c2033] border border-[#2a3050] rounded-lg px-3 py-2 text-xs text-[#8b95b8] focus:outline-none min-w-[120px]"
        >
          <option value="all">All Status</option>
          <option value="success">Success</option>
          <option value="pending">Pending</option>
          <option value="failed">Failed</option>
        </select>
      </div>

      {loading && transactions.length === 0 ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-[#00d46e]" />
        </div>
      ) : transactions.length === 0 ? (
        <div className="text-center py-16">
          <Filter className="w-8 h-8 text-[#5a6485] mx-auto mb-3" />
          <p className="text-sm text-[#8b95b8]">No deposits found</p>
        </div>
      ) : (
        <>
          <div className="hidden md:block bg-[#1c2033] border border-[#2a3050] rounded-xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#2a3050]">
                  <th className="text-left text-[10px] text-[#5a6485] font-medium px-4 py-3">
                    DATE
                  </th>
                  <th className="text-left text-[10px] text-[#5a6485] font-medium px-4 py-3">
                    USER
                  </th>
                  <th className="text-left text-[10px] text-[#5a6485] font-medium px-4 py-3">
                    PROVIDER
                  </th>
                  <th className="text-right text-[10px] text-[#5a6485] font-medium px-4 py-3">
                    AMOUNT
                  </th>
                  <th className="text-center text-[10px] text-[#5a6485] font-medium px-4 py-3">
                    STATUS
                  </th>
                  <th className="text-left text-[10px] text-[#5a6485] font-medium px-4 py-3">
                    REFERENCE
                  </th>
                  <th className="text-center text-[10px] text-[#5a6485] font-medium px-4 py-3">
                    ACTIONS
                  </th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx) => (
                  <tr
                    key={tx._id}
                    className="border-b border-[#2a3050]/50 hover:bg-[#0f1118] transition-all"
                  >
                    <td className="px-4 py-3 text-xs text-[#8b95b8]">
                      {new Date(tx.createdAt).toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "short",
                      })}
                      <br />
                      <span className="text-[10px] text-[#5a6485]">
                        {new Date(tx.createdAt).toLocaleTimeString()}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-xs font-medium text-white">
                        {tx.userId?.firstName || "Unknown"}{" "}
                        {tx.userId?.lastName || ""}
                      </p>
                      <p className="text-[10px] text-[#5a6485]">
                        {tx.userId?.email || ""}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-xs text-[#8b95b8] capitalize">
                      {tx.metadata?.providerLabel || tx.method || "—"}
                    </td>
                    <td className="px-4 py-3 text-right text-sm font-bold text-[#00d46e]">
                      +GHS {tx.amount.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <StatusBadge status={tx.status} />
                    </td>
                    <td className="px-4 py-3 text-[10px] font-mono text-[#5a6485]">
                      {tx.reference || "—"}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => setSelectedTx(tx)}
                        className="p-1.5 text-[#5a6485] hover:text-white transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="md:hidden space-y-2">
            {transactions.map((tx) => (
              <div
                key={tx._id}
                className="bg-[#1c2033] border border-[#2a3050] rounded-xl p-3"
                onClick={() => setSelectedTx(tx)}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <ArrowDownCircle className="w-4 h-4 text-[#00d46e]" />
                    <div>
                      <p className="text-xs font-medium text-white">
                        {tx.userId?.firstName || "Unknown"}{" "}
                        {tx.userId?.lastName || ""}
                      </p>
                      <p className="text-[10px] text-[#5a6485]">
                        {tx.metadata?.providerLabel || tx.method}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-[#00d46e]">
                      +GHS {tx.amount.toFixed(2)}
                    </p>
                    <StatusBadge status={tx.status} />
                  </div>
                </div>
                <p className="text-[10px] text-[#5a6485]">
                  {new Date(tx.createdAt).toLocaleString()}
                </p>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between mt-4">
            <p className="text-xs text-[#5a6485]">
              Page {page} of {pages} ({total} total)
            </p>
            <div className="flex gap-1">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page <= 1}
                className="p-2 bg-[#1c2033] border border-[#2a3050] rounded-lg text-[#8b95b8] hover:text-white disabled:opacity-40 transition-all"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPage(Math.min(pages, page + 1))}
                disabled={page >= pages}
                className="p-2 bg-[#1c2033] border border-[#2a3050] rounded-lg text-[#8b95b8] hover:text-white disabled:opacity-40 transition-all"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </>
      )}

      {selectedTx && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedTx(null)}
        >
          <div
            className="bg-[#161925] border border-[#2a3050] rounded-2xl w-full max-w-md p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-white">
                Deposit Details
              </h3>
              <button
                onClick={() => setSelectedTx(null)}
                className="text-[#5a6485] hover:text-white"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-3">
              <DetailRow
                label="Reference"
                value={selectedTx.reference || "—"}
              />
              <DetailRow
                label="User"
                value={`${selectedTx.userId?.firstName || ""} ${selectedTx.userId?.lastName || ""}`}
              />
              <DetailRow
                label="Email"
                value={selectedTx.userId?.email || "—"}
              />
              <DetailRow
                label="Amount"
                value={`GHS ${selectedTx.amount.toFixed(2)}`}
                highlight="green"
              />
              <DetailRow label="Status" value={selectedTx.status} />
              <DetailRow
                label="Provider"
                value={
                  selectedTx.metadata?.providerLabel ||
                  selectedTx.method ||
                  "—"
                }
              />
              <DetailRow
                label="Date"
                value={new Date(selectedTx.createdAt).toLocaleString()}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, { icon: React.ReactNode; cls: string }> = {
    success: {
      icon: <CheckCircle className="w-2.5 h-2.5" />,
      cls: "text-[#00d46e] bg-[#00d46e]/10",
    },
    pending: {
      icon: <Clock className="w-2.5 h-2.5" />,
      cls: "text-[#ffc107] bg-[#ffc107]/10",
    },
    failed: {
      icon: <XCircle className="w-2.5 h-2.5" />,
      cls: "text-[#ff4757] bg-[#ff4757]/10",
    },
  };
  const s = styles[status] || styles.pending;
  return (
    <span
      className={`inline-flex items-center gap-0.5 text-[9px] font-medium px-1.5 py-0.5 rounded ${s.cls}`}
    >
      {s.icon} {status}
    </span>
  );
}

function Stat({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="bg-[#1c2033] border border-[#2a3050] rounded-xl p-3">
      <p className="text-[10px] text-[#5a6485]">{label}</p>
      <p className={`text-sm font-bold ${color}`}>{value}</p>
    </div>
  );
}

function DetailRow({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: "green" | "blue";
}) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-[#2a3050]/50 last:border-0">
      <span className="text-xs text-[#5a6485]">{label}</span>
      <span
        className={`text-xs font-medium ${
          highlight === "green"
            ? "text-[#00d46e]"
            : highlight === "blue"
              ? "text-[#3b82f6]"
              : "text-white"
        }`}
      >
        {value}
      </span>
    </div>
  );
}

