import json
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

# Tool declarations for Gemini
AGENT_TOOLS = [
    {
        "name": "confirm_order",
        "description": "Call this when the customer explicitly agrees to place an order. Always confirm product, quantity, and customer email first.",
        "parameters": {
            "type": "object",
            "properties": {
                "product": {"type": "string", "description": "The name or ID of the product being ordered."},
                "quantity": {"type": "integer", "description": "The quantity ordered (usually 1 or more)."},
                "email": {"type": "string", "description": "The customer's email address to send the secure delivery details form."}
            },
            "required": ["product", "quantity", "email"]
        }
    },
    {
        "name": "schedule_callback",
        "description": "Call this when the customer asks to be called back at a specific time (e.g. 'call in 2 days', 'call at 4 PM tomorrow').",
        "parameters": {
            "type": "object",
            "properties": {
                "due_at_iso": {"type": "string", "description": "Target callback datetime in ISO 8601 format with IST timezone (+05:30) or UTC (Z)."},
                "reason": {"type": "string", "description": "Brief reason for callback, e.g. 'Customer is driving', 'Wants to check size chart'."}
            },
            "required": ["due_at_iso", "reason"]
        }
    },
    {
        "name": "send_email",
        "description": "Sends an informational or delivery details email to the customer.",
        "parameters": {
            "type": "object",
            "properties": {
                "email_type": {"type": "string", "enum": ["order_details", "product_brochure", "discount_coupon"], "description": "Type of email to send."}
            },
            "required": ["email_type"]
        }
    },
    {
        "name": "send_whatsapp",
        "description": "Sends a product link, size guide, or payment link to the customer on WhatsApp.",
        "parameters": {
            "type": "object",
            "properties": {
                "message_type": {"type": "string", "enum": ["product_info", "payment_link", "size_chart"], "description": "Type of WhatsApp message."}
            },
            "required": ["message_type"]
        }
    },
    {
        "name": "set_outcome",
        "description": "Records the final qualified outcome of the call.",
        "parameters": {
            "type": "object",
            "properties": {
                "outcome": {
                    "type": "string",
                    "enum": [
                        "order_confirmed",
                        "interested",
                        "callback_requested",
                        "not_interested",
                        "no_answer",
                        "wrong_number",
                        "do_not_call"
                    ],
                    "description": "The definitive outcome category."
                },
                "notes": {"type": "string", "description": "Brief context or qualification notes."}
            },
            "required": ["outcome"]
        }
    }
]

