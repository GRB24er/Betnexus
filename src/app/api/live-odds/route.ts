import { fetchLiveMatches } from "@/lib/oddsapi";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SSE_INTERVAL_MS = 30_000;          // Poll every 30 seconds (conserves API credits)
const SSE_MAX_DURATION_MS = 10 * 60 * 1_000; // Close after 10 minutes, client reconnects

/**
 * GET /api/live-odds
 *
 * Server-Sent Events stream that pushes real live match updates from
 * The Odds API every 30 seconds. Clients reconnect automatically via
 * the EventSource API.
 */
export async function GET() {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      let closed = false;
      let interval: ReturnType<typeof setInterval>;
      let timeout: ReturnType<typeof setTimeout>;

      const enqueue = (data: string) => {
        if (closed) return;
        try {
          controller.enqueue(encoder.encode(data));
        } catch {
          cleanup();
        }
      };

      const cleanup = () => {
        if (closed) return;
        closed = true;
        clearInterval(interval);
        clearTimeout(timeout);
        try { controller.close(); } catch { /* already closed */ }
      };

      const send = async () => {
        try {
          const liveMatches = await fetchLiveMatches();
          const updates = liveMatches.map((m) => ({
            id: m.id,
            homeTeam: m.homeTeam,
            awayTeam: m.awayTeam,
            league: m.league,
            sport: m.sport,
            odds: m.odds,
            score:
              m.homeScore != null && m.awayScore != null
                ? `${m.homeScore}-${m.awayScore}`
                : undefined,
            minute: m.minute,
            isLive: m.isLive,
            timestamp: Date.now(),
          }));
          enqueue(`data: ${JSON.stringify(updates)}\n\n`);
        } catch (err) {
          console.error("[live-odds SSE] fetch error:", err);
          enqueue(`data: []\n\n`);
        }
      };

      // Send initial payload immediately
      await send();

      interval = setInterval(send, SSE_INTERVAL_MS);
      timeout = setTimeout(cleanup, SSE_MAX_DURATION_MS);

      return cleanup;
    },

    cancel() {
      // Client disconnected — cleanup handled via closure above
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
