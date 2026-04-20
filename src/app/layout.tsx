import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import BetSlip from "@/components/BetSlip";
import ServiceWorkerRegistrar from "@/components/ServiceWorkerRegistrar";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff2",
  variable: "--font-geist-sans",
  weight: "100 900",
});

const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff2",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "BetNexus - Premium Sports Betting & Casino Platform",
  description:
    "Experience the ultimate betting platform with live sports, virtual games, casino, and more. Bet on football, basketball, tennis, and hundreds of events worldwide.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0f1118",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-[#0f1118] text-white overflow-x-hidden">
        <Sidebar />
        <Header />
        <main className="lg:ml-[240px] pt-16 pb-20 lg:pb-0 min-h-screen">
          {children}
        </main>
        <BetSlip />
        <ServiceWorkerRegistrar />
      </body>
    </html>
  );
}
