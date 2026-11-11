import { NextResponse } from "next/server";
import { simSessions } from "@/lib/sim-session";

const GNANI_API_KEY =
  process.env.GNANI_API_KEY ||
  "vach_1ytE2CY5X2PmhzeL0nubE9Zt8BbBiEAJJLolvC1tGkDmWoMejyz7ROUYOVyN0gjaK0P78Sm08rhcahAj352LmdVqF7sR70HQ_634270d8a579078fbdfbc335f47e42f1";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      contact_name = "Tanmay Sharma",
      contact_phone = "+918454925469",
      contact_email = "tanmay@curatedindia.com",
      preferred_language = "hinglish",
      notes = "Regular customer interested in linen wear",
    } = body;

    // 1. If an external backend is configured and reachable, attempt proxying first
    const backendUrl = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_API_URL;
    if (backendUrl && !backendUrl.includes("localhost") && !backendUrl.includes("vercel.app")) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 3000);
        const beRes = await fetch(`${backendUrl}/simulator/start`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "ngrok-skip-browser-warning": "1",
          },
          body: JSON.stringify(body),
          signal: controller.signal,
        });
        clearTimeout(timeout);
        if (beRes.ok) {
          const beData = await beRes.json();
          return NextResponse.json(beData);
        }
      } catch {
        // Fallback to built-in simulation below
      }
    }

    // 2. Built-in Simulation Engine: Zero 404s guaranteed
    const sessionId = "sim_" + Math.random().toString(36).substring(2, 11) + "_" + Date.now();
    const callId = "call_" + Math.random().toString(36).substring(2, 11);
    const firstName = (contact_name || "ji").split(" ")[0];

    let greeting = `Hi ${firstName}, main Shubham bol raha hoon CURATED India se. Hamare naye organic linen drop par festival offer chal raha hai — kya do minute baat ho sakti hai?`;
    if (preferred_language === "english") {
      greeting = `Hi ${firstName}, this is Shubham calling from CURATED India. We've just launched our festive organic linen drop with a flat ₹400 discount — do you have a quick minute?`;
    } else if (preferred_language === "hindi") {
      greeting = `नमस्ते ${firstName} जी, मैं शुभम बोल रहा हूँ CURATED India से। हमारे नए ऑर्गेनिक लिनेन कुर्ता फेस्टिव ड्रॉप पर विशेष ₹400 की छूट चल रही है — क्या आपसे दो मिनट बात हो सकती है?`;
    }

    const initialThought = `Initiating outbound call to ${contact_name}. Introducing CURATED India festive linen drop and checking availability.`;

    // 3. Synthesize speech using Gnani Timbre TTS (Voice: Shubham)
    let audio_base64: string | null = null;
    try {
      const ttsRes = await fetch("https://api.vachana.ai/api/v1/tts/inference", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-Key-ID": GNANI_API_KEY,
        },
        body: JSON.stringify({
          text: greeting,
          model: "timbre-v3.0",
          voice: "Shubham",
          language: preferred_language === "english" ? "en" : "hi",
          audio_config: {
            encoding: "linear_pcm",
            container: "wav",
            num_channels: 1,
            sample_rate: 8000,
            sample_width: 2,
          },
        }),
      });

      if (ttsRes.ok) {
        const audioBuf = await ttsRes.arrayBuffer();
        audio_base64 = Buffer.from(audioBuf).toString("base64");
      }
    } catch (e) {
      console.warn("Gnani TTS error in Next.js start route:", e);
    }

    const transcript = [
      {
        speaker: "agent",
        text: greeting,
        thought: initialThought,
        intent: "opening",
        timestamp: new Date().toISOString(),
      },
    ];

    simSessions.set(sessionId, {
      contact_name,
      preferred_language,
      transcript,
      call_id: callId,
    });

    return NextResponse.json({
      session_id: sessionId,
      call_id: callId,
      greeting,
      thought: initialThought,
      intent: "opening",
      audio_base64,
      audio_format: "audio/wav",
      voice: "Shubham",
      transcript,
    });
  } catch (err: any) {
    console.error("Simulator start error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to start simulation" },
      { status: 500 }
    );
  }
}
