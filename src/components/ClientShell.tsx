"use client";

import { usePathname } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import BetSlip from "@/components/BetSlip";
import ServiceWorkerRegistrar from "@/components/ServiceWorkerRegistrar";

export default function ClientShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname.startsWith("/admin");

  // Admin routes use their own layout (admin sidebar + admin header)
  // so we skip the user-facing shell entirely
  if (isAdmin) {
    return (
      <>
        {children}
        <ServiceWorkerRegistrar />
      </>
    );
  }

  // Normal user-facing pages get the full betting shell
  return (
    <>
      <Sidebar />
      <Header />
      <main className="lg:ml-[240px] pt-16 pb-20 lg:pb-0 min-h-screen">
        {children}
      </main>
      <BetSlip />
      <ServiceWorkerRegistrar />
    </>
  );
}
