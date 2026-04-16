"use client";

import Link from "next/link";
import {
  ArrowLeft,
  Bell,
  Trophy,
  Wallet,
  Gift,
  Zap,
  CheckCheck,
} from "lucide-react";

const notifications = [
  {
    id: "n1",
    type: "win",
    icon: Trophy,
    color: "text-[#00d46e]",
    bgColor: "bg-[#00d46e]/10",
    title: "You won $92.50!",
    description: "Your bet on Real Madrid vs Man City (Real Madrid) has won.",
    time: "2 min ago",
    unread: true,
  },
  {
    id: "n2",
    type: "deposit",
    icon: Wallet,
    color: "text-[#3b82f6]",
    bgColor: "bg-[#3b82f6]/10",
    title: "Deposit Successful",
    description: "GHS 100.00 has been added to your account via MTN MoMo.",
    time: "15 min ago",
    unread: true,
  },
  {
    id: "n3",
    type: "promo",
    icon: Gift,
    color: "text-[#ffc107]",
    bgColor: "bg-[#ffc107]/10",
    title: "Free Bet Available!",
    description: "You have a $10 free bet to use on any Champions League match.",
    time: "1 hour ago",
    unread: true,
  },
  {
    id: "n4",
    type: "live",
    icon: Zap,
    color: "text-[#ff4757]",
    bgColor: "bg-[#ff4757]/10",
    title: "Goal! Real Madrid 2-1 Man City",
    description: "Vinicius Jr. scores in the 67th minute.",
    time: "3 hours ago",
    unread: false,
  },
  {
    id: "n5",
    type: "win",
    icon: Trophy,
    color: "text-[#00d46e]",
    bgColor: "bg-[#00d46e]/10",
    title: "You won $165.00!",
    description: "Your bet on Warriors (ML) in Lakers vs Golden State has won.",
    time: "5 hours ago",
    unread: false,
  },
  {
    id: "n6",
    type: "promo",
    icon: Gift,
    color: "text-[#ffc107]",
    bgColor: "bg-[#ffc107]/10",
    title: "Weekend Reload Bonus",
    description: "Deposit this weekend and get a 50% bonus up to $200!",
    time: "1 day ago",
    unread: false,
  },
  {
    id: "n7",
    type: "deposit",
    icon: Wallet,
    color: "text-[#3b82f6]",
    bgColor: "bg-[#3b82f6]/10",
    title: "Withdrawal Completed",
    description: "GHS 500.00 has been sent to your MTN MoMo account.",
    time: "2 days ago",
    unread: false,
  },
];

export default function NotificationsPage() {
  const unreadCount = notifications.filter((n) => n.unread).length;

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
                  <span className="bg-[#ff4757] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                    {unreadCount}
                  </span>
                )}
              </div>
            </div>
            <button className="flex items-center gap-1.5 text-xs text-[#3b82f6] hover:text-[#60a5fa] transition-colors">
              <CheckCheck className="w-3.5 h-3.5" />
              Mark all read
            </button>
          </div>
        </div>
      </div>

      <div className="px-4 lg:px-6 py-4 max-w-2xl">
        <div className="space-y-2">
          {notifications.map((notif) => (
            <div
              key={notif.id}
              className={`flex items-start gap-3 rounded-xl px-4 py-3 transition-all ${
                notif.unread
                  ? "bg-[#1c2033] border border-[#2a3050]"
                  : "bg-transparent border border-transparent hover:bg-[#1c2033]/50"
              }`}
            >
              <div className={`w-10 h-10 ${notif.bgColor} rounded-lg flex items-center justify-center shrink-0`}>
                <notif.icon className={`w-5 h-5 ${notif.color}`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p className={`text-sm font-medium ${notif.unread ? "text-white" : "text-[#8b95b8]"}`}>
                    {notif.title}
                  </p>
                  {notif.unread && (
                    <span className="w-2 h-2 bg-[#3b82f6] rounded-full shrink-0 mt-1.5" />
                  )}
                </div>
                <p className="text-xs text-[#5a6485] mt-0.5">{notif.description}</p>
                <p className="text-[10px] text-[#5a6485] mt-1">{notif.time}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
