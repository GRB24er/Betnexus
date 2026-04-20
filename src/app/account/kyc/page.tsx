"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Upload, CheckCircle, XCircle, Clock, Loader2, FileText } from "lucide-react";
import { useSession } from "@/store/session";
import { api } from "@/lib/api";

type KYCDoc = { _id: string; docType: string; status: string; reviewNote?: string; createdAt: string };

const docTypes = [
  { id: "national_id", label: "National ID Card", desc: "Ghana Card or other national ID" },
  { id: "passport", label: "Passport", desc: "Valid international passport" },
  { id: "drivers_license", label: "Driver's License", desc: "Valid driving license" },
  { id: "utility_bill", label: "Utility Bill", desc: "Proof of address (last 3 months)" },
  { id: "selfie", label: "Selfie with ID", desc: "Photo of yourself holding your ID" },
];

export default function KYCPage() {
  const { user } = useSession();
  const [docs, setDocs] = useState<KYCDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const fetchStatus = () => {
    api.get<{ documents: KYCDoc[] }>("/api/kyc/status")
      .then((r) => setDocs(r.documents))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { if (user) fetchStatus(); }, [user]);

  const getDocStatus = (docType: string) => docs.find((d) => d.docType === docType);

  const handleUpload = async (docType: string, file: File) => {
    setUploading(docType);
    setError(null);
    setSuccess(null);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("docType", docType);
    try {
      await fetch("/api/kyc/upload", { method: "POST", body: formData, credentials: "include" })
        .then(async (r) => {
          if (!r.ok) {
            const data = await r.json();
            throw new Error(data.error || "Upload failed");
          }
        });
      setSuccess(`${docType.replace(/_/g, " ")} uploaded successfully`);
      fetchStatus();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(null);
    }
  };

  const statusIcon = (s: string) => {
    if (s === "approved") return <CheckCircle className="w-4 h-4 text-[#00d46e]" />;
    if (s === "rejected") return <XCircle className="w-4 h-4 text-[#ff4757]" />;
    return <Clock className="w-4 h-4 text-[#ffc107]" />;
  };

  return (
    <div className="min-h-screen">
      <div className="bg-[#161925] border-b border-[#2a3050]">
        <div className="px-4 lg:px-6 py-4">
          <div className="flex items-center gap-3">
            <Link href="/account/settings" className="p-2 text-[#5a6485] hover:text-white transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-lg font-bold text-white">KYC Verification</h1>
          </div>
        </div>
      </div>

      <div className="px-4 lg:px-6 py-6 max-w-2xl">
        {user?.kycVerified && (
          <div className="mb-6 bg-[#00d46e]/10 border border-[#00d46e]/30 rounded-xl px-4 py-3 flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-[#00d46e]" />
            <p className="text-sm text-[#00d46e] font-medium">Your identity is verified</p>
          </div>
        )}

        {error && (
          <div className="mb-4 bg-[#ff4757]/10 border border-[#ff4757]/30 rounded-xl px-3 py-2 text-xs text-[#ff4757]">{error}</div>
        )}
        {success && (
          <div className="mb-4 bg-[#00d46e]/10 border border-[#00d46e]/30 rounded-xl px-3 py-2 text-xs text-[#00d46e]">{success}</div>
        )}

        <p className="text-xs text-[#8b95b8] mb-4">
          Upload the required documents to verify your identity. Accepted formats: JPEG, PNG, WebP, PDF (max 10MB).
        </p>

        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-[#00d46e]" /></div>
        ) : (
          <div className="space-y-3">
            {docTypes.map((dt) => {
              const existing = getDocStatus(dt.id);
              return (
                <div key={dt.id} className="bg-[#1c2033] border border-[#2a3050] rounded-xl px-4 py-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="text-sm font-medium text-white">{dt.label}</p>
                      <p className="text-[11px] text-[#5a6485]">{dt.desc}</p>
                    </div>
                    {existing ? (
                      <div className="flex items-center gap-1.5">
                        {statusIcon(existing.status)}
                        <span className={`text-[10px] font-bold ${
                          existing.status === "approved" ? "text-[#00d46e]" :
                          existing.status === "rejected" ? "text-[#ff4757]" : "text-[#ffc107]"
                        }`}>
                          {existing.status.toUpperCase()}
                        </span>
                      </div>
                    ) : null}
                  </div>
                  {existing?.reviewNote && (
                    <p className="text-[11px] text-[#ff4757] mb-2">Note: {existing.reviewNote}</p>
                  )}
                  {(!existing || existing.status === "rejected") && (
                    <label className="flex items-center gap-2 cursor-pointer bg-[#0f1118] border border-[#2a3050] rounded-lg px-3 py-2.5 hover:border-[#3b82f6]/30 transition-all">
                      {uploading === dt.id ? (
                        <Loader2 className="w-4 h-4 animate-spin text-[#00d46e]" />
                      ) : (
                        <Upload className="w-4 h-4 text-[#5a6485]" />
                      )}
                      <span className="text-xs text-[#8b95b8]">
                        {uploading === dt.id ? "Uploading..." : "Choose file to upload"}
                      </span>
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        className="hidden"
                        disabled={uploading === dt.id}
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) handleUpload(dt.id, f);
                          e.target.value = "";
                        }}
                      />
                    </label>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
