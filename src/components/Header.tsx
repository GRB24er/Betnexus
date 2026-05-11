"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Search,
  Bell,
  User,
  Wallet,
  Zap,
  Menu,
  X,
  Home,
  Trophy,
  Gamepad2,
  MonitorPlay,
  Gift,
  Shield,
  Plus,
} from "lucide-react";
import { usePathname } from "next/navigation";
import { useSession } from "@/store/session";
import SearchModal, { useSearchModal } from "@/components/SearchModal";

const mobileNav = [
  { href: "/", label: "Home", icon: Home },
  { href: "/sports", label: "Sports", icon: Trophy },
  { href: "/live", label: "Live", icon: Zap },
  { href: "/virtuals", label: "Virtuals", icon: MonitorPlay },
  { href: "/casino", label: "Casino", icon: Gamepad2 },
  { href: "/promotions", label: "Promos", icon: Gift },
];

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const { user } = useSession();
  const { open: searchOpen, setOpen: setSearchOpen } = useSearchModal();

  return (
    <>
      <header className="fixed top-0 right-0 left-0 lg:left-[240px] h-16 bg-[#161925]/95 backdrop-blur-md border-b border-[#2a3050] z-30 flex items-center px-4 lg:px-6 gap-3">
        {/* Mobile Logo */}
        <div className="lg:hidden flex items-center gap-2">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2.5 text-[#8b95b8] hover:text-white min-w-[44px] min-h-[44px] flex items-center justify-center transition-colors"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <Link href="/" className="flex items-center gap-1.5">
            <div className="w-7 h-7 rounded-md gradient-green flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" fill="white" />
            </div>
            <span className="text-lg font-extrabold text-white">
              Bet<span className="text-gradient-green">Nexus</span>
            </span>
          </Link>
        </div>

        {/* Search Bar (opens modal) */}
        <div className="flex-1 max-w-xl hidden sm:block">
          <button
            onClick={() => setSearchOpen(true)}
            className="w-full flex items-center gap-2 bg-[#1c2033] border border-[#2a3050] rounded-xl px-3.5 py-2.5 text-sm text-[#5a6485] hover:border-[#00d46e]/30 transition-all text-left group"
          >
            <Search className="w-4 h-4 shrink-0 group-hover:text-[#00d46e] transition-colors" />
            <span className="flex-1">Search events, teams, or markets...</span>
            <kbd className="text-[10px] bg-[#2a3050] px-1.5 py-0.5 rounded hidden md:inline">⌘K</kbd>
          </button>
        </div>

        {/* Mobile search toggle */}
        <button
          onClick={() => setSearchOpen(!searchOpen)}
          className="sm:hidden p-2 text-[#8b95b8] hover:text-white ml-auto transition-colors"
        >
          <Search className="w-5 h-5" />
        </button>

        {/* Right Section */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Balance / Login */}
          {user ? (
            <Link href="/account" className="flex items-center gap-1.5 sm:gap-2 bg-[#1c2033] border border-[#2a3050] rounded-xl px-2.5 sm:px-3.5 py-2 hover:border-[#00d46e]/30 transition-all">
              <Wallet className="w-4 h-4 text-[#00d46e] shrink-0" />
              <span className="text-xs sm:text-sm font-bold text-white whitespace-nowrap">
                {user.currency} {user.balance.toFixed(2)}
              </span>
            </Link>
          ) : (
            <Link href="/login" className="flex items-center gap-1.5 sm:gap-2 bg-[#1c2033] border border-[#2a3050] rounded-xl px-3 sm:px-4 py-2 text-xs sm:text-sm font-bold text-white hover:border-[#00d46e]/30 transition-all">
              Sign In
            </Link>
          )}

          {/* Deposit */}
          <Link href="/deposit" className="gradient-green text-white text-sm font-bold px-4 py-2 rounded-xl hover:opacity-90 transition-all hidden sm:flex items-center gap-1.5 glow-green">
            <Plus className="w-3.5 h-3.5" />
            Deposit
          </Link>

          {/* Notifications */}
          <Link href="/notifications" className="relative p-2.5 text-[#8b95b8] hover:text-white transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-[#ff4757] rounded-full border-2 border-[#161925] live-pulse" />
          </Link>

          {/* Admin Link (only for admins) */}
          {user?.role === "admin" && (
            <Link
              href="/admin"
              className="p-2.5 text-[#8b5cf6] hover:text-[#a78bfa] transition-colors min-w-[44px] min-h-[44px] items-center justify-center hidden sm:flex"
              title="Admin Dashboard"
            >
              <Shield className="w-5 h-5" />
            </Link>
          )}
          {user?.role === "subadmin" && (
            <Link
              href="/subadmin"
              className="p-2.5 text-[#06b6d4] hover:text-[#22d3ee] transition-colors min-w-[44px] min-h-[44px] items-center justify-center hidden sm:flex"
              title="Sub-Admin Dashboard"
            >
              <Shield className="w-5 h-5" />
            </Link>
          )}

          {/* User */}
          <Link href="/account" className="p-2.5 text-[#8b95b8] hover:text-white transition-colors min-w-[44px] min-h-[44px] items-center justify-center hidden sm:flex">
            <div className="w-8 h-8 rounded-full bg-[#2a3050] flex items-center justify-center">
              {user ? (
                <span className="text-xs font-bold text-white">{user.firstName?.charAt(0) || "U"}</span>
              ) : (
                <User className="w-4 h-4" />
              )}
            </div>
          </Link>
        </div>
      </header>

      {/* Search Modal */}
      <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden" onClick={() => setMobileMenuOpen(false)}>
          <div
            className="w-72 h-full bg-[#161925] border-r border-[#2a3050] p-5 fade-in-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2.5 mb-8 pt-1">
              <div className="w-9 h-9 rounded-lg gradient-green flex items-center justify-center">
                <Zap className="w-5 h-5 text-white" fill="white" />
              </div>
              <span className="text-xl font-extrabold text-white">
                Bet<span className="text-gradient-green">Nexus</span>
              </span>
            </div>

            {/* User info in mobile menu */}
            {user && (
              <div className="bg-[#1c2033] border border-[#2a3050] rounded-xl p-3 mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#2a3050] flex items-center justify-center">
                    <span className="text-sm font-bold text-white">{user.firstName?.charAt(0) || "U"}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{user.firstName} {user.lastName}</p>
                    <p className="text-xs text-[#00d46e] font-bold">{user.currency} {user.balance.toFixed(2)}</p>
                  </div>
                </div>
              </div>
            )}

            {mobileNav.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`relative flex items-center gap-3 px-3 py-3 rounded-lg mb-1 text-sm font-medium transition-all ${
                    isActive
                      ? "bg-[#00d46e]/10 text-[#00d46e]"
                      : "text-[#8b95b8] hover:bg-[#1c2033] hover:text-white"
                  }`}
                >
                  {isActive && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-[#00d46e] rounded-r-full" />
                  )}
                  <item.icon className="w-5 h-5" />
                  {item.label}
                </Link>
              );
            })}

            {user?.role === "admin" && (
              <Link
                href="/admin"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-3 py-3 rounded-lg mb-1 text-sm font-medium text-[#8b5cf6] hover:bg-[#8b5cf6]/10 transition-all mt-2"
              >
                <Shield className="w-5 h-5" />
                Admin Dashboard
              </Link>
            )}
            {user?.role === "subadmin" && (
              <Link
                href="/subadmin"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-3 py-3 rounded-lg mb-1 text-sm font-medium text-[#06b6d4] hover:bg-[#06b6d4]/10 transition-all mt-2"
              >
                <Shield className="w-5 h-5" />
                Sub-Admin Dashboard
              </Link>
            )}

            <div className="mt-6 pt-4 border-t border-[#2a3050]">
              <Link
                href="/deposit"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-center gap-2 w-full gradient-green text-white font-bold text-sm py-3 rounded-xl glow-green"
              >
                <Wallet className="w-4 h-4" />
                Deposit Now
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-[#161925]/95 backdrop-blur-md border-t border-[#2a3050] z-30 lg:hidden flex safe-bottom">
        {mobileNav.slice(0, 5).map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-2.5 pb-3 text-[10px] font-medium transition-all min-h-[56px] ${
                isActive ? "text-[#00d46e]" : "text-[#5a6485]"
              }`}
            >
              <div className="relative">
                <item.icon className="w-5 h-5" />
                {isActive && (
                  <span className="absolute -top-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-[#00d46e] rounded-full" />
                )}
              </div>
              {item.label}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
