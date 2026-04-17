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
} from "lucide-react";
import { usePathname } from "next/navigation";
import { useSession } from "@/store/session";

const mobileNav = [
  { href: "/", label: "Home", icon: Home },
  { href: "/sports", label: "Sports", icon: Trophy },
  { href: "/live", label: "Live", icon: Zap },
  { href: "/virtuals", label: "Virtuals", icon: MonitorPlay },
  { href: "/casino", label: "Casino", icon: Gamepad2 },
  { href: "/promotions", label: "Promos", icon: Gift },
];

export default function Header() {
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const { user } = useSession();

  return (
    <>
      <header className="fixed top-0 right-0 left-0 lg:left-[240px] h-16 bg-[#161925]/95 backdrop-blur-md border-b border-[#2a3050] z-30 flex items-center px-4 lg:px-6 gap-4">
        {/* Mobile Logo */}
        <div className="lg:hidden flex items-center gap-2">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2.5 text-[#8b95b8] hover:text-white min-w-[44px] min-h-[44px] flex items-center justify-center"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <Link href="/" className="flex items-center gap-1.5">
            <div className="w-7 h-7 rounded-md gradient-green flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" fill="white" />
            </div>
            <span className="text-lg font-bold text-white">
              Bet<span className="text-[#00d46e]">Nexus</span>
            </span>
          </Link>
        </div>

        {/* Search Bar */}
        <div className="flex-1 max-w-xl hidden sm:block">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5a6485]" />
            <input
              type="text"
              placeholder="Search events, teams, or markets..."
              className="w-full bg-[#1c2033] border border-[#2a3050] rounded-lg pl-10 pr-4 py-2 text-sm text-white placeholder-[#5a6485] focus:outline-none focus:border-[#00d46e]/50 focus:ring-1 focus:ring-[#00d46e]/20 transition-all"
            />
            <kbd className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-[#5a6485] bg-[#2a3050] px-1.5 py-0.5 rounded hidden md:inline">
              ⌘K
            </kbd>
          </div>
        </div>

        {/* Mobile search toggle */}
        <button
          onClick={() => setSearchOpen(!searchOpen)}
          className="sm:hidden p-2 text-[#8b95b8] hover:text-white ml-auto"
        >
          <Search className="w-5 h-5" />
        </button>

        {/* Right Section */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Balance / Login */}
          {user ? (
            <Link href="/account" className="flex items-center gap-1.5 sm:gap-2 bg-[#1c2033] border border-[#2a3050] rounded-lg px-2 sm:px-3 py-1.5 min-h-[40px]">
              <Wallet className="w-4 h-4 text-[#00d46e] shrink-0" />
              <span className="text-xs sm:text-sm font-semibold text-white whitespace-nowrap">
                {user.currency} {user.balance.toFixed(2)}
              </span>
            </Link>
          ) : (
            <Link href="/login" className="flex items-center gap-1.5 sm:gap-2 bg-[#1c2033] border border-[#2a3050] rounded-lg px-2 sm:px-3 py-1.5 min-h-[40px] text-xs sm:text-sm font-semibold text-white">
              Sign In
            </Link>
          )}

          {/* Deposit */}
          <Link href="/deposit" className="gradient-green text-white text-sm font-semibold px-4 py-1.5 rounded-lg hover:opacity-90 transition-opacity hidden sm:block">
            Deposit
          </Link>

          {/* Notifications */}
          <Link href="/notifications" className="relative p-2.5 text-[#8b95b8] hover:text-white transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#ff4757] rounded-full" />
          </Link>

          {/* User */}
          <Link href="/account" className="p-2.5 text-[#8b95b8] hover:text-white transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center hidden sm:flex">
            <User className="w-5 h-5" />
          </Link>
        </div>
      </header>

      {/* Mobile Search Bar */}
      {searchOpen && (
        <div className="fixed top-16 left-0 right-0 bg-[#161925] border-b border-[#2a3050] p-4 z-30 sm:hidden">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5a6485]" />
            <input
              type="text"
              placeholder="Search events, teams..."
              className="w-full bg-[#1c2033] border border-[#2a3050] rounded-lg pl-10 pr-4 py-2 text-sm text-white placeholder-[#5a6485] focus:outline-none focus:border-[#00d46e]/50"
              autoFocus
            />
          </div>
        </div>
      )}

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 bg-black/60 z-40 lg:hidden" onClick={() => setMobileMenuOpen(false)}>
          <div className="w-64 h-full bg-[#161925] border-r border-[#2a3050] p-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-2 mb-6 pt-2">
              <div className="w-8 h-8 rounded-md gradient-green flex items-center justify-center">
                <Zap className="w-4 h-4 text-white" fill="white" />
              </div>
              <span className="text-lg font-bold text-white">
                Bet<span className="text-[#00d46e]">Nexus</span>
              </span>
            </div>
            {mobileNav.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-3 py-3 rounded-lg mb-1 text-sm font-medium transition-all ${
                    isActive
                      ? "bg-[#00d46e]/10 text-[#00d46e]"
                      : "text-[#8b95b8] hover:bg-[#1c2033] hover:text-white"
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  {item.label}
                </Link>
              );
            })}
            <div className="mt-6 pt-4 border-t border-[#2a3050]">
              <Link href="/deposit" onClick={() => setMobileMenuOpen(false)} className="block w-full gradient-green text-white font-semibold text-sm py-2.5 rounded-lg text-center">
                Deposit
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
              className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-2.5 pb-3 text-[10px] font-medium transition-colors min-h-[56px] ${
                isActive ? "text-[#00d46e]" : "text-[#5a6485]"
              }`}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
