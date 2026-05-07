"use client";
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft, Bell, Trophy, Wallet, Gift, Zap, CheckCheck, Loader2, ShieldCheck, AlertCircle } from "lucide-react";
import { useSession } from "@/store/session";
import { api } from "@/lib/api";
import { useRouter } from "next/navigation";

type Notification = {
  _id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
};

const TYPE_CONFIG: Record<string, { icon: React.ElementType; color: string; bgColor: string }> = {
  bet_won:           { icon: Trophy,       color: "text-[#00d46e]", bgColor: "bg-[#00d46e]/10" },
  bet_lost:          { icon: AlertCircle,  color: "text-[#ff4757]", bgColor: "bg-[#ff4757]/10" },
  bet_void:          { icon: AlertCircle,  color: "text-[#ffc107]", bgColor: "bg-[#ffc107]/10" },
  bet_cashout:       { icon: Trophy,       color: "text-[#3b82f6]", bgColor: "bg-[#3b82f6]/10" },
  deposit:           { icon: Wallet,       color: "text-[#3b82f6]", bgColor: "bg-[#3b82f6]/10" },
  withdrawal:        { icon: Wallet,       color: "text-[#8b5cf6]", bgColor: "bg-[#8b5cf6]/10" },
  withdrawal_failed: { icon: AlertCircle,  color: "text-[#ff4757]", bgColor: "bg-[#ff4757]/10" },
  promo:             { icon: Gift,         color: "text-[#ffc107]", bgColor: "bg-[#ffc107]/10" },
  kyc:               { icon: ShieldCheck,  color: "text-[#06b6d4]", bgColor: "bg-[#06b6d4]/10" },
  system:            { icon: Zap,          color: "text-[#8b95b8]", bgColor: "bg-[#8b95b8]/10" },
};

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days > 1 ? "s" : ""} ago`;
}

export default function NotificationsPage() {
  const router = useRouter();
  const { user, loading: sessionLoading } = useSession();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [markingAll, setMarkingAll] = useState(false);

  useEffect(() => {
    if (!sessionLoading && !user) router.push("/login");
  }, [sessionLoading, user, router]);

  const fetchNotifications = useCallback(() => {
    if (!user) return;
    api.get<{ notifications: Notification[]; unreadCount: number }>("/api/notifications")
      .then((res) => {
        setNotifications(res.notifications || []);
        setUnreadCount(res.unreadCount || 0);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const markAllRead = async () => {
    setMarkingAll(true);
    try {
      await api.patch("/api/notifications/read-all", {});
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch {}
    setMarkingAll(false);
  };

  const markRead = async (id: string) => {
    try {
      await api.patch(`/api/notifications/${id}/read`, {});
      setNotifications((prev) => prev.map((n) => n._id === id ? { ...n, read: true } : n));
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch {}
  };

  if (sessionLoading || (!user && !sessionLoading)) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-[#00d46e]" /></div>;
  }

  return (
    <div className="min-h-screen">
      <div className="bg-[#161925] border-b border-[#2a3050]">
        <div className="px-4 lg:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/" className="p-2 text-[#5a6485] hover:text-white transition-colors">
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-white" />
                <h1 className="text-lg font-bold text-white">Notifications</h1>
                {unreadCount > 0 && (
                  <span className="bg-[#ff4757] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">{unreadCount}</span>
                )}
              </div>
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                disabled={markingAll}
                className="flex items-center gap-1.5 text-xs text-[#3b82f6] hover:text-[#60a5fa] transition-colors disabled:opacity-50"
              >
                {markingAll ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCheck className="w-3.5 h-3.5" />}
                Mark all read
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="px-4 lg:px-6 py-4 max-w-2xl">
        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-[#00d46e]" /></div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 bg-[#1c2033] rounded-full flex items-center justify-center mb-4">
              <Bell className="w-8 h-8 text-[#5a6485]" />
            </div>
            <p className="text-sm font-medium text-white mb-1">No notifications yet</p>
            <p className="text-xs text-[#5a6485]">You&apos;ll see bet results, deposits, and promotions here.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.map((notif) => {
              const cfg = TYPE_CONFIG[notif.type] || TYPE_CONFIG.system;
              const Icon = cfg.icon;
              return (
                <div
                  key={notif._id}
                  onClick={() => !notif.read && markRead(notif._id)}
                  className={`flex items-start gap-3 rounded-xl px-4 py-3 transition-all cursor-pointer ${
                    !notif.read
                      ? "bg-[#1c2033] border border-[#2a3050] hover:border-[#3a4060]"
                      : "bg-transparent border border-transparent hover:bg-[#1c2033]/50"
                  }`}
                >
                  <div className={`w-10 h-10 ${cfg.bgColor} rounded-lg flex items-center justify-center shrink-0`}>
                    <Icon className={`w-5 h-5 ${cfg.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className={`text-sm font-medium ${!notif.read ? "text-white" : "text-[#8b95b8]"}`}>
                        {notif.title}
                      </p>
                      {!notif.read && <span className="w-2 h-2 bg-[#3b82f6] rounded-full shrink-0 mt-1.5" />}
                    </div>
                    <p className="text-xs text-[#5a6485] mt-0.5">{notif.message}</p>
                    <p className="text-[10px] text-[#5a6485] mt-1">{timeAgo(notif.createdAt)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
