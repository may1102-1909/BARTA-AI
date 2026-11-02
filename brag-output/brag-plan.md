# BARTA AI · Demo Video Storyboard & Production Plan

## 1. Metadata
- **Project:** BARTA AI — Autonomous Outbound Voice Agent Platform
- **Target Resolution:** 1920 × 1080 (1080p Full HD, 30 fps)
- **Visual Identity:** Crystal White (`#FFFFFF`) & Deep Navy Blue (`#0F172A`), Surface Slate (`#F8FAFC`), Muted Slate (`#64748B`), Vibrant Blue (`#3B82F6`)
- **Voice Agent Profile:** Shubham (Indian Conversational Voice Engine)
- **Client Lead:** Tanmay Vijay Khurpe (`+918454925469` — blurred on-screen)
- **Speech Stack:** Gnani AI Prisma STT (v2.5/v3.0) + Gnani AI Timbre TTS (v2.0/v3.0)

---

## 2. Storyboard & Scene Breakdown

### Scene 1: The Title Card (00:00 – 00:04)
- **Visual:** Solid Deep Navy Blue (`#0F172A`) backdrop. Centered, crystal-white typography displaying **BARTA AI**. Subtle radiant glow and tagline: *"Autonomous Outbound Voice Agent Platform"*.
- **Narrative / Audio:** Punchy ambient intro chime, establishing the sleek brand tone.

### Scene 2: The Core Problem & Solution (00:04 – 00:14)
- **Visual:** Smooth zoom-in on the BARTA AI live web console (`localhost:3000`). Displaying live metric counters (Calls Connected, Reach Percentage, Order Conversions).
- **Core Message:** Traditional outbound call centers are expensive, slow, and unscalable. BARTA AI replaces human dialing desks with autonomous AI agents that converse naturally in Indian dialects and close sales automatically.

### Scene 3: Step 1 — Campaign Creation Flow (00:14 – 00:24)
- **Visual:** Transition to the Campaigns Dashboard (`localhost:3000/campaigns`). The cursor clicks `+ New campaign`.
- **Form Filling Animation:**
  - **Campaign Name:** `CURATED India - Festive Linen Drop`
  - **Goal / Objective:** `Highlighting the new fashion drop of Curated India store and checking interest in product details.`
  - **Product URL:** `https://curatedindia.vercel.app` (demonstrating real-time validation checkmark)
  - **Concurrency & Retries:** 1 concurrent call, 2 retry limit.
  - Smooth transition button: `Next → Step 2: Script Customization`.

### Scene 4: Step 2 — CSV Ingestion & Lead Targeting (00:24 – 00:32)
- **Visual:** Modal Step 2 showcasing drag-and-drop ingestion.
- **Data Ingested:**
  ```csv
  name,phone,email,language,reason_for_calling
  Tanmay Vijay Khurpe,+918454925469,may.911.505@gmail.com,Hinglish,Highlighting the new fashion drop of Curated India store and checking interest in product details.
  ```
- **Feedback:** Success badge: `1 Contact Imported · Tanmay Vijay Khurpe`.
- **Action Trigger:** User clicks `Run Campaign & Start Calling`.

### Scene 5: Outbound Call & Live Voice Exchange (00:32 – 00:46)
- **Visual:** Split layout. Background shows BARTA AI active campaign monitor. Corner overlay features the realistic mobile call screen (`media_1793623092873_be167169.jpg`) with the phone number **securely blurred and censored**.
- **Spoken Dialogue & Waveform:**
  - **Agent (Shubham):** *"Hi, kya mai Tanmay se baat kar raha hoon?"*
  - **Customer:** *"Haan, boliye kaun?"*
  - **Agent:** *"Main Shubham hoon Curated India se. Main aapko hamare store ke naye drop ke baare mein batane ke liye call kar raha hoon. Kya aap product ke details dekhna chahenge?"*
  - **Customer:** *"Haan email aur WhatsApp pe bhej do."*
  - **Agent:** *"Bilkul! Maine aapke email aur WhatsApp par secure link aur catalog bhej diya hai. Thank you!"*

### Scene 6: Instant Order Confirmation Delivery (00:46 – 00:54)
- **Visual:** Smooth camera pan to the customer's email inbox view for `may.911.505@gmail.com`.
- **Action:** A branded confirmation email arrives instantly containing the personalized order form link (`/order-form/[token]`) and CURATED India lookbook.

### Scene 7: Speech Architecture — Powered by Gnani AI (00:54 – 01:04)
- **Visual:** Clean technical architecture diagram:
  - **Speech-to-Text (STT):** **Gnani Prisma v2.5 / v3.0** streaming 8 kHz raw PCM audio over WebSocket for ultra-accurate Indian English/Hinglish speech recognition.
  - **Text-to-Speech (TTS):** **Gnani Timbre v2.0 / v3.0** executing neural voice synthesis using the specialized **"Shubham"** voice profile.
  - Closed feedback loop delivering natural human latency.
  - *(Strict restriction enforced: No third-party telephony or LLM vendor names mentioned).*

### Scene 8: Outro & Call to Action (01:04 – 01:08)
- **Visual:** Deep Navy Blue `#0F172A` closing card with BARTA AI logo, GitHub repository reference, and tagline: *"Next-Generation Voice Agents for India"*.

