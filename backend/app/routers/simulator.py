import io
import csv
import uuid
import logging
from datetime import datetime, timezone
from typing import Optional, Dict, Any, List
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db, AsyncSessionLocal
from app.models import Campaign, Contact, Call, Product, Order, Callback, Message
from app.services.llm_agent import VoiceAgentLLM
from app.services.order_service import OrderService
from app.services.gnani_tts import GnaniTimbreTTS

router = APIRouter(prefix="/simulator", tags=["Simulator"])
logger = logging.getLogger(__name__)
tts_service = GnaniTimbreTTS()

class StartSimulationRequest(BaseModel):
    contact_name: str = "Aarav Sharma"
    contact_phone: str = "+919876543210"
    contact_email: Optional[str] = "aarav.sharma@example.com"
    preferred_language: str = "hinglish"
    campaign_id: Optional[str] = None

class UserSpeechRequest(BaseModel):
    session_id: str
    user_transcript: str

# In-memory active simulator sessions
active_sim_sessions: Dict[str, Dict[str, Any]] = {}

@router.post("/start")
async def start_simulated_call(
    payload: StartSimulationRequest,
    db: AsyncSession = Depends(get_db)
):
    session_id = str(uuid.uuid4())

    # Get campaign & product
    campaign = None
    if payload.campaign_id:
        c_res = await db.execute(select(Campaign).where(Campaign.id == payload.campaign_id))
        campaign = c_res.scalars().first()

    if not campaign:
        c_all = await db.execute(select(Campaign))
        campaign = c_all.scalars().first()

    # Product
    p_all = await db.execute(select(Product))
    product = p_all.scalars().first()

    # Create temporary contact if not existing
    contact = Contact(
        campaign_id=campaign.id if campaign else "default-camp",
        name=payload.contact_name,
        phone=payload.contact_phone,
        email=payload.contact_email,
        language=payload.preferred_language,
        status="dialing"
    )
    db.add(contact)
    await db.commit()
    await db.refresh(contact)

    # Create call record
    call = Call(
        contact_id=contact.id,
        campaign_id=campaign.id if campaign else "default-camp",
        status="in-progress",
        started_at=datetime.now(timezone.utc)
    )
    db.add(call)
    await db.commit()
    await db.refresh(call)

    async def sim_tool_handler(tool_name: str, args: Dict[str, Any]) -> Dict[str, Any]:
        async with AsyncSessionLocal() as session:
            if tool_name == "confirm_order":
                await OrderService.create_order_from_call(
                    contact_id=contact.id,
                    call_id=call.id,
                    product_id=product.id if product else "default",
                    quantity=args.get("quantity", 1),
                    email=args.get("email", contact.email or "customer@example.com"),
                    db=session
                )
            elif tool_name == "schedule_callback":
                due_at_str = args.get("due_at_iso")
                try:
                    due_at = datetime.fromisoformat(due_at_str.replace("Z", "+00:00"))
                except Exception:
                    due_at = datetime.now(timezone.utc)
                cb = Callback(
                    contact_id=contact.id,
                    source_call_id=call.id,
                    due_at=due_at,
                    reason=args.get("reason", "Customer requested callback"),
                    status="pending"
                )
                session.add(cb)
                await session.commit()
            elif tool_name == "set_outcome":
                outcome = args.get("outcome")
                if outcome == "do_not_call":
                    c_res = await session.execute(select(Contact).where(Contact.id == contact.id))
                    c = c_res.scalars().first()
                    if c:
                        c.status = "dnc"
                        await session.commit()
        return {"status": "success"}

    agent = VoiceAgentLLM(
        contact_name=payload.contact_name,
        contact_phone=payload.contact_phone,
        contact_email=payload.contact_email,
        preferred_language=payload.preferred_language,
        product_info=product.details if product else {},
        campaign_goal=campaign.goal if campaign else "Sell CURATED Linen Kurta",
        tool_handler=sim_tool_handler
    )

    greeting = agent.get_initial_greeting()
    agent.history.append({
        "speaker": "agent",
        "text": greeting,
        "timestamp": datetime.now(timezone.utc).isoformat()
    })

    # Synthesize opening line using Gnani Timbre TTS (Voice: Shubham)
    audio_base64 = None
    try:
        audio_base64 = await tts_service.synthesize_wav_base64(greeting, voice="Shubham")
    except Exception as e:
        logger.error(f"Failed to synthesize opening audio for simulator: {e}")

    active_sim_sessions[session_id] = {
        "agent": agent,
        "call_id": call.id,
        "contact_id": contact.id,
        "campaign_id": campaign.id if campaign else None
    }

    return {
        "session_id": session_id,
        "call_id": call.id,
        "greeting": greeting,
        "audio_base64": audio_base64,
        "audio_format": "audio/wav",
        "voice": "Shubham",
        "transcript": agent.history
    }

