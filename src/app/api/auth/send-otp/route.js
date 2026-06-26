import { NextResponse } from "next/server";
import { redis } from "@/lib/upstash";
import { sendEmail } from "@/lib/email";
import crypto from "crypto";

// Abuse guards (initial send AND resend both route through here):
//   - 60s cooldown per email   → kills resend-spam / mail-bombing one inbox
//   - 5 sends/hour per email    → caps total mail to any one address
//   - 20 sends/hour per IP      → stops using us as a spam cannon across emails
const COOLDOWN_SEC = 60;
const PER_EMAIL_HOUR = 5;
const PER_IP_HOUR = 20;

// Count under a key with a fixed TTL window. SET NX EX guarantees the TTL is
// set even if a prior expire() failed; returns the post-increment count.
async function hit(key, ttl) {
  await redis.set(key, 0, { nx: true, ex: ttl });
  return redis.incr(key);
}

export async function POST(req) {
  try {
    const { email: rawEmail } = await req.json();

    if (!rawEmail || typeof rawEmail !== "string" || !rawEmail.includes("@")) {
      return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
    }
    const email = rawEmail.trim().toLowerCase();

    // Cooldown: one send per email per minute.
    const cooldownKey = `otp:cooldown:${email}`;
    if (await redis.get(cooldownKey)) {
      const ttl = await redis.ttl(cooldownKey);
      return NextResponse.json(
        { error: `Please wait ${ttl > 0 ? ttl : COOLDOWN_SEC}s before requesting another code.`, retryAfter: ttl > 0 ? ttl : COOLDOWN_SEC },
        { status: 429 }
      );
    }

    // Hourly caps per email and per IP.
    const ip = (req.headers.get("x-forwarded-for") || "unknown").split(",")[0].trim();
    if ((await hit(`otp:count:email:${email}`, 3600)) > PER_EMAIL_HOUR ||
        (await hit(`otp:count:ip:${ip}`, 3600)) > PER_IP_HOUR) {
      return NextResponse.json(
        { error: "Too many code requests. Try again later." },
        { status: 429 }
      );
    }

    // Generate a 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Store in Redis with 15 minutes expiration
    await redis.setex(`otp:${email}`, 900, otp);

    // Send the email
    const emailRes = await sendEmail({
      to: email,
      subject: "Your OTP for After The Act",
      html: `
        <div style="font-family: sans-serif; padding: 20px; max-width: 600px; margin: auto;">
          <h2>Login to After The Act</h2>
          <p>Your One-Time Password (OTP) is:</p>
          <h1 style="letter-spacing: 5px; font-size: 32px; background: #f4f4f4; padding: 10px; display: inline-block;">${otp}</h1>
          <p>This code will expire in 15 minutes.</p>
        </div>
      `,
    });

    if (!emailRes.success && !emailRes.simulated) {
      console.error("Failed to send OTP email", emailRes.error);
      return NextResponse.json({ error: "Failed to send email" }, { status: 500 });
    }

    // Start the cooldown only after a code actually went out.
    await redis.setex(cooldownKey, COOLDOWN_SEC, "1");

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in send-otp route:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
