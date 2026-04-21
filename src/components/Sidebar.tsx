"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Trophy,
  Zap,
  Gamepad2,
  MonitorPlay,
  Gift,
  Star,
  TrendingUp,
  Timer,
  ChevronDown,
  ChevronRight,
  Shield,
} from "lucide-react";
import { sportsCategories } from "@/lib/data";
import { useState } from "react";
import { useSession } from "@/store/session";

const mainNav = [
  { href: "/", label: "Home", icon: Home },
  { href: "/sports", label: "Sports", icon: Trophy },
  { href: "/live", label: "Live Betting", icon: Zap, badge: "LIVE" },
  { href: "/virtuals", label: "Virtuals", icon: MonitorPlay },
  { href: "/casino", label: "Casino", icon: Gamepad2 },
  { href: "/promotions", label: "Promotions", icon: Gift, badge: "3" },
];

const quickLinks = [
  { label: "Favorites", icon: Star, count: 5, href: "/sports" },
  { label: "Popular", icon: TrendingUp, count: 48, href: "/sports" },
  { label: "Starting Soon", icon: Timer, count: 12, href: "/live" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [sportsOpen, setSportsOpen] = useState(false);
  const { user } = useSession();

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-[240px] bg-[#161925] border-r border-[#2a3050] z-40 flex flex-col overflow-hidden lg:flex hidden">
      {/* Logo */}
      <div className="p-5 border-b border-[#2a3050]">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-lg gradient-green flex items-center justify-center">
            <Zap className="w-5 h-5 text-white" fill="white" />
          </div>
          <div>
            <span className="text-xl font-bold tracking-tight text-white">
              Bet<span className="text-[#00d46e]">Nexus</span>
            </span>
          </div>
        </Link>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3">
        <div className="mb-6">
          <p className="text-[10px] font-semibold text-[#5a6485] uppercase tracking-wider px-3 mb-2">
            Menu
          </p>
          {mainNav.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg mb-0.5 text-sm font-medium transition-all duration-200 group ${
                  isActive
                    ? "bg-[#00d46e]/10 text-[#00d46e]"
                    : "text-[#8b95b8] hover:bg-[#1c2033] hover:text-white"
                }`}
              >
                <item.icon
                  className={`w-[18px] h-[18px] ${
                    isActive
                      ? "text-[#00d46e]"
                      : "text-[#5a6485] group-hover:text-white"
                  }`}
                />
                <span className="flex-1">{item.label}</span>
                {item.badge && (
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                      item.badge === "LIVE"
                        ? "bg-[#ff4757]/20 text-[#ff4757] live-pulse"
                        : "bg-[#00d46e]/20 text-[#00d46e]"
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </div>

        {/* Quick Access */}
        <div className="mb-6">
          <p className="text-[10px] font-semibold text-[#5a6485] uppercase tracking-wider px-3 mb-2">
            Quick Access
          </p>
          {quickLinks.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg mb-0.5 text-sm font-medium text-[#8b95b8] hover:bg-[#1c2033] hover:text-white transition-all duration-200 w-full group"
            >
              <item.icon className="w-[18px] h-[18px] text-[#5a6485] group-hover:text-white" />
              <span className="flex-1 text-left">{item.label}</span>
              <span className="text-[11px] text-[#5a6485]">{item.count}</span>
            </Link>
          ))}
        </div>

        {/* Sports Categories */}
        <div>
          <button
            onClick={() => setSportsOpen(!sportsOpen)}
            className="flex items-center gap-2 px-3 mb-2 w-full"
          >
            <p className="text-[10px] font-semibold text-[#5a6485] uppercase tracking-wider flex-1 text-left">
              Sports
            </p>
            {sportsOpen ? (
              <ChevronDown className="w-3 h-3 text-[#5a6485]" />
            ) : (
              <ChevronRight className="w-3 h-3 text-[#5a6485]" />
            )}
          </button>
          {sportsOpen &&
            sportsCategories.map((sport) => (
              <Link
                key={sport.id}
                href={`/sports?cat=${sport.id}`}
                className="flex items-center gap-3 px-3 py-2 rounded-lg mb-0.5 text-sm text-[#8b95b8] hover:bg-[#1c2033] hover:text-white transition-all duration-200"
              >
                <span className="text-base w-5 text-center">{sport.icon}</span>
                <span className="flex-1">{sport.name}</span>
                <span className="text-[11px] text-[#5a6485]">
                  {sport.count}
                </span>
              </Link>
            ))}
        </div>
      </nav>

      {/* Bottom Section */}
      <div className="p-4 border-t border-[#2a3050] space-y-2">
        {user?.role === "admin" && (
          <Link
            href="/admin"
            className="flex items-center justify-center gap-2 w-full bg-[#8b5cf6]/10 border border-[#8b5cf6]/30 text-[#8b5cf6] font-semibold text-sm py-2.5 rounded-lg hover:bg-[#8b5cf6]/20 transition-colors text-center"
          >
            <Shield className="w-4 h-4" />
            Admin Dashboard
          </Link>
        )}
        <Link href="/deposit" className="block w-full gradient-green text-white font-semibold text-sm py-2.5 rounded-lg hover:opacity-90 transition-opacity text-center">
          Deposit Now
        </Link>
      </div>
    </aside>
  );
}
