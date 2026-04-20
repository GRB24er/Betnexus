"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import {
  LayoutDashboard,
  Users,
  Receipt,
  DollarSign,
  Gift,
  ShieldCheck,
  ScrollText,
  Zap,
  LogOut,
} from "lucide-react";
import { useSession, sessionStore } from "@/store/session";

const navItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/bets", label: "Bets", icon: Receipt },
  { href: "/admin/revenue", label: "Revenue", icon: DollarSign },
  { href: "/admin/promotions", label: "Promotions", icon: Gift },
  { href: "/admin/kyc", label: "KYC Review", icon: ShieldCheck },
  { href: "/admin/audit", label: "Audit Logs", icon: ScrollText },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading } = useSession();

  useEffect(() => {
    if (!loading && (!user || user.role !== "admin")) {
      router.push("/login");
    }
  }, [loading, user, router]);

  if (loading || !user || user.role !== "admin") return null;

  return (
    <div className="min-h-screen bg-[#0f1118] flex">
      <aside className="hidden lg:flex flex-col w-[240px] bg-[#161925] border-r border-[#2a3050] fixed inset-y-0">
        <div className="px-5 py-5 border-b border-[#2a3050]">
          <Link href="/admin" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg gradient-green flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" fill="white" />
            </div>
            <div>
              <span className="text-base font-bold text-white">
                Bet<span className="text-[#00d46e]">Nexus</span>
              </span>
              <span className="text-[9px] font-bold bg-[#8b5cf6]/20 text-[#8b5cf6] px-1.5 py-0.5 rounded ml-2">
                ADMIN
              </span>
            </div>
          </Link>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? "bg-[#00d46e]/10 text-[#00d46e]"
                    : "text-[#8b95b8] hover:bg-[#1c2033] hover:text-white"
                }`}
              >
                <item.icon className="w-4.5 h-4.5" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="px-3 py-4 border-t border-[#2a3050]">
          <Link
            href="/"
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-[#8b95b8] hover:text-white hover:bg-[#1c2033] transition-all mb-1"
          >
            <LayoutDashboard className="w-4 h-4" />
            Back to Platform
          </Link>
          <button
            onClick={() => { sessionStore.logout(); router.push("/login"); }}
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-[#ff4757] hover:bg-[#ff4757]/10 transition-all w-full text-left"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>

      <main className="flex-1 lg:ml-[240px] min-h-screen">{children}</main>
    </div>
  );
}
