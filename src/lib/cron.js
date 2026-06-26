// Shared auth gate for cron-only routes (flush-votes, trust-engine).
//
// Vercel Cron automatically sends `Authorization: Bearer <CRON_SECRET>` on every
// scheduled invocation when the CRON_SECRET env var is set on the project. So:
//   • CRON_SECRET set   → require a matching bearer token (closes the open route).
//   • CRON_SECRET unset → fail OPEN with a warning, so existing deploys that
//     haven't configured the secret yet don't silently stop revealing episodes.
//
// To actually lock these down: set CRON_SECRET in the Vercel project env.
export function isAuthorizedCron(request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    console.warn("[cron] CRON_SECRET is not set — cron route is publicly callable. Set it in the project env to lock this down.");
    return true;
  }
  const header = request.headers.get("authorization");
  return header === `Bearer ${secret}`;
}
