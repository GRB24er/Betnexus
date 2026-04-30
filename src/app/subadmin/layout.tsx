"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  Users,
  Receipt,
  Zap,
  LogOut,
  Menu,
  X,
  Loader2,
} from "lucide-react";
import { useSession, sessionStore } from "@/store/session";
import type { SessionUser } from "@/store/session";

const navItems = [
  { href: "/subadmin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/subadmin/users", label: "My Users", icon: Users },
  { href: "/subadmin/bets", label: "Their Bets", icon: Receipt },
];

function SidebarContent({
  user,
  pathname,
  onSignOut,
  onNavigate,
}: {
  user: SessionUser;
  pathname: string;
  onSignOut: () => void;
  onNavigate?: () => void;
}) {
  return (
    <>
      <div className="px-5 py-5 border-b border-[#2a3050]">
        <Link href="/subadmin" className="flex items-center gap-2" onClick={onNavigate}>
          <div className="w-8 h-8 rounded-lg gradient-green flex items-center justify-center">
            <Zap className="w-4 h-4 text-white" fill="white" />
          </div>
          <div>
            <span className="text-base font-bold text-white">
              Bet<span className="text-[#00d46e]">Nexus</span>
            </span>
            <span className="text-[9px] font-bold bg-[#3b82f6]/20 text-[#3b82f6] px-1.5 py-0.5 rounded ml-2">
              AGENT
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
              onClick={onNavigate}
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
          <p className="text-xs font-medium text-white truncate">
            {user.firstName} {user.lastName}
          </p>
          <p className="text-[10px] text-[#5a6485] truncate">{user.email}</p>
        </div>
        <Link
          href="/"
          onClick={onNavigate}
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-[#8b95b8] hover:text-white hover:bg-[#1c2033] transition-all mb-1"
        >
          <LayoutDashboard className="w-4 h-4" />
          Back to Platform
        </Link>
        <button
          onClick={onSignOut}
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-[#ff4757] hover:bg-[#ff4757]/10 transition-all w-full text-left"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </>
  );
}

export default function SubAdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading } = useSession();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!loading && (!user || (user.role !== "subadmin" && user.role !== "admin"))) {
      router.push("/login");
    }
  }, [loading, user, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f1118] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#00d46e]" />
      </div>
    );
  }

  if (!user || (user.role !== "subadmin" && user.role !== "admin")) return null;

  const handleSignOut = () => {
    sessionStore.logout();
    router.push("/login");
  };
  const closeMobile = () => setMobileOpen(false);

  return (
    <div className="min-h-screen bg-[#0f1118]">
      <aside className="hidden lg:flex flex-col w-[240px] bg-[#161925] border-r border-[#2a3050] fixed inset-y-0 z-40">
        <SidebarContent user={user} pathname={pathname} onSignOut={handleSignOut} />
      </aside>

      <header className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-[#161925]/95 backdrop-blur-md border-b border-[#2a3050] z-30 flex items-center px-4 gap-3">
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2 text-[#8b95b8] hover:text-white"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
        <Link href="/subadmin" className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md gradient-green flex items-center justify-center">
            <Zap className="w-3.5 h-3.5 text-white" fill="white" />
          </div>
          <span className="text-base font-bold text-white">
            Bet<span className="text-[#00d46e]">Nexus</span>
          </span>
          <span className="text-[9px] font-bold bg-[#3b82f6]/20 text-[#3b82f6] px-1.5 py-0.5 rounded">
            AGENT
          </span>
        </Link>
      </header>

      {mobileOpen && (
        <div className="fixed inset-0 bg-black/60 z-40 lg:hidden" onClick={closeMobile}>
          <aside
            className="w-[260px] h-full bg-[#161925] border-r border-[#2a3050] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <SidebarContent
              user={user}
              pathname={pathname}
              onSignOut={handleSignOut}
              onNavigate={closeMobile}
            />
          </aside>
        </div>
      )}

      <main className="flex-1 lg:ml-[240px] min-h-screen pt-14 lg:pt-0">{children}</main>
    </div>
  );
}
