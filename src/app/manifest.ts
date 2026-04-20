import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "BetNexus - Sports Betting & Casino",
    short_name: "BetNexus",
    description:
      "Premium sports betting platform with live events, virtual games, and casino.",
    start_url: "/",
    display: "standalone",
    background_color: "#0f1118",
    theme_color: "#00d46e",
    orientation: "portrait-primary",
    categories: ["entertainment", "sports"],
    icons: [
      {
        src: "/icons/icon-192.svg",
        sizes: "192x192",
        type: "image/svg+xml",
      },
      {
        src: "/icons/icon-512.svg",
        sizes: "512x512",
        type: "image/svg+xml",
      },
      {
        src: "/icons/icon-maskable-512.svg",
        sizes: "512x512",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
  };
}
