import { NextResponse } from "next/server";
import { redis } from "@/lib/upstash";
import { sendEmail } from "@/lib/email";
import crypto from "crypto";

export async function POST(req) {
  try {
    const { email } = await req.json();

    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
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

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in send-otp route:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
