import Link from "next/link";
import { Zap, Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="w-20 h-20 bg-[#1c2033] border border-[#2a3050] rounded-2xl flex items-center justify-center mx-auto mb-6">
          <Zap className="w-10 h-10 text-[#00d46e]" />
        </div>
        <h1 className="text-6xl font-bold text-[#2a3050] mb-2">404</h1>
        <h2 className="text-xl font-bold text-white mb-3">Page Not Found</h2>
        <p className="text-sm text-[#5a6485] mb-8">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Link
            href="/"
            className="flex items-center gap-2 gradient-green text-white font-semibold text-sm px-5 py-2.5 rounded-lg hover:opacity-90 transition-opacity"
          >
            <Home className="w-4 h-4" />
            Go Home
          </Link>
          <Link
            href="/sports"
            className="flex items-center gap-2 bg-[#1c2033] border border-[#2a3050] text-[#8b95b8] font-medium text-sm px-5 py-2.5 rounded-lg hover:text-white transition-colors"
          >
            Browse Sports
          </Link>
        </div>
      </div>
    </div>
  );
}
