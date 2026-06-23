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
          // We fetch the current live scores for all contestants in this episode
          // The structure in Redis is a hash: `episode:{episodeId}:scores`
          // where key is contestantId, value is JSON string of { totalScore, votesCount }
          
          const scores = await redis.hgetall(`episode:${episodeId}:scores`);
          
          if (scores) {
            // Compute the unweighted average for each contestant
            const liveAverages = {};
            for (const [contestantId, dataStr] of Object.entries(scores)) {
              const data = typeof dataStr === 'string' ? JSON.parse(dataStr) : dataStr;
              liveAverages[contestantId] = data.votesCount > 0 ? (data.totalScore / data.votesCount) : 0;
            }
            
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "LIVE_SCORES", scores: liveAverages })}\n\n`));
          } else {
            // Send empty object if no votes yet
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "LIVE_SCORES", scores: {} })}\n\n`));
          }
        } catch (error) {
          console.error("SSE Redis Error:", error);
        }
      }, 10000); // 10 seconds polling cadence as per spec

      // Cleanup on disconnect
      req.signal.addEventListener("abort", () => {
        clearInterval(interval);
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
