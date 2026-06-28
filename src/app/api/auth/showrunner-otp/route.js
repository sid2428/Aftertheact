import { NextResponse } from "next/server";
import { redis } from "@/lib/upstash";
import { sendEmail } from "@/lib/email";
import crypto from "crypto";

// Sends a one-time code for the Showrunner (admin) login. Unlike the public
// user OTP, this NEVER takes a destination from the request — the code always
// goes to one fixed admin inbox, so the endpoint can't be abused to mail
// arbitrary addresses. Knowing the secret login URL only gets you to step one;
// you still need access to the admin inbox AND the id/password.
const COOLDOWN_SEC = 30;
const OTP_TTL_SEC = 600; // 10 minutes

// Fixed destination for the showrunner code. Falls back to the mailbox we send
// from (SMTP_USER) when SHOWRUNNER_OTP_EMAIL isn't set.
const OTP_DEST = process.env.SHOWRUNNER_OTP_EMAIL || process.env.SMTP_USER;

export async function POST(req) {
  try {
    if (!OTP_DEST) {
      console.error("Showrunner OTP destination not configured (SHOWRUNNER_OTP_EMAIL / SMTP_USER).");
      return NextResponse.json({ error: "Login is not configured." }, { status: 500 });
    }

    // Single global cooldown — there's only one showrunner inbox to protect.
    const cooldownKey = "showrunner:otp:cooldown";
    if (await redis.get(cooldownKey)) {
      const ttl = await redis.ttl(cooldownKey);
      return NextResponse.json(
        { error: `Please wait ${ttl > 0 ? ttl : COOLDOWN_SEC}s before requesting another code.`, retryAfter: ttl > 0 ? ttl : COOLDOWN_SEC },
        { status: 429 }
      );
    }

    // 6-digit code from a crypto-grade RNG.
    const otp = crypto.randomInt(100000, 1000000).toString();
    await redis.setex("showrunner:otp", OTP_TTL_SEC, otp);

    const emailRes = await sendEmail({
      to: OTP_DEST,
      subject: "Your Showrunner access code",
      html: `
        <div style="font-family: sans-serif; padding: 20px; max-width: 600px; margin: auto;">
          <h2>Showrunner Control Panel</h2>
          <p>Your one-time access code is:</p>
          <h1 style="letter-spacing: 5px; font-size: 32px; background: #f4f4f4; padding: 10px; display: inline-block;">${otp}</h1>
          <p>This code expires in 10 minutes. If you didn't request it, ignore this email.</p>
        </div>
      `,
    });

    if (!emailRes.success && !emailRes.simulated) {
      console.error("Failed to send showrunner OTP email", emailRes.error);
      return NextResponse.json({ error: "Failed to send code" }, { status: 500 });
    }

    await redis.setex(cooldownKey, COOLDOWN_SEC, "1");
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in showrunner-otp route:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
