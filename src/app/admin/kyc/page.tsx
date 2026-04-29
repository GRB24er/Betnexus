"use client";

import { useCallback, useEffect, useState } from "react";
import { ShieldCheck, ShieldX, Loader2 } from "lucide-react";
import { api } from "@/lib/api";

type KYCDoc = {
  _id: string;
  docType: string;
  fileName: string;
  status: string;
  createdAt: string;
  userId: { _id: string; firstName: string; lastName: string; email: string } | null;
};

export default function AdminKYCPage() {
  const [docs, setDocs] = useState<KYCDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewNote, setReviewNote] = useState<Record<string, string>>({});

  const fetchDocs = useCallback(() => {
    setLoading(true);
    return api
      .get<{ documents: KYCDoc[] }>("/api/admin/kyc/review?status=pending")
      .then((r) => setDocs(r.documents))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    let cancelled = false;
    api
      .get<{ documents: KYCDoc[] }>("/api/admin/kyc/review?status=pending")
      .then((r) => {
        if (cancelled) return;
        setDocs(r.documents);
        setLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleReview = async (docId: string, action: "approve" | "reject") => {
    await api.patch("/api/admin/kyc/review", {
      documentId: docId,
      action,
      note: reviewNote[docId] || undefined,
    });
    fetchDocs();
  };

  return (
    <div className="px-4 lg:px-8 py-6">
      <h1 className="text-xl font-bold text-white mb-1">KYC Review</h1>
      <p className="text-xs text-[#5a6485] mb-6">{docs.length} pending documents</p>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-[#00d46e]" /></div>
      ) : docs.length === 0 ? (
        <p className="text-sm text-[#5a6485] text-center py-16">No pending KYC documents</p>
      ) : (
        <div className="space-y-3">
          {docs.map((doc) => (
            <div key={doc._id} className="bg-[#1c2033] border border-[#2a3050] rounded-xl p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  {doc.userId && (
                    <p className="text-sm font-medium text-white">
                      {doc.userId.firstName} {doc.userId.lastName}
                    </p>
                  )}
                  {doc.userId && (
                    <p className="text-[11px] text-[#5a6485]">{doc.userId.email}</p>
                  )}
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold bg-[#8b5cf6]/20 text-[#8b5cf6] px-2 py-0.5 rounded">
                    {doc.docType.replace(/_/g, " ").toUpperCase()}
                  </span>
                  <p className="text-[10px] text-[#5a6485] mt-1">
                    {new Date(doc.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>
              <p className="text-xs text-[#8b95b8] mb-3 font-mono">{doc.fileName}</p>
              <input
                placeholder="Review note (optional)"
                value={reviewNote[doc._id] || ""}
                onChange={(e) => setReviewNote({ ...reviewNote, [doc._id]: e.target.value })}
                className="w-full bg-[#0f1118] border border-[#2a3050] rounded-lg px-3 py-2 text-xs text-white placeholder-[#5a6485] focus:outline-none mb-3"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => handleReview(doc._id, "approve")}
                  className="flex items-center gap-1.5 text-[11px] px-4 py-1.5 bg-[#00d46e]/10 text-[#00d46e] rounded-lg hover:bg-[#00d46e]/20 transition-colors"
                >
                  <ShieldCheck className="w-3.5 h-3.5" /> Approve
                </button>
                <button
                  onClick={() => handleReview(doc._id, "reject")}
                  className="flex items-center gap-1.5 text-[11px] px-4 py-1.5 bg-[#ff4757]/10 text-[#ff4757] rounded-lg hover:bg-[#ff4757]/20 transition-colors"
                >
                  <ShieldX className="w-3.5 h-3.5" /> Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
