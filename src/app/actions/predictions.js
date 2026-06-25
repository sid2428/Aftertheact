"use server";

import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getServiceSupabase } from "@/lib/supabase";
import { sendEmail } from "@/lib/email";

export async function submitPredictions({ episodeId, topId, bottomId, alignment }) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    return { success: false, error: "Must be logged in to predict." };
  }

  if (!topId || !bottomId || !alignment) {
    return { success: false, error: "Missing predictions." };
  }
  if (!['HARSH', 'ALIGNED', 'GENEROUS'].includes(alignment)) {
    return { success: false, error: "Invalid alignment vibe." };
  }
  if (!['HARSH', 'ALIGNED', 'GENEROUS'].includes(alignment)) {
    return { success: false, error: "Invalid alignment vibe." };
  }

  const supabase = getServiceSupabase();

  // Check if already locked
  const { data: existing } = await supabase
    .from("UserPrediction")
    .select("id")
    .eq("user_id", session.user.id)
    .eq("episode_id", episodeId)
    .single();

  if (existing) {
    return { success: false, error: "You have already locked your predictions." };
  }

  // Check if window is open (UPCOMING only)
  const { data: episode } = await supabase
    .from("Episode")
    .select("status, title, season_number, episode_number")
    .eq("id", episodeId)
    .single();

  if (episode?.status !== "UPCOMING") {
    return { success: false, error: "Prediction window is closed. Episode is already live or revealed." };
  }

  // Insert or Update prediction
  const { error } = await supabase
    .from("UserPrediction")
    .upsert({
      user_id: session.user.id,
      episode_id: episodeId,
      predicted_top_contestant_id: topId,
      predicted_bottom_contestant_id: bottomId,
      predicted_alignment: alignment
    }, { onConflict: 'user_id, episode_id' });

  if (error) {
    console.error("Prediction insert error:", error);
    return { success: false, error: "Failed to save prediction. Try again." };
  }

  // Fire-and-forget Email: "Lock Verdict Countdown"
  if (session.user.email) {
    const revealDate = new Date(Date.now() + 48 * 60 * 60 * 1000); // 48 hours from now
    const formattedDate = revealDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
    const formattedTime = revealDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZoneName: 'short' });

    const htmlTemplate = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap');
          body {
            background-color: #0A0A0A;
            color: #ffffff;
            font-family: 'Inter', sans-serif;
            margin: 0;
            padding: 0;
            -webkit-font-smoothing: antialiased;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 40px 20px;
            background-color: #0A0A0A;
          }
          .header {
            text-align: center;
            border-bottom: 1px solid #333;
            padding-bottom: 20px;
            margin-bottom: 40px;
          }
          .header h1 {
            color: #D4AF37; /* Latent Gold */
            text-transform: uppercase;
            letter-spacing: 4px;
            font-size: 14px;
            margin: 0;
          }
          .title {
            text-align: center;
            font-size: 36px;
            font-weight: 900;
            text-transform: uppercase;
            margin: 0 0 20px 0;
            letter-spacing: -1px;
            line-height: 1.1;
          }
          .accent {
            color: #8B1E2D; /* Latent Crimson */
          }
          .countdown-box {
            background: linear-gradient(145deg, #111111, #050505);
            border: 1px solid #D4AF37;
            border-radius: 8px;
            padding: 40px 20px;
            text-align: center;
            margin: 30px 0;
            box-shadow: 0 10px 30px rgba(212, 175, 55, 0.1);
          }
          .countdown-text {
            font-size: 48px;
            font-weight: 900;
            color: #ffffff;
            margin: 0;
            letter-spacing: 2px;
            text-shadow: 0 0 20px rgba(255, 255, 255, 0.3);
          }
          .countdown-label {
            color: #D4AF37;
            text-transform: uppercase;
            font-weight: 700;
            letter-spacing: 4px;
            font-size: 12px;
            margin-top: 10px;
          }
          .details {
            background-color: #111111;
            border-left: 4px solid #8B1E2D;
            padding: 20px;
            margin-top: 30px;
          }
          .details p {
            margin: 5px 0;
            color: #aaaaaa;
            font-size: 14px;
          }
          .details strong {
            color: #ffffff;
          }
          .footer {
            text-align: center;
            margin-top: 50px;
            color: #555555;
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: 2px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>After The Act</h1>
          </div>
          
          <h2 class="title">Verdict <span class="accent">Locked</span></h2>
          
          <p style="text-align: center; color: #aaaaaa; font-size: 16px; line-height: 1.5; margin-bottom: 30px;">
            Your Oracle predictions for <strong>S${episode?.season_number}E${episode?.episode_number} — ${episode?.title}</strong> have been sealed. The clock is ticking.
          </p>

          <div class="countdown-box">
            <h3 class="countdown-text">48:00:00</h3>
            <div class="countdown-label">Hours Until Reveal</div>
          </div>

          <div class="details">
            <p><strong>REVEAL DATE:</strong> ${formattedDate}</p>
            <p><strong>REVEAL TIME:</strong> ${formattedTime}</p>
            <p><strong>STATUS:</strong> Waiting for Live Broadcast</p>
          </div>
          
          <p style="text-align: center; color: #888888; font-size: 14px; line-height: 1.6; margin-top: 40px;">
            Once the live voting window closes and the 48-hour countdown finishes, the true results will be unveiled. If your predictions match the crowd, your Oracle Score will rise.
          </p>

          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} After The Act. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    sendEmail({
      to: session.user.email,
      subject: "Verdict Locked: 48 Hours Until Reveal",
      html: htmlTemplate,
    }).catch(err => console.error("Failed to send prediction lock email:", err));
  }

  return { success: true };
}
