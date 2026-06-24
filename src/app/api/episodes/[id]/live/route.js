import { redis } from "@/lib/upstash";

// Prevent Next.js from caching this route
export const dynamic = 'force-dynamic';

export async function GET(req, { params }) {
  const { id: episodeId } = await params;
  
  const encoder = new TextEncoder();
  
  const stream = new ReadableStream({
    async start(controller) {
      // Send an initial connected message
      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ status: "connected" })}\n\n`));

      const interval = setInterval(async () => {
        try {
          // The hash `episode:{episodeId}:scores` stores two flat fields per
          // contestant — `{contestantId}:total` and `{contestantId}:count` —
          // written atomically by submitVote (HINCRBYFLOAT / HINCRBY).
          const [scores, voterCountRaw] = await Promise.all([
            redis.hgetall(`episode:${episodeId}:scores`),
            redis.get(`episode:${episodeId}:voter_count`),
          ]);

          const totals = {};
          const counts = {};
          for (const [field, value] of Object.entries(scores || {})) {
            const sep = field.lastIndexOf(":");
            if (sep === -1) continue;
            const contestantId = field.slice(0, sep);
            const kind = field.slice(sep + 1);
            const num = Number(value);
            if (!Number.isFinite(num)) continue;
            if (kind === "total") totals[contestantId] = num;
            else if (kind === "count") counts[contestantId] = num;
          }

          const liveAverages = {};
          for (const contestantId of Object.keys(counts)) {
            const count = counts[contestantId];
            liveAverages[contestantId] = count > 0 ? (totals[contestantId] || 0) / count : 0;
          }

          controller.enqueue(encoder.encode(`data: ${JSON.stringify({
            type: "LIVE_SCORES",
            scores: liveAverages,
            voterCount: Number(voterCountRaw) || 0,
          })}\n\n`));
        } catch (error) {
          console.error("SSE Redis Error:", error);
        }
      }, 5000); // 5 second polling cadence for a tighter "live" feel

      // Heartbeat ping keeps idle proxies from closing the connection.
      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "ping" })}\n\n`));
        } catch {
          // controller already closed; the abort handler will clean up
        }
      }, 25000);

      // Cleanup on disconnect
      req.signal.addEventListener("abort", () => {
        clearInterval(interval);
        clearInterval(heartbeat);
        controller.close();
      });
    }
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      "Connection": "keep-alive",
    },
  });
}
