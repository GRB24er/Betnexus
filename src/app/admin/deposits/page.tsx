"use client";

import { useEffect, useState, useCallback } from "react";
import {
  ArrowDownCircle,
  ArrowUpCircle,
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
} from "lucide-react";
import { api } from "@/lib/api";

type Transaction = {
  _id: string;
  userId?: { _id: string; firstName?: string; lastName?: string; email?: string };
  type: string;
  amount: number;
  status: string;
  method?: string;
  reference?: string;
  createdAt: string;
};

type TxResponse = {
  transactions: Transaction[];
  total: number;
  page: number;
  pages: number;
};

export default function AdminDepositsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "20" });
      if (search) params.set("search", search);
      if (typeFilter !== "all") params.set("type", typeFilter);
      if (statusFilter !== "all") params.set("status", statusFilter);
      const data = await api.get<TxResponse>(`/api/admin/transactions?${params}`);
      setTransactions(data.transactions || []);
      setTotal(data.total || 0);
      setPages(data.pages || 1);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [page, search, typeFilter, statusFilter]);

  useEffect(() => { fetchTransactions(); }, [fetchTransactions]);

  const exportCSV = () => {
    const headers = "Date,User,Email,Type,Amount,Status,Method,Reference\n";
    const rows = transactions.map((t) =>
      `${new Date(t.createdAt).toISOString()},${t.userId?.firstName || ""} ${t.userId?.lastName || ""},${t.userId?.email || ""},${t.type},${t.amount},${t.status},${t.method || ""},${t.reference || ""}`
    ).join("\n");
    const blob = new Blob([headers + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `transactions-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="px-3 sm:px-4 lg:px-8 py-4 sm:py-6 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-white">Deposits & Transactions</h1>
          <p className="text-[11px] text-[#5a6485]">{total} total transactions</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={exportCSV} className="flex items-center gap-1.5 px-3 py-2 bg-[#1c2033] border border-[#2a3050] rounded-lg text-xs text-[#8b95b8] hover:text-white transition-all">
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Export CSV</span>
          </button>
          <button onClick={fetchTransactions} className="p-2 text-[#8b95b8] hover:text-[#00d46e] transition-colors">
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5a6485]" />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search by user, email, or reference..."
            className="w-full bg-[#1c2033] border border-[#2a3050] rounded-lg pl-10 pr-4 py-2.5 text-sm text-white placeholder-[#5a6485] focus:outline-none focus:border-[#00d46e]/50"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={typeFilter}
            onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
            className="bg-[#1c2033] border border-[#2a3050] rounded-lg px-3 py-2 text-xs text-[#8b95b8] focus:outline-none min-w-[100px]"
          >
            <option value="all">All Types</option>
            <option value="deposit">Deposits</option>
            <option value="withdrawal">Withdrawals</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="bg-[#1c2033] border border-[#2a3050] rounded-lg px-3 py-2 text-xs text-[#8b95b8] focus:outline-none min-w-[100px]"
          >
            <option value="all">All Status</option>
            <option value="success">Success</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
          </select>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-[#00d46e]" />
        </div>
      ) : transactions.length === 0 ? (
        <div className="text-center py-16">
          <Filter className="w-8 h-8 text-[#5a6485] mx-auto mb-3" />
          <p className="text-sm text-[#8b95b8]">No transactions found</p>
          <p className="text-xs text-[#5a6485] mt-1">Try adjusting your filters</p>
        </div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden md:block bg-[#1c2033] border border-[#2a3050] rounded-xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#2a3050]">
                  <th className="text-left text-[10px] text-[#5a6485] font-medium px-4 py-3">DATE</th>
                  <th className="text-left text-[10px] text-[#5a6485] font-medium px-4 py-3">USER</th>
                  <th className="text-left text-[10px] text-[#5a6485] font-medium px-4 py-3">TYPE</th>
                  <th className="text-right text-[10px] text-[#5a6485] font-medium px-4 py-3">AMOUNT</th>
                  <th className="text-center text-[10px] text-[#5a6485] font-medium px-4 py-3">STATUS</th>
                  <th className="text-left text-[10px] text-[#5a6485] font-medium px-4 py-3">METHOD</th>
                  <th className="text-center text-[10px] text-[#5a6485] font-medium px-4 py-3">ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx) => (
                  <tr key={tx._id} className="border-b border-[#2a3050]/50 hover:bg-[#0f1118] transition-all">
                    <td className="px-4 py-3 text-xs text-[#8b95b8]">
                      {new Date(tx.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                      <br />
                      <span className="text-[10px] text-[#5a6485]">{new Date(tx.createdAt).toLocaleTimeString()}</span>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-xs font-medium text-white">{tx.userId?.firstName || "Unknown"} {tx.userId?.lastName || ""}</p>
                      <p className="text-[10px] text-[#5a6485]">{tx.userId?.email || ""}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 text-xs font-medium ${tx.type === "deposit" ? "text-[#00d46e]" : "text-[#3b82f6]"}`}>
                        {tx.type === "deposit" ? <ArrowDownCircle className="w-3 h-3" /> : <ArrowUpCircle className="w-3 h-3" />}
                        {tx.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className={`text-sm font-bold ${tx.type === "deposit" ? "text-[#00d46e]" : "text-[#3b82f6]"}`}>
                        {tx.type === "deposit" ? "+" : "-"}GHS {tx.amount.toFixed(2)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <StatusBadge status={tx.status} />
                    </td>
                    <td className="px-4 py-3 text-xs text-[#8b95b8] capitalize">{tx.method || "—"}</td>
                    <td className="px-4 py-3 text-center">
                      <button onClick={() => setSelectedTx(tx)} className="p-1.5 text-[#5a6485] hover:text-white transition-colors">
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-2">
            {transactions.map((tx) => (
              <div key={tx._id} className="bg-[#1c2033] border border-[#2a3050] rounded-xl p-3" onClick={() => setSelectedTx(tx)}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${tx.type === "deposit" ? "bg-[#00d46e]/10" : "bg-[#3b82f6]/10"}`}>
                      {tx.type === "deposit" ? <ArrowDownCircle className="w-4 h-4 text-[#00d46e]" /> : <ArrowUpCircle className="w-4 h-4 text-[#3b82f6]" />}
                    </div>
                    <div>
                      <p className="text-xs font-medium text-white">{tx.userId?.firstName || "Unknown"} {tx.userId?.lastName || ""}</p>
                      <p className="text-[10px] text-[#5a6485] capitalize">{tx.type} · {tx.method || "—"}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-bold ${tx.type === "deposit" ? "text-[#00d46e]" : "text-[#3b82f6]"}`}>
                      {tx.type === "deposit" ? "+" : "-"}GHS {tx.amount.toFixed(2)}
                    </p>
                    <StatusBadge status={tx.status} />
                  </div>
                </div>
                <p className="text-[10px] text-[#5a6485]">{new Date(tx.createdAt).toLocaleString()}</p>
              </div>
            ))}
          </div>

          {/* Pagination */}
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

      {/* Transaction Detail Modal */}
      {selectedTx && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setSelectedTx(null)}>
          <div className="bg-[#161925] border border-[#2a3050] rounded-2xl w-full max-w-md p-5" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-white">Transaction Details</h3>
              <button onClick={() => setSelectedTx(null)} className="text-[#5a6485] hover:text-white">
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-3">
              <DetailRow label="Reference" value={selectedTx.reference || "—"} />
              <DetailRow label="User" value={`${selectedTx.userId?.firstName || ""} ${selectedTx.userId?.lastName || ""}`} />
              <DetailRow label="Email" value={selectedTx.userId?.email || "—"} />
              <DetailRow label="Type" value={selectedTx.type} />
              <DetailRow label="Amount" value={`GHS ${selectedTx.amount.toFixed(2)}`} highlight={selectedTx.type === "deposit" ? "green" : "blue"} />
              <DetailRow label="Status" value={selectedTx.status} />
              <DetailRow label="Method" value={selectedTx.method || "—"} />
              <DetailRow label="Date" value={new Date(selectedTx.createdAt).toLocaleString()} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, { icon: React.ReactNode; cls: string }> = {
    success: { icon: <CheckCircle className="w-2.5 h-2.5" />, cls: "text-[#00d46e] bg-[#00d46e]/10" },
    pending: { icon: <Clock className="w-2.5 h-2.5" />, cls: "text-[#ffc107] bg-[#ffc107]/10" },
    failed: { icon: <XCircle className="w-2.5 h-2.5" />, cls: "text-[#ff4757] bg-[#ff4757]/10" },
  };
  const s = styles[status] || styles.pending;
  return (
    <span className={`inline-flex items-center gap-0.5 text-[9px] font-medium px-1.5 py-0.5 rounded ${s.cls}`}>
      {s.icon} {status}
    </span>
  );
}

function DetailRow({ label, value, highlight }: { label: string; value: string; highlight?: "green" | "blue" }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-[#2a3050]/50 last:border-0">
      <span className="text-xs text-[#5a6485]">{label}</span>
      <span className={`text-xs font-medium ${highlight === "green" ? "text-[#00d46e]" : highlight === "blue" ? "text-[#3b82f6]" : "text-white"}`}>
        {value}
      </span>
    </div>
  );
}