class VoiceAgentLLM:
    """
    Manages conversational intelligence for BARTA ai voice calls,
    including system prompt injection, history, and tool execution.
    """

    def __init__(
        self,
        contact_name: str,
        contact_phone: str,
        contact_email: Optional[str],
        preferred_language: str,
        product_info: Dict[str, Any],
        campaign_goal: str,
        previous_call_context: Optional[str] = None,
        tool_handler: Optional[Callable[[str, Dict[str, Any]], Awaitable[Dict[str, Any]]]] = None
    ):
        self.contact_name = contact_name
        self.contact_phone = contact_phone
        self.contact_email = contact_email or ""
        self.preferred_language = preferred_language or "hinglish"
        self.product_info = product_info
        self.campaign_goal = campaign_goal
        self.previous_call_context = previous_call_context
        self.tool_handler = tool_handler

        self.history: List[Dict[str, Any]] = []
        self.recorded_outcome: Optional[str] = None
        self.recorded_notes: Optional[str] = None
        self.call_ended: bool = False

        self._init_gemini()

    def _init_gemini(self):
        self.client = None
        if settings.GEMINI_API_KEY and genai:
            try:
                self.client = genai.Client(api_key=settings.GEMINI_API_KEY)
            except Exception as e:
                logger.warning(f"Failed to initialize Gemini Client: {e}. Will use mock dialogue agent.")

    def _build_system_prompt(self) -> str:
        current_time_ist = datetime.now(IST).strftime("%Y-%m-%d %H:%M:%S IST")
        product_json = json.dumps(self.product_info, indent=2)

        return f"""You are 'BARTA', an empathetic, polite, and natural outbound AI voice sales assistant calling on behalf of 'CURATED India' (curatedindia.vercel.app).
Current local time: {current_time_ist}

TARGET CONTACT:
- Name: {self.contact_name}
- Phone: {self.contact_phone}
- Email: {self.contact_email or 'Not yet on file (must ask politely if confirming an order)'}
- Language preference: {self.preferred_language}

CAMPAIGN GOAL:
{self.campaign_goal}

OFFICIAL PRODUCT RECORD (STRICT GROUND TRUTH - NEVER INVENT PRICES, SIZES, OR FEATURES OUTSIDE THIS):
{product_json}

{f"PREVIOUS CALL CONTEXT (CALLBACK): {self.previous_call_context}" if self.previous_call_context else ""}

CRITICAL BEHAVIOR RULES FOR VOICE:
1. IDENTIFY AS AUTOMATED: In your opening sentence, politely state you are BARTA, an automated assistant from CURATED India, and check if it's a good time to speak.
2. CONCISE VOICE TURNS: Keep turns SHORT (1 to 2 spoken sentences maximum). Speak naturally. Do not lecture. Ask ONE simple question at a time.
3. LANGUAGE & CODE-MIXING:
   - If preferred language is Hinglish, speak natural contemporary Indian Hinglish (e.g., "Namaste {self.contact_name} ji! Main BARTA bol raha hoon CURATED India se...").
   - If customer speaks Hindi, respond in pure polite Hindi.
   - If customer speaks English, respond in fluent polite English.
   - Adapt seamlessly if the customer switches languages.
4. ABSOLUTE TRUTHFULNESS: Only quote prices, discounts (Festival price ₹1,499 vs regular ₹1,899), colors, and sizes that are strictly in the product record.
5. NO PRESSURE: If the customer says "not interested", "busy right now", or "don't call again":
   - If "don't call": call tool `set_outcome(outcome="do_not_call", notes="Customer requested DNC")`, politely say goodbye and end.
   - If "not interested": call tool `set_outcome(outcome="not_interested")`, say thank you and end.
   - If "call later / busy": ask for their preferred time, calculate the exact IST ISO timestamp, and call `schedule_callback(due_at_iso=..., reason=...)`.
6. ORDER CONFIRMATION PROTOCOL:
   - When the customer agrees to purchase, repeat back: product name, quantity, and their email address.
   - Once they confirm, IMMEDIATELY invoke the tool `confirm_order(product=..., quantity=..., email=...)`.
   - Tell them: "Great! Maine aapke email par order details aur delivery address ka secure link bhej diya hai. Aap wahan Cash on Delivery ya Online pay select kar sakte hain."
   - Then call `set_outcome(outcome="order_confirmed")`.
7. END OF CALL: Once a definitive outcome is reached or conversation ends, conclude gracefully.
"""

    def get_initial_greeting(self) -> str:
        """Returns the natural initial greeting disclosing the automated assistant."""
        if self.previous_call_context:
            return (
                f"Namaste {self.contact_name} ji! Main BARTA automated voice assistant bol raha hoon CURATED India se. "
                f"Aapne callback request kiya tha, kya abhi baat karne ke liye 2 minute hain?"
            )
        
        if self.preferred_language.lower() == "english":
            return (
                f"Hello {self.contact_name}! This is BARTA, an automated assistant calling from CURATED India. "
                f"Do you have a couple of minutes to talk about our exclusive festive collection?"
            )
        else: # Hinglish / Hindi default
            return (
                f"Namaste {self.contact_name} ji! Main BARTA automated assistant bol raha hoon CURATED India se. "
                f"Kya abhi baat karne ke liye 2 minute ka samay hai?"
            )

    async def generate_response(self, user_transcript: str) -> Dict[str, Any]:
        """
        Processes caller speech and generates agent response + handles tool calls.
        Returns {"text": str, "tool_called": str|None, "outcome": str|None, "call_ended": bool}
        """
        self.history.append({"speaker": "user", "text": user_transcript, "timestamp": datetime.now(timezone.utc).isoformat()})

        # If Gemini is configured, use it with structured prompt
        if self.client:
            try:
                system_instruction = self._build_system_prompt()
                chat_context = "\n".join([f"{t['speaker'].upper()}: {t['text']}" for t in self.history])
                prompt = f"{system_instruction}\n\nCONVERSATION HISTORY:\n{chat_context}\n\nProduce the next natural, short (1-2 sentences) voice response in the appropriate language (Hindi/English/Hinglish):"
                
                resp = self.client.models.generate_content(
                    model=settings.GEMINI_MODEL,
                    contents=prompt
                )
                response_text = resp.text.strip() if resp.text else ""
                tool_called_name = None

                local_tool, tool_args = self._detect_intent_locally(user_transcript)
                if local_tool:
                    tool_called_name = local_tool
                    if self.tool_handler:
                        await self.tool_handler(local_tool, tool_args)

                self.history.append({
                    "speaker": "agent",
                    "text": response_text,
                    "timestamp": datetime.now(timezone.utc).isoformat()
                })

                return {
                    "text": response_text,
                    "tool_called": tool_called_name,
                    "outcome": self.recorded_outcome,
                    "call_ended": self.call_ended
                }
            except Exception as e:
                logger.error(f"Error calling Gemini: {e}. Falling back to dialogue engine.")

        # Intelligent dialogue fallback (handles natural Hindi/English/Hinglish flow)
        fallback_res = await self._dialogue_engine(user_transcript)
        self.history.append({
            "speaker": "agent",
            "text": fallback_res["text"],
            "timestamp": datetime.now(timezone.utc).isoformat()
        })
        return fallback_res

    def _detect_intent_locally(self, text: str) -> tuple[Optional[str], Dict[str, Any]]:
        lower = text.lower()
        now_ist = datetime.now(IST)

        # Do Not Call
        if any(w in lower for w in ["do not call", "dnc", "kabhi call mat karna", "stop calling", "remove my number", "number hatao"]):
            self.recorded_outcome = "do_not_call"
            self.call_ended = True
            return "set_outcome", {"outcome": "do_not_call", "notes": "Requested DNC"}

        # Callback requested
        if any(w in lower for w in ["call me later", "call after", "busy right now", "baad me call karo", "kal call karo", "parso", "kal subah", "kal shaam", "kal dopahar", "drive kar raha"]):
            due_at = now_ist + timedelta(days=1, hours=2)
            self.recorded_outcome = "callback_requested"
            self.call_ended = True
            return "schedule_callback", {"due_at_iso": due_at.isoformat(), "reason": text[:100]}

        # Order confirmation
        if any(w in lower for w in ["order confirm", "book kar do", "bhej do", "yes buy", "i want to buy", "order karna hai", "yes confirm", "kharidna hai", "cod pe bhej do"]):
            self.recorded_outcome = "order_confirmed"
            return "confirm_order", {
                "product": self.product_info.get("name", "CURATED Minimalist Linen Kurta"),
                "quantity": 1,
                "email": self.contact_email or "customer@example.com"
            }

        # Not interested
        if any(w in lower for w in ["not interested", "nahi chahiye", "rehne do", "no thanks", "bilkul nahi", "interest nahi hai"]):
            self.recorded_outcome = "not_interested"
            self.call_ended = True
            return "set_outcome", {"outcome": "not_interested", "notes": "Customer declined politely"}

        return None, {}

    async def _dialogue_engine(self, user_text: str) -> Dict[str, Any]:
        """Built-in conversational policy for smooth demo and offline execution."""
        lower = user_text.lower()
        tool_name, tool_args = self._detect_intent_locally(user_text)

        if tool_name and self.tool_handler:
            await self.tool_handler(tool_name, tool_args)

        # 1. Do Not Call
        if self.recorded_outcome == "do_not_call":
            return {
                "text": "Bilkul samajh gaya. Maine aapka number Do Not Call list me add kar diya hai. Aage se koi call nahi aayegi. Shukriya.",
                "tool_called": "set_outcome",
                "outcome": "do_not_call",
                "call_ended": True
            }

        # 2. Not interested
        if self.recorded_outcome == "not_interested":
            return {
                "text": "Koi baat nahi ji! Apna samay dene ke liye shukriya. Have a great day!",
                "tool_called": "set_outcome",
                "outcome": "not_interested",
                "call_ended": True
            }

        # 3. Callback
        if self.recorded_outcome == "callback_requested":
            return {
                "text": "Zaroor! Maine aapki callback request schedule kar li hai. Hum aapko designated time par dubara call karenge. Dhanyawad!",
                "tool_called": "schedule_callback",
                "outcome": "callback_requested",
                "call_ended": True
            }

        # 4. Order Confirmation
        if self.recorded_outcome == "order_confirmed":
            product_name = self.product_info.get("name", "CURATED Minimalist Linen Kurta")
            email = self.contact_email or "customer@example.com"
            return {
                "text": f"Bahut badhiya! Maine aapka {product_name} confirm kar liya hai. Delivery address aur payment option ka link aapke email {email} par bhej diya gaya hai. CURATED India chunne ke liye shukriya!",
                "tool_called": "confirm_order",
                "outcome": "order_confirmed",
                "call_ended": True
            }

        # 5. Price / Discount Question
        if any(w in lower for w in ["price", "cost", "kitne ka hai", "discount", "offer", "rate"]):
            price = self.product_info.get("discount_price", 1499)
            reg_price = self.product_info.get("price", 1899)
            return {
                "text": f"Yeh 100% pure organic linen kurta regular price ₹{int(reg_price)} ka hai, lekin aaj exclusive festival offer me yeh sirf ₹{int(price)} me mil raha hai with free delivery across India. Kya main aapka order book kar doon?",
                "tool_called": None,
                "outcome": "interested",
                "call_ended": False
            }

        # 6. Colors & Sizes
        if any(w in lower for w in ["size", "color", "colour", "range", "fabric", "material"]):
            return {
                "text": "Yeh kurta pure organic linen se bana hai aur Small se lekar Double XL tak available hai. Colors me Ivory, Olive Green, Charcoal Slate aur Earthy Ochre available hain. Aap kaun sa color prefer karenge?",
                "tool_called": None,
                "outcome": "interested",
                "call_ended": False
            }

        # 7. Website / Link / More info
        if any(w in lower for w in ["website", "link", "photo", "whatsapp", "dekhna hai"]):
            if self.tool_handler:
                await self.tool_handler("send_whatsapp", {"message_type": "product_info"})
            return {
                "text": "Maine CURATED India ka link aur photos aapke WhatsApp aur SMS par share kar diye hain. Aap check karke batayein, kya abhi aapka order book karein?",
                "tool_called": "send_whatsapp",
                "outcome": "interested",
                "call_ended": False
            }

        # 8. General affirmative (Haan / Yes / Tell me more)
        if any(w in lower for w in ["haan", "yes", "batao", "sure", "theek hai", "okay", "bolo"]):
            return {
                "text": "CURATED India ka yeh festive pure linen kurta breathable aur stylish hai. Aaj flat ₹400 off ke saath sirf ₹1,499 me mil raha hai with Cash on Delivery option. Kya main aapka piece reserve kar loon?",
                "tool_called": None,
                "outcome": "interested",
                "call_ended": False
            }

        # Default fallback turn
        return {
            "text": "Ji bilkul, CURATED India ke exclusive collection me pure linen kurtas available hain. Agar aap chahein toh main delivery details ka form aapko email ya WhatsApp par bhej sakta hoon. Kya aap interested hain?",
            "tool_called": None,
            "outcome": self.recorded_outcome or "interested",
            "call_ended": False
        }

    def generate_summary(self) -> Dict[str, Any]:
        """Generates a 2-3 sentence summary and extracts the definitive outcome."""
        turns_count = len(self.history)
        outcome = self.recorded_outcome or ("order_confirmed" if any("confirm" in t.get("text", "").lower() for t in self.history) else "interested" if turns_count > 2 else "no_answer")

        if outcome == "order_confirmed":
            summary = f"Customer {self.contact_name} expressed high interest and confirmed an order for CURATED Linen Kurta. Order verification email dispatched with secure address form."
        elif outcome == "callback_requested":
            summary = f"Customer {self.contact_name} requested a callback at a later time. Scheduled successfully in the system queue."
        elif outcome == "do_not_call":
            summary = f"Customer {self.contact_name} asked not to be contacted again. Contact permanently marked as DNC."
        elif outcome == "not_interested":
            summary = f"Customer {self.contact_name} politely declined the product offer. Call concluded without pressure."
        else:
            summary = f"Outbound conversation held with {self.contact_name}. Customer discussed product details and pricing."

        return {
            "summary": summary,
            "outcome": outcome,
            "duration_sec": turns_count * 5
        }
