import json
import re
import logging
from datetime import datetime, timedelta, timezone
from typing import Dict, Any, List, Optional, Callable, Awaitable
import pytz

try:
    from google import genai
    from google.genai import types
except ImportError:
    genai = None
    types = None

from app.config import settings

logger = logging.getLogger(__name__)
IST = pytz.timezone("Asia/Kolkata")

class VoiceAgentLLM:
    """
    Intelligent conversational voice agent for 'Shubham', an outbound sales agent
    for Curated India. Uses Gemini to analyze caller intent, reason deeply,
    execute tools (orders, callbacks, whatsapp catalog), and produce natural,
    concise Hinglish speech optimized for Gnani Timbre TTS.
    """

    def __init__(
        self,
        contact_name: str = "Tanmay",
        contact_phone: str = "",
        contact_email: Optional[str] = None,
        preferred_language: str = "hinglish",
        product_info: Optional[Dict[str, Any]] = None,
        campaign_goal: str = "Introduce CURATED Minimalist Linen Kurta festival offer and book orders.",
        previous_call_context: Optional[str] = None,
        tool_handler: Optional[Callable[[str, Dict[str, Any]], Awaitable[Dict[str, Any]]]] = None
    ):
        self.contact_name = (contact_name or "Tanmay").strip()
        self.contact_phone = (contact_phone or "").strip()
        self.contact_email = (contact_email or "").strip()
        self.preferred_language = preferred_language or "hinglish"
        self.campaign_goal = campaign_goal
        self.previous_call_context = previous_call_context or ""
        self.tool_handler = tool_handler

        self.product_info = product_info or {
            "brand": "CURATED India",
            "name": "CURATED Minimalist Linen Kurta",
            "fabric": "100% Organic Handspun Linen",
            "regular_price": 1899,
            "offer_price": 1499,
            "discount_offer": "Flat ₹400 OFF today (Offer Price: ₹1,499)",
            "colors": ["Natural Ivory", "Sage Olive", "Charcoal Slate", "Earthy Ochre"],
            "sizes": ["S", "M", "L", "XL", "XXL"],
            "shipping": "Free express delivery across India (3-5 business days)",
            "payment": "Cash on Delivery (COD) & Online UPI",
            "returns": "7-day hassle-free exchange & returns"
        }

        self.history: List[Dict[str, Any]] = []
        self.recorded_outcome: Optional[str] = None
        self.recorded_notes: Optional[str] = None
        self.call_ended: bool = False
        self.state: str = "opening"

        self._init_gemini()

    def _init_gemini(self):
        self.client = None
        if settings.GEMINI_API_KEY and genai:
            try:
                self.client = genai.Client(api_key=settings.GEMINI_API_KEY)
            except Exception as e:
                logger.warning(f"Failed to initialize Gemini Client: {e}. Fallback to rule engine.")

    def get_initial_greeting(self) -> str:
        """Returns the natural opening voice line personalized to the target contact."""
        self.state = "opening"
        first_name = self.contact_name.split()[0] if self.contact_name else "ji"
        if first_name.lower() in ["unknown", "customer"]:
            greeting = "Hi, main Shubham bol raha hoon CURATED India se. Hamare naye festive drop ke baare mein baat karni thi, kya do minute baat ho sakti hai?"
        else:
            greeting = f"Hi {first_name}, main Shubham bol raha hoon CURATED India se. Hamare naye organic linen drop ke baare mein baat karni thi, kya do minute baat ho sakti hai?"
        return greeting

    def _clean_for_speech(self, text: str) -> str:
        """Strips markdown asterisks, hashes, backticks, quotes for pure human-sounding TTS speech."""
        text = re.sub(r"[\*#_`~\"\[\]\(\)\{\}]", "", text)
        text = re.sub(r"\s+", " ", text).strip()
        return text

    def _build_system_prompt(self) -> str:
        current_time_ist = datetime.now(IST).strftime("%Y-%m-%d %H:%M:%S IST")
        return f"""You are "Shubham", a warm, polite, and persuasive Indian outbound voice sales agent for CURATED India.
Your voice is synthesized by Gnani AI Timbre TTS into real human voice, so your spoken response MUST be natural, spoken conversational Hinglish (blend of Hindi and English written in Latin alphabet), 1 to 2 short sentences maximum, and strictly plain text (NO markdown, NO bullet points, NO asterisks, NO quotes).

CALL CONTEXT:
- Customer Name: {self.contact_name}
- Customer Phone: {self.contact_phone}
- Customer Email: {self.contact_email}
- Language: {self.preferred_language}
- Customer Notes/Context: {self.previous_call_context or 'Target customer interested in premium ethnic/casual wear'}
- Campaign Goal: {self.campaign_goal}
- Current IST Time: {current_time_ist}

PRODUCT KNOWLEDGE (CURATED India):
- Product: {self.product_info.get('name', 'CURATED Minimalist Linen Kurta')}
- Fabric: {self.product_info.get('fabric', '100% Organic Handspun Linen')}
- Colors: {', '.join(self.product_info.get('colors', ['Natural Ivory', 'Sage Olive', 'Charcoal Slate']))}
- Sizes: {', '.join(self.product_info.get('sizes', ['S', 'M', 'L', 'XL', 'XXL']))}
- Pricing: Regular ₹1,899 | Exclusive Festival Offer today: Flat ₹1,499 (Save ₹400)
- Shipping: Free Express Shipping across India (3-5 days delivery)
- Payment: Cash on Delivery (COD) available with no extra fees; UPI/Online also supported
- Policy: 7-day hassle-free size exchange and returns

AVAILABLE ACTIONS (TOOLS):
1. confirm_order: Customer explicitly agrees to buy or order (e.g., 'order kardo', 'confirm my order', 'Ivory color L size chahiye').
   Arguments: product (string), quantity (int), color (optional string), size (optional string), payment_method (string: 'COD' or 'online'), email (string)
2. schedule_callback: Customer is busy, driving, in a meeting, or asks to call back later (e.g., 'call me in 2 hours', 'kal call karo', 'abhi busy hoon').
   Arguments: due_at_iso (ISO 8601 string, e.g. target time in IST), reason (string)
3. send_whatsapp_catalog: Customer asks to see pictures, catalog, size chart, or link on WhatsApp (e.g., 'WhatsApp pe bhej do', 'photos dikhao', 'link bhejo').
   Arguments: phone (string), message_type (string: 'catalog' | 'size_chart' | 'discount_link')
4. set_outcome: Definitive call outcome when call is concluded.
   Arguments: outcome ('order_confirmed' | 'callback_requested' | 'catalog_sent' | 'interested' | 'not_interested' | 'wrong_number' | 'do_not_call'), notes (string)

INSTRUCTIONS:
1. Analyze the customer's input carefully: identify their intent, question, or hesitation.
2. In the "thought" field, write your internal reasoning explaining what you understood, what details you are addressing (e.g. price, COD, sizing), and why you chose your response.
3. In the "spoken_text" field, provide Shubham's exact spoken reply. Be friendly, authentic, and directly answer their question. Keep it to 1-2 spoken sentences so the dialogue flows smoothly without overwhelming the listener.
4. If a tool should be triggered, specify "tool_name" and "tool_args". If no tool is needed right now, set "tool_name": null.
5. Set "call_ended": true ONLY if the call is genuinely finished (e.g. callback scheduled, customer declined, or parting goodbye after order/catalog).

You MUST output ONLY valid JSON matching this schema:
{{
  "thought": "Internal reasoning analyzing customer intent and response strategy",
  "intent": "e.g. price_inquiry | payment_inquiry | busy | interested | place_order | callback_request | decline | identity_confirm",
  "spoken_text": "Spoken line in natural Hinglish for Gnani TTS (no markdown)",
  "tool_name": "confirm_order" | "schedule_callback" | "send_whatsapp_catalog" | "set_outcome" | null,
  "tool_args": {{}},
  "outcome": "order_confirmed" | "callback_requested" | "catalog_sent" | "interested" | "not_interested" | "wrong_number" | "do_not_call" | null,
  "call_ended": boolean
}}
"""

    async def generate_response(self, user_transcript: str) -> Dict[str, Any]:
        """
        Processes caller speech and generates agent response + handles tool calls
        using Gemini reasoning with safe fallback.
        """
        self.history.append({
            "speaker": "user",
            "text": user_transcript,
            "timestamp": datetime.now(timezone.utc).isoformat()
        })

        result = None

        # 1. Attempt Gemini LLM Reasoning
        if self.client:
            try:
                system_instruction = self._build_system_prompt()
                chat_context = "\n".join([f"{t['speaker'].upper()}: {t['text']}" for t in self.history])
                prompt = (
                    f"{system_instruction}\n\n"
                    f"CONVERSATION HISTORY SO FAR:\n{chat_context}\n\n"
                    f"LATEST CUSTOMER STATEMENT: \"{user_transcript}\"\n\n"
                    f"Generate the JSON response:"
                )

                response = self.client.models.generate_content(
                    model=settings.GEMINI_MODEL,
                    contents=prompt
                )

                raw_text = response.text.strip() if response.text else ""
                # Strip markdown code blocks if wrapped
                raw_text = re.sub(r"^```(?:json)?\s*", "", raw_text, flags=re.MULTILINE)
                raw_text = re.sub(r"```\s*$", "", raw_text, flags=re.MULTILINE).strip()

                parsed = json.loads(raw_text)
                spoken = self._clean_for_speech(parsed.get("spoken_text", ""))
                thought = parsed.get("thought", "Analyzing customer statement and responding to inquiry.")
                intent = parsed.get("intent", "conversation")
                tool_name = parsed.get("tool_name")
                tool_args = parsed.get("tool_args", {})
                outcome = parsed.get("outcome")
                call_ended = bool(parsed.get("call_ended", False))

                if spoken:
                    result = {
                        "text": spoken,
                        "thought": thought,
                        "intent": intent,
                        "tool_called": tool_name,
                        "tool_args": tool_args,
                        "outcome": outcome,
                        "call_ended": call_ended
                    }
            except Exception as e:
                logger.warning(f"Gemini generation error: {e}. Executing fallback dialogue engine.")

        # 2. Fallback if Gemini failed or offline
        if not result:
            result = await self._fallback_dialogue_engine(user_transcript)

        # 3. Execute Tool if specified
        tool_name = result.get("tool_called")
        tool_args = result.get("tool_args", {})
        if tool_name and self.tool_handler:
            try:
                await self.tool_handler(tool_name, tool_args)
            except Exception as e:
                logger.error(f"Failed to execute tool {tool_name}: {e}")

        if result.get("outcome"):
            self.recorded_outcome = result["outcome"]
        if result.get("call_ended"):
            self.call_ended = True

        # Append to conversation history with thought and intent
        self.history.append({
            "speaker": "agent",
            "text": result["text"],
            "thought": result.get("thought"),
            "intent": result.get("intent"),
            "timestamp": datetime.now(timezone.utc).isoformat()
        })

        return result

    async def _fallback_dialogue_engine(self, user_text: str) -> Dict[str, Any]:
        """Contextual fallback dialogue engine when LLM API is unavailable."""
        lower = user_text.lower().strip()
        now_ist = datetime.now(IST)
        first_name = self.contact_name.split()[0] if self.contact_name else "ji"

        # DNC
        if any(w in lower for w in ["do not call", "dnc", "stop calling", "kabhi call mat karna"]):
            return {
                "text": "Bilkul samajh gaya. Maine aapka number Do Not Call list me add kar diya hai. Aage se koi call nahi aayegi. Shukriya.",
                "thought": "Customer explicitly requested Do Not Call. Honoring preference immediately.",
                "intent": "do_not_call",
                "tool_called": "set_outcome",
                "tool_args": {"outcome": "do_not_call", "notes": "Requested DNC"},
                "outcome": "do_not_call",
                "call_ended": True
            }

        # Busy / Callback
        if any(w in lower for w in ["busy", "vyast", "baad me", "later", "driving", "meeting", "abhi nahi", "kal call"]):
            due_at = (now_ist + timedelta(hours=2)).isoformat()
            return {
                "text": f"Koi baat nahi {first_name}, main aapko 2 ghante baad call karta hoon. Thank you!",
                "thought": "Customer mentioned they are busy. Scheduling a callback without pushing.",
                "intent": "busy",
                "tool_called": "schedule_callback",
                "tool_args": {"due_at_iso": due_at, "reason": "Customer busy, callback requested"},
                "outcome": "callback_requested",
                "call_ended": True
            }

        # Order Confirmation
        if any(w in lower for w in ["confirm", "order", "book", "kharidna", "bhejo ek", "cod pe kardo"]):
            return {
                "text": f"Bahut badhiya {first_name}! Maine aapka order Cash on Delivery pe confirm kar diya hai. Delivery details aapke email aur SMS pe bhej di hain.",
                "thought": "Customer confirmed order placement. Triggering confirm_order tool.",
                "intent": "place_order",
                "tool_called": "confirm_order",
                "tool_args": {
                    "product": self.product_info.get("name", "CURATED Linen Kurta"),
                    "quantity": 1,
                    "email": self.contact_email or "customer@example.com"
                },
                "outcome": "order_confirmed",
                "call_ended": True
            }

        # Price / Fabric / Details Inquiry
        if any(w in lower for w in ["price", "cost", "kitna", "offer", "discount", "fabric", "material", "linen", "color"]):
            return {
                "text": "Yeh pure 100% organic handspun linen kurta hai. Aaj festival offer mein flat ₹1,499 mein mil raha hai with free delivery aur Cash on Delivery. Kya main WhatsApp par catalog bhej doon?",
                "thought": "Customer asked about pricing and fabric details. Highlighting the ₹1,499 offer and COD, then suggesting WhatsApp catalog.",
                "intent": "price_inquiry",
                "tool_called": None,
                "tool_args": {},
                "outcome": "interested",
                "call_ended": False
            }

        # WhatsApp Catalog Request / Agreement
        if any(w in lower for w in ["whatsapp", "bhej do", "send", "link", "photo", "haan", "yes", "sure", "dekhna"]):
            return {
                "text": f"Bilkul! Maine aapke WhatsApp number {self.contact_phone} par pura catalog bhej diya hai. Aap aaram se dekh lijiye, have a wonderful day!",
                "thought": "Customer expressed interest in receiving catalog on WhatsApp. Executing send_whatsapp_catalog tool.",
                "intent": "whatsapp_catalog_request",
                "tool_called": "send_whatsapp_catalog",
                "tool_args": {"phone": self.contact_phone, "message_type": "catalog"},
                "outcome": "catalog_sent",
                "call_ended": True
            }

        # General Courtesy / Inquiry
        return {
            "text": "Humare CURATED linen collection mein ivory, sage olive aur charcoal colors available hain, sabhi pe COD available hai. Kya aapko WhatsApp par pictures dekhni hain?",
            "thought": "Addressing customer statement conversationally and steering towards WhatsApp catalog.",
            "intent": "product_inquiry",
            "tool_called": None,
            "tool_args": {},
            "outcome": "interested",
            "call_ended": False
        }

    def generate_summary(self) -> Dict[str, Any]:
        """Generates summary and definitive outcome for the call record."""
        turns_count = len(self.history)
        outcome = self.recorded_outcome or "interested"

        if outcome == "order_confirmed":
            summary = f"Spoke with {self.contact_name}. Customer placed order for CURATED Linen Kurta on Cash on Delivery."
        elif outcome == "catalog_sent":
            summary = f"Spoke with {self.contact_name}. Shared CURATED new drop catalog and photos on WhatsApp ({self.contact_phone})."
        elif outcome == "callback_requested":
            summary = f"Spoke with {self.contact_name}. Customer requested callback at a later time."
        elif outcome == "not_interested":
            summary = f"Spoke with {self.contact_name}. Customer declined product offer."
        elif outcome == "do_not_call":
            summary = f"Spoke with {self.contact_name}. Added to Do Not Call registry."
        else:
            summary = f"Outbound conversation held with {self.contact_name}. Status: {outcome}."

        return {
            "summary": summary,
            "outcome": outcome,
            "duration_sec": max(15, turns_count * 6)
        }
