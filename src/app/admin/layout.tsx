"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
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
  Menu,
  X,
  Loader2,
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
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!loading && (!user || user.role !== "admin")) {
      router.push("/login");
    }
  }, [loading, user, router]);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f1118] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#00d46e]" />
      </div>
    );
  }

  if (!user || user.role !== "admin") return null;

  const SidebarContent = () => (
    <>
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
              <item.icon className="w-[18px] h-[18px]" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="px-3 py-4 border-t border-[#2a3050]">
        <div className="px-3 py-2 mb-2">
          <p className="text-xs font-medium text-white truncate">{user.firstName} {user.lastName}</p>
          <p className="text-[10px] text-[#5a6485] truncate">{user.email}</p>
        </div>
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
    </>
  );

  return (
    <div className="min-h-screen bg-[#0f1118]">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-[240px] bg-[#161925] border-r border-[#2a3050] fixed inset-y-0 z-40">
        <SidebarContent />
      </aside>

      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-[#161925]/95 backdrop-blur-md border-b border-[#2a3050] z-30 flex items-center px-4 gap-3">
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2 text-[#8b95b8] hover:text-white"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
        <Link href="/admin" className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md gradient-green flex items-center justify-center">
            <Zap className="w-3.5 h-3.5 text-white" fill="white" />
          </div>
          <span className="text-base font-bold text-white">
            Bet<span className="text-[#00d46e]">Nexus</span>
          </span>
          <span className="text-[9px] font-bold bg-[#8b5cf6]/20 text-[#8b5cf6] px-1.5 py-0.5 rounded">
            ADMIN
          </span>
        </Link>
      </header>

      {/* Mobile Sidebar Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        >
          <aside
            className="w-[260px] h-full bg-[#161925] border-r border-[#2a3050] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 lg:ml-[240px] min-h-screen pt-14 lg:pt-0">
        {children}
      </main>
    </div>
  );
}