@router.post("/turn")
async def simulated_turn(
    payload: UserSpeechRequest,
    db: AsyncSession = Depends(get_db)
):
    session_data = active_sim_sessions.get(payload.session_id)
    if not session_data:
        raise HTTPException(status_code=404, detail="Simulation session not found")

    agent: VoiceAgentLLM = session_data["agent"]
    call_id = session_data["call_id"]

    response = await agent.generate_response(payload.user_transcript)
    reply_text = response.get("text", "")

    # Synthesize agent reply using Gnani Timbre TTS (Voice: Shubham)
    audio_base64 = None
    if reply_text:
        try:
            audio_base64 = await tts_service.synthesize_wav_base64(reply_text, voice="Shubham")
        except Exception as e:
            logger.error(f"Failed to synthesize reply audio for simulator turn: {e}")

    # Check if call concluded
    if response.get("call_ended"):
        summary_info = agent.generate_summary()
        res = await db.execute(select(Call).where(Call.id == call_id))
        call = res.scalars().first()
        if call:
            call.status = "completed"
            call.ended_at = datetime.now(timezone.utc)
            call.duration_sec = summary_info.get("duration_sec", 25)
            call.outcome = summary_info.get("outcome")
            call.summary = summary_info.get("summary")
            call.transcript = agent.history
            await db.commit()

        # Clean session
        active_sim_sessions.pop(payload.session_id, None)

    return {
        "agent_reply": reply_text,
        "audio_base64": audio_base64,
        "audio_format": "audio/wav",
        "voice": "Shubham",
        "tool_called": response.get("tool_called"),
        "outcome": response.get("outcome"),
        "call_ended": response.get("call_ended", False),
        "transcript": agent.history
    }

@router.post("/parse-csv")
async def parse_contacts_csv(file: UploadFile = File(...)):
    """
    Parses an uploaded CSV file of contacts for the Call Simulator.
    Extracts name, phone, email, language, and notes.
    """
    if not file.filename.lower().endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only .csv files are supported.")

    content = await file.read()
    try:
        text = content.decode("utf-8-sig")
    except UnicodeDecodeError:
        text = content.decode("latin-1")

    reader = csv.DictReader(io.StringIO(text))
    contacts = []
    for row in reader:
        norm = {k.strip().lower(): (v.strip() if v else "") for k, v in row.items() if k}
        name = norm.get("name") or norm.get("contact_name") or norm.get("full_name") or norm.get("customer") or "Unknown"
        phone = norm.get("phone") or norm.get("contact_phone") or norm.get("mobile") or norm.get("number") or ""
        email = norm.get("email") or norm.get("contact_email") or ""
        language = norm.get("language") or norm.get("lang") or "hinglish"
        notes = norm.get("notes") or norm.get("context") or ""

        if phone or name != "Unknown":
            contacts.append({
                "contact_name": name,
                "contact_phone": phone,
                "contact_email": email,
                "preferred_language": language,
                "notes": notes
            })

    if not contacts:
        raise HTTPException(status_code=400, detail="No valid contact rows found in CSV.")

    return {
        "contacts": contacts,
        "count": len(contacts)
    }

