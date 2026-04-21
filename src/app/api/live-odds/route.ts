import { liveMatches as allMatches, featuredMatches, upcomingMatches } from "@/lib/data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SSE_INTERVAL_MS = 5_000;
const SSE_MAX_DURATION_MS = 5 * 60 * 1_000; // 5 minutes

export async function GET() {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      const matches = [...allMatches, ...featuredMatches, ...upcomingMatches];
      const liveMatches = matches.filter((m) => m.isLive);

      let closed = false;

      const enqueue = (data: string) => {
        if (closed) return;
        try {
          controller.enqueue(encoder.encode(data));
        } catch {
          cleanup();
        }
      };

      const send = () => {
        const updates = liveMatches.map((m) => {
          const fluctuation = () => +(Math.random() * 0.2 - 0.1).toFixed(2);
          return {
            id: m.id,
            odds: {
              home: Math.max(1.01, m.odds.home + fluctuation()),
              draw: m.odds.draw
                ? Math.max(1.01, m.odds.draw + fluctuation())
                : undefined,
              away: Math.max(1.01, m.odds.away + fluctuation()),
            },
            score:
              m.homeScore != null && m.awayScore != null
                ? `${m.homeScore}-${m.awayScore}`
                : undefined,
            minute: m.minute
              ? Math.min(90, m.minute + Math.floor(Math.random() * 3))
              : undefined,
            timestamp: Date.now(),
          };
        });

        enqueue(`data: ${JSON.stringify(updates)}\n\n`);
      };

      const interval = setInterval(send, SSE_INTERVAL_MS);
      const timeout = setTimeout(() => cleanup(), SSE_MAX_DURATION_MS);

      const cleanup = () => {
        if (closed) return;
        closed = true;
        clearInterval(interval);
        clearTimeout(timeout);
        try {
          controller.close();
        } catch {
          // Already closed
        }
      };

      // Send initial payload immediately
      send();

      // Return cleanup function for cancel
      return cleanup;
    },

    cancel() {
      // Called when the client disconnects — intervals/timeouts are cleaned up
      // via the closure returned from start()
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
