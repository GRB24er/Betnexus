"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Copy, Share2, Users, DollarSign, Clock, CheckCircle, Loader2 } from "lucide-react";
import { useSession } from "@/store/session";
import { api } from "@/lib/api";

type ReferralData = {
  referralCode: string;
  totalReferrals: number;
  totalEarned: number;
  pending: number;
  qualified: number;
  referrals: {
    id: string;
    status: string;
    reward: number;
    paid: boolean;
    createdAt: string;
  }[];
};

export default function ReferralsPage() {
  const { user } = useSession();
  const [data, setData] = useState<ReferralData | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!user) return;
    api.get<ReferralData>("/api/referral")
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user]);

  const referralLink = data
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/register?ref=${data.referralCode}`
    : "";

  const handleCopy = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen">
      <div className="bg-[#161925] border-b border-[#2a3050]">
        <div className="px-4 lg:px-6 py-4">
          <div className="flex items-center gap-3">
            <Link href="/account" className="p-2 text-[#5a6485] hover:text-white transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-lg font-bold text-white">Referral Program</h1>
          </div>
        </div>
      </div>

      <div className="px-4 lg:px-6 py-6 max-w-2xl">
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-[#00d46e]" />
          </div>
        ) : data ? (
          <>
            <div className="bg-gradient-to-br from-[#00d46e]/20 to-[#00d46e]/5 border border-[#00d46e]/30 rounded-xl p-5 mb-6">
              <p className="text-xs text-[#00d46e] font-semibold mb-1">YOUR REFERRAL CODE</p>
              <div className="flex items-center gap-3 mb-4">
                <span className="text-2xl font-bold text-white font-mono tracking-wider">
                  {data.referralCode}
                </span>
                <button
                  onClick={() => handleCopy(data.referralCode)}
                  className="p-2 bg-[#00d46e]/20 rounded-lg text-[#00d46e] hover:bg-[#00d46e]/30 transition-colors"
                >
                  {copied ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
              <div className="bg-[#0f1118]/60 rounded-lg px-3 py-2 flex items-center gap-2">
                <input
                  readOnly
                  value={referralLink}
                  className="flex-1 bg-transparent text-xs text-[#8b95b8] outline-none font-mono truncate"
                />
                <button
                  onClick={() => handleCopy(referralLink)}
                  className="text-[10px] font-bold text-[#00d46e] px-2 py-1 bg-[#00d46e]/10 rounded hover:bg-[#00d46e]/20 transition-colors shrink-0"
                >
                  COPY LINK
                </button>
              </div>
              <p className="text-[11px] text-[#8b95b8] mt-3">
                Share your link and earn GHS 10 for every friend who signs up and places their first bet of GHS 20 or more.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-6">
              <StatCard icon={Users} label="Total Referrals" value={data.totalReferrals} />
              <StatCard icon={DollarSign} label="Total Earned" value={`GHS ${data.totalEarned.toFixed(2)}`} />
              <StatCard icon={Clock} label="Pending" value={data.pending} />
            </div>

            {typeof navigator !== "undefined" && navigator.share && (
              <button
                onClick={() =>
                  navigator.share({
                    title: "Join BetNexus",
                    text: `Use my referral code ${data.referralCode} to get a bonus!`,
                    url: referralLink,
                  })
                }
                className="w-full flex items-center justify-center gap-2 bg-[#3b82f6]/10 border border-[#3b82f6]/30 text-[#3b82f6] font-semibold text-sm py-3 rounded-xl hover:bg-[#3b82f6]/20 transition-colors mb-6"
              >
                <Share2 className="w-4 h-4" /> Share with Friends
              </button>
            )}

            <h3 className="text-sm font-bold text-white mb-3">Referral History</h3>
            {data.referrals.length === 0 ? (
              <p className="text-sm text-[#5a6485] text-center py-8">
                No referrals yet. Share your link to start earning!
              </p>
            ) : (
              <div className="space-y-2">
                {data.referrals.map((r) => (
                  <div key={r.id} className="bg-[#1c2033] border border-[#2a3050] rounded-xl px-4 py-3 flex items-center justify-between">
                    <div>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        r.status === "rewarded" ? "bg-[#00d46e]/20 text-[#00d46e]" :
                        r.status === "qualified" ? "bg-[#3b82f6]/20 text-[#3b82f6]" :
                        "bg-[#ffc107]/20 text-[#ffc107]"
                      }`}>
                        {r.status.toUpperCase()}
                      </span>
                      <p className="text-[11px] text-[#5a6485] mt-1">
                        {new Date(r.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-white">
                        GHS {r.reward.toFixed(2)}
                      </p>
                      <p className="text-[10px] text-[#5a6485]">
                        {r.paid ? "Paid" : "Pending"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          <p className="text-sm text-[#5a6485] text-center py-16">
            Please log in to view your referral dashboard.
          </p>
        )}
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string | number }) {
  return (
    <div className="bg-[#1c2033] border border-[#2a3050] rounded-xl px-3 py-3 text-center">
      <Icon className="w-4 h-4 text-[#00d46e] mx-auto mb-1" />
      <p className="text-sm font-bold text-white">{value}</p>
      <p className="text-[10px] text-[#5a6485]">{label}</p>
    </div>
  );
}
