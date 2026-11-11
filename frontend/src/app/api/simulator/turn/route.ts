import { NextResponse } from "next/server";
import { simSessions } from "@/lib/sim-session";

const GNANI_API_KEY =
  process.env.GNANI_API_KEY ||
  "vach_1ytE2CY5X2PmhzeL0nubE9Zt8BbBiEAJJLolvC1tGkDmWoMejyz7ROUYOVyN0gjaK0P78Sm08rhcahAj352LmdVqF7sR70HQ_634270d8a579078fbdfbc335f47e42f1";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { session_id, user_transcript = "" } = body;

    // 1. If an external backend is configured and reachable, attempt proxying first
    const backendUrl = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_API_URL;
    if (backendUrl && !backendUrl.includes("localhost") && !backendUrl.includes("vercel.app")) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 3500);
        const beRes = await fetch(`${backendUrl}/simulator/turn`, {
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

    const lower = (user_transcript || "").toLowerCase().trim();
    const session = simSessions.get(session_id) || {
      contact_name: "Tanmay",
      preferred_language: "hinglish",
      transcript: [],
      call_id: "call_default",
    };

    let replyText = "";
    let thoughtText = "";
    let intentText = "inquiry";
    let toolCalled: string | null = null;
    let outcomeVal: string | null = null;
    let callEnded = false;

    // Intelligent conversational dialogue logic tailored for Curated India linen kurta sales
    if (
      lower.includes("price") ||
      lower.includes("kitna") ||
      lower.includes("rate") ||
      lower.includes("cost") ||
      lower.includes("offer") ||
      lower.includes("discount")
    ) {
      intentText = "price_inquiry";
      thoughtText =
        "Customer is asking for price and active festival discounts. Pitching the flat ₹400 festival drop discount from ₹1,899 down to ₹1,499 with free express delivery.";
      replyText =
        "Hamare pure organic handspun linen kurta ka regular price 1899 hai, lekin aaj festival offer me sirf 1499 ka hai, with free shipping aur Cash on Delivery bhi available hai.";
    } else if (
      lower.includes("order") ||
      lower.includes("kharid") ||
      lower.includes("buy") ||
      lower.includes("bhejo") ||
      lower.includes("bhej do") ||
      lower.includes("confirm") ||
      lower.includes("book") ||
      lower.includes("le lo") ||
      lower.includes("yes") ||
      lower.includes("ha") ||
      lower.includes("haan")
    ) {
      intentText = "order_confirmation";
      thoughtText =
        "Customer confirmed interest or agreed to order. Triggering confirm_order tool to create the sales order and send WhatsApp / SMS link.";
      toolCalled = "confirm_order";
      outcomeVal = "order_confirmed";
      callEnded = true;
      replyText =
        "Bahut badhiya! Maine aapka order CURATED Pure Linen Kurta ke liye note kar liya hai. Delivery address confirm karne ke liye main link abhi SMS aur WhatsApp par bhej raha hoon. Thank you!";
    } else if (
      lower.includes("busy") ||
      lower.includes("later") ||
      lower.includes("baad me") ||
      lower.includes("drive") ||
      lower.includes("meeting") ||
      lower.includes("call back")
    ) {
      intentText = "callback_requested";
      thoughtText =
        "Customer indicated they are busy or asked to be called back. Respectfully scheduling a callback.";
      toolCalled = "schedule_callback";
      outcomeVal = "callback_requested";
      callEnded = true;
      replyText =
        "Bilkul ji, main samajh sakta hoon. Main aapko sham ko suvidhanusar dobara call kar lunga. Aapka din shubh rahe!";
    } else if (
      lower.includes("not interested") ||
      lower.includes("nahi chahiye") ||
      lower.includes("no") ||
      lower.includes("nahin") ||
      lower.includes("mat karo")
    ) {
      intentText = "not_interested";
      thoughtText =
        "Customer politely declined the offer. Acknowledging with gratitude and concluding the call gracefully.";
      outcomeVal = "not_interested";
      callEnded = true;
      replyText =
        "Koi baat nahi ji, apna keemti waqt dene ke liye shukriya. Agar future me organic ethnic wear chahiye ho toh CURATED India zaroor yaad rakhiyega. Have a great day!";
    } else if (
      lower.includes("fabric") ||
      lower.includes("material") ||
      lower.includes("color") ||
      lower.includes("size") ||
      lower.includes("quality")
    ) {
      intentText = "product_inquiry";
      thoughtText =
        "Customer inquiring about fabric specifications, sizing, and colors. Highlighting 100% organic handspun linen, ivory & olive shades.";
      replyText =
        "Yeh 100% organic handspun linen fabric hai jo kaafi breathable aur lightweight hai. S se lekar XXL tak saare sizes aur Ivory, Sage Olive aur Charcoal shades available hain.";
    } else {
      intentText = "general_conversation";
      thoughtText =
        "Addressing customer question naturally and steering conversation toward experiencing the organic linen drop.";
      replyText =
        "Ji bilkul, CURATED India me hum handcrafted breathable ethnic wear banate hain. Kya aapko Natural Ivory color pasand hai ya Olive Green?";
    }

    // Synthesize Shubham voice using Gnani Timbre TTS
    let audio_base64: string | null = null;
    if (replyText) {
      try {
        const ttsRes = await fetch("https://api.vachana.ai/api/v1/tts/inference", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-API-Key-ID": GNANI_API_KEY,
          },
          body: JSON.stringify({
            text: replyText,
            model: "timbre-v3.0",
            voice: "Shubham",
            language: session.preferred_language === "english" ? "en" : "hi",
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
        console.warn("Gnani TTS error in Next.js turn route:", e);
      }
    }

    const updatedTranscript = [
      ...(session.transcript || []),
      {
        speaker: "user",
        text: user_transcript,
        timestamp: new Date().toISOString(),
      },
      {
        speaker: "agent",
        text: replyText,
        thought: thoughtText,
        intent: intentText,
        timestamp: new Date().toISOString(),
      },
    ];

    session.transcript = updatedTranscript;
    simSessions.set(session_id, session);

    return NextResponse.json({
      agent_reply: replyText,
      thought: thoughtText,
      intent: intentText,
      audio_base64,
      audio_format: "audio/wav",
      voice: "Shubham",
      tool_called: toolCalled,
      outcome: outcomeVal,
      call_ended: callEnded,
      transcript: updatedTranscript,
    });
  } catch (err: any) {
    console.error("Simulator turn error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to process simulation turn" },
      { status: 500 }
    );
  }
}
