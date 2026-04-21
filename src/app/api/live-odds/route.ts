import { getMatches } from "@/lib/oddsapi";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SSE_INTERVAL_MS = 30_000;
const SSE_MAX_DURATION_MS = 10 * 60 * 1_000;

/**
 * GET /api/live-odds
 *
 * Server-Sent Events stream that pushes live match updates every 30 seconds.
 * Reads INSTANTLY from the in-memory store — no API calls per SSE tick.
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
          const { live } = await getMatches();
          const updates = live.map((m) => ({
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

      await send();
      interval = setInterval(send, SSE_INTERVAL_MS);
      timeout = setTimeout(cleanup, SSE_MAX_DURATION_MS);

      return cleanup;
    },

    cancel() {
      // Client disconnected
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
