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
          // The hash `episode:{episodeId}:scores` holds, per contestant, the flat
          // fields `{contestantId}:total` and `{contestantId}:count` (written
          // atomically by submitVote via HINCRBYFLOAT / HINCRBY), plus a single
          // `voter_count` field. One HGETALL returns everything — one Redis
          // command per poll per client, the dominant Upstash cost driver.
          const scores = await redis.hgetall(`episode:${episodeId}:scores`);

          const totals = {};
          const counts = {};
          let voterCount = Number(scores?.voter_count) || 0;
          for (const [field, value] of Object.entries(scores || {})) {
            const sep = field.lastIndexOf(":");
            if (sep === -1) continue; // skips `voter_count` (handled above)
            const contestantId = field.slice(0, sep);
            const kind = field.slice(sep + 1);
            const num = Number(value);
            if (!Number.isFinite(num)) continue;
            if (kind === "total") totals[contestantId] = num;
            else if (kind === "count") counts[contestantId] = num;
          }

          // Backward-compat: episodes that started before voter_count moved into
          // the hash still keep it in a standalone key. Only costs an extra read
          // for those legacy episodes; new episodes never hit this branch.
          if (scores && scores.voter_count === undefined) {
            voterCount = Number(await redis.get(`episode:${episodeId}:voter_count`)) || 0;
          }

          const liveAverages = {};
          for (const contestantId of Object.keys(counts)) {
            const count = counts[contestantId];
            liveAverages[contestantId] = count > 0 ? (totals[contestantId] || 0) / count : 0;
          }

          controller.enqueue(encoder.encode(`data: ${JSON.stringify({
            type: "LIVE_SCORES",
            scores: liveAverages,
            voterCount,
          })}\n\n`));
        } catch (error) {
          console.error("SSE Redis Error:", error);
        }
      }, 10000); // 10s poll: halves per-client Redis traffic vs 5s, still feels live

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
