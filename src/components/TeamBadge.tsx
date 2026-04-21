"use client";

import { useState } from "react";
import { getTeamColors, getTeamAbbr } from "@/lib/teamColors";

interface TeamBadgeProps {
  name: string;
  logo?: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
}

const sizeMap = {
  xs: { box: "w-4 h-4", text: "text-[7px]", radius: "rounded" },
  sm: { box: "w-6 h-6", text: "text-[9px]", radius: "rounded-md" },
  md: { box: "w-7 h-7", text: "text-[10px]", radius: "rounded-lg" },
  lg: { box: "w-12 h-12", text: "text-base", radius: "rounded-xl" },
  xl: { box: "w-16 h-16 sm:w-20 sm:h-20", text: "text-2xl sm:text-3xl", radius: "rounded-2xl" },
} as const;

/**
 * Team badge — renders the API-Football logo when available, falls back to
 * the existing colored-abbreviation badge used throughout the app. Uses a
 * native <img> tag with onError so a broken logo URL gracefully degrades
 * to the abbr badge without breaking the layout.
 */
export default function TeamBadge({
  name,
  logo,
  size = "md",
  className = "",
}: TeamBadgeProps) {
  const [logoFailed, setLogoFailed] = useState(false);
  const colors = getTeamColors(name);
  const s = sizeMap[size];
  const showLogo = logo && !logoFailed;

  if (showLogo) {
    return (
      <div
        className={`${s.box} ${s.radius} shrink-0 bg-white/95 p-1 flex items-center justify-center overflow-hidden ${className}`}
      >
        <img
          src={logo}
          alt={name}
          loading="lazy"
          onError={() => setLogoFailed(true)}
          className="w-full h-full object-contain"
        />
      </div>
    );
  }

  return (
    <div
      className={`${s.box} ${s.radius} shrink-0 flex items-center justify-center font-bold border ${s.text} ${className}`}
      style={{
        background: `linear-gradient(135deg, ${colors.primary}, ${colors.primary}cc)`,
        borderColor: `${colors.primary}60`,
        color: colors.text,
      }}
    >
      {getTeamAbbr(name).substring(0, 2)}
    </div>
  );
}
