import { liveMatches as allMatches, featuredMatches, upcomingMatches } from "@/lib/data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      const matches = [...allMatches, ...featuredMatches, ...upcomingMatches];
      const liveMatches = matches.filter((m) => m.isLive);

      const send = () => {
        const updates = liveMatches.map((m) => {
          const fluctuation = () =>
            +(Math.random() * 0.2 - 0.1).toFixed(2);
          return {
            id: m.id,
            odds: {
              home: Math.max(1.01, m.odds.home + fluctuation()),
              draw: m.odds.draw
                ? Math.max(1.01, m.odds.draw + fluctuation())
                : undefined,
              away: Math.max(1.01, m.odds.away + fluctuation()),
            },
            score: m.homeScore != null && m.awayScore != null
              ? `${m.homeScore}-${m.awayScore}`
              : undefined,
            minute: m.minute
              ? Math.min(90, m.minute + Math.floor(Math.random() * 3))
              : undefined,
            timestamp: Date.now(),
          };
        });

        const data = `data: ${JSON.stringify(updates)}\n\n`;
        try {
          controller.enqueue(encoder.encode(data));
        } catch {
          clearInterval(interval);
        }
      };

      send();
      const interval = setInterval(send, 5000);

      setTimeout(() => {
        clearInterval(interval);
        try {
          controller.close();
        } catch {}
      }, 5 * 60 * 1000);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
