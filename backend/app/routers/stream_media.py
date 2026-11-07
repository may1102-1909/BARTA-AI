import json
import asyncio
import logging
import uuid
from datetime import datetime, timezone, timedelta
from typing import Dict, Any, Optional
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Request
from fastapi.responses import HTMLResponse
from sqlalchemy import select
from app.config import settings
from app.database import AsyncSessionLocal
from app.models import Call, Contact, Campaign, Product, Callback, Message
from app.services.audio_converter import AudioConverter
from app.services.gnani_stt import GnaniPrismaSTT
from app.services.gnani_tts import GnaniTimbreTTS
from app.services.llm_agent import VoiceAgentLLM
from app.services.order_service import OrderService
from app.services.dispatcher import dispatcher

logger = logging.getLogger(__name__)
router = APIRouter(tags=["Telnyx Voice & Media Stream"])
tts_service = GnaniTimbreTTS()

def get_ngrok_host(request: Request) -> str:
    """Extracts ngrok / public domain host without protocol."""
    host = request.headers.get("host", "").strip()
    if host and not host.startswith("localhost") and not host.startswith("127.0.0.1"):
        return host
    pub = settings.PUBLIC_URL.replace("https://", "").replace("http://", "").strip("/")
    return pub if pub else "unstable-roundish-giblet.ngrok-free.dev"

@router.api_route("/answer", methods=["GET", "POST"])
async def answer_incoming_call(request: Request):
    """
    Telnyx hits this endpoint when your softphone dials out or incoming call arrives.
    Returns TeXML to make the agent speak first, then opens the WebSocket stream.
    """
    ngrok_host = get_ngrok_host(request)
    texml_response = f"""<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say voice="alice" language="hi-IN">Hi, main BARTA-AI se baat kar raha hoon. Bataiye, kaise madad kar sakta hoon?</Say>
    <Connect>
        <Stream url="wss://{ngrok_host}/stream" />
    </Connect>
</Response>"""
    return HTMLResponse(content=texml_response, media_type="application/xml")

@router.websocket("/stream")
async def websocket_endpoint(websocket: WebSocket):
    """
    Bidirectional WebSocket media stream for Telnyx TeXML.
    - Telnyx sends 8 kHz μ-law base64 audio.
    - Incoming speech decoded and streamed to Gnani Prisma STT (converted to 16-bit linear PCM).
    - Transcript sent to Gemini LLM for state-machine sales conversation.
    - Agent responses synthesized via Gnani Timbre TTS (Voice: Shubham).
    - Synthesized audio converted to 8 kHz μ-law base64 and streamed back to Telnyx.
    """
    await websocket.accept()
    logger.info("Telnyx /stream WebSocket connected.")

    stream_sid: Optional[str] = None
    call_id: Optional[str] = None
    contact_id: Optional[str] = None
    campaign_id: Optional[str] = None
    agent: Optional[VoiceAgentLLM] = None
    stt: Optional[GnaniPrismaSTT] = None
    is_agent_speaking = False

    async def handle_agent_tool(tool_name: str, args: Dict[str, Any]) -> Dict[str, Any]:
        """Executes LLM tool calls against the database."""
        logger.info(f"Executing tool {tool_name} with args: {args}")
        async with AsyncSessionLocal() as session:
            if tool_name == "confirm_order":
                await OrderService.create_order_from_call(
                    contact_id=contact_id,
                    call_id=call_id,
                    product_id="curated-linen-kurta-01",
                    quantity=args.get("quantity", 1),
                    email=args.get("email", "customer@example.com"),
                    db=session
                )
                return {"status": "success", "message": "Order created and email sent"}

            elif tool_name == "schedule_callback":
                due_at_str = args.get("due_at_iso")
                try:
                    due_at = datetime.fromisoformat(due_at_str.replace("Z", "+00:00"))
                except Exception:
                    due_at = datetime.now(timezone.utc) + timedelta(hours=2)
                
                cb = Callback(
                    contact_id=contact_id,
                    source_call_id=call_id,
                    due_at=due_at,
                    reason=args.get("reason", "Customer requested callback in 2 hours"),
                    status="pending"
                )
                session.add(cb)
                await session.commit()
                logger.info(f"Callback registered in DB for {due_at} (contact_id={contact_id})")
                return {"status": "success", "message": "Callback scheduled"}

            elif tool_name in ["send_whatsapp_catalog", "send_whatsapp"]:
                phone = args.get("phone") or (contact.phone if contact else "")
                catalog_body = (
                    "🌟 *CURATED India - New Drop Collection*\n\n"
                    "Explore our pure organic minimalist linen kurtas starting at ₹1,499:\n"
                    "👉 https://curatedindia.vercel.app/catalog\n\n"
                    "Complimentary express shipping across India & Cash on Delivery available!"
                )
                msg = Message(
                    contact_id=contact_id,
                    channel="whatsapp",
                    direction="outbound",
                    body=catalog_body,
                    status="sent"
                )
                session.add(msg)
                await session.commit()
                logger.info(f"WhatsApp catalog queued for {phone}")
                return {"status": "success", "message": "WhatsApp catalog sent"}

            return {"status": "unknown_tool"}

    async def on_stt_transcript(transcript: str, is_final: bool, detected_lang: Optional[str]):
        """Callback fired when Gnani Prisma STT produces user speech."""
        nonlocal is_agent_speaking
        if not transcript or not transcript.strip():
            return

        logger.info(f"Gnani Prisma STT (final={is_final}): '{transcript}'")

        # Barge-in support: If agent is speaking, cancel ongoing agent audio on Telnyx
        if is_agent_speaking and stream_sid:
            logger.info("Barge-in detected! Stopping agent audio.")
            clear_event = AudioConverter.create_clear_event(stream_sid)
            await websocket.send_text(json.dumps(clear_event))
            is_agent_speaking = False

        if is_final and agent:
            # 2. Get text and pass to your LLM
            llm_result = await agent.generate_response(transcript)
            reply_text = llm_result.get("text", "")

            frames = []
            if reply_text and stream_sid:
                is_agent_speaking = True
                # 3. Get text reply and pass to your Gnani.ai TTS (Voice: Shubham)
                audio_ulaw = await tts_service.synthesize(reply_text, voice="Shubham")
                # 4. Convert TTS audio to Base64 mu-law (8000Hz) & chunk to 20ms frames
                frames = AudioConverter.chunk_ulaw(audio_ulaw, frame_ms=20)

                # 5. Send back to Telnyx to play on your softphone
                for frame in frames:
                    if not is_agent_speaking:
                        break # interrupted by barge-in
                    payload_b64 = AudioConverter.bytes_to_base64(frame)
                    response_payload = {
                        "event": "media",
                        "streamSid": stream_sid,
                        "media": {"payload": payload_b64}
                    }
                    await websocket.send_text(json.dumps(response_payload))

                is_agent_speaking = False

            if llm_result.get("call_ended"):
                logger.info("Agent concluded call. Waiting for audio playback to finish before closing stream.")
                playback_wait = max(2.0, (len(frames) * 0.02) + 1.2)
                await asyncio.sleep(playback_wait)
                try:
                    await websocket.close()
                except Exception:
                    pass

    try:
        while True:
            raw_msg = await websocket.receive_text()
            data = json.loads(raw_msg)
            event_type = data.get("event")

            if event_type == "start":
                start_data = data.get("start", {})
                stream_sid = data.get("streamSid") or start_data.get("streamSid") or str(uuid.uuid4())
                call_sid = data.get("callSid") or start_data.get("callSid") or f"telnyx-{uuid.uuid4().hex[:8]}"
                custom_params = start_data.get("customParameters", {})
                call_id = custom_params.get("callId") or str(uuid.uuid4())
                contact_id = custom_params.get("contactId")
                campaign_id = custom_params.get("campaignId")

                print(f"Call connected! Telnyx Stream ID: {stream_sid}, Call ID: {call_id}")
                logger.info(f"Call connected! Telnyx Stream ID: {stream_sid}, Call ID: {call_id}")

                # Load contact & product info from DB
                async with AsyncSessionLocal() as session:
                    contact = None
                    product = None
                    campaign = None

                    if contact_id:
                        c_res = await session.execute(select(Contact).where(Contact.id == contact_id))
                        contact = c_res.scalars().first()
                    if campaign_id:
                        camp_res = await session.execute(select(Campaign).where(Campaign.id == campaign_id))
                        campaign = camp_res.scalars().first()
                    if campaign and campaign.product_id:
                        p_res = await session.execute(select(Product).where(Product.id == campaign.product_id))
                        product = p_res.scalars().first()
                    if not product:
                        p_all = await session.execute(select(Product))
                        product = p_all.scalars().first()

                    # Fallback contact if none provided
                    if not contact:
                        contact = Contact(
                            campaign_id=campaign.id if campaign else "default-camp",
                            name="Tanmay",
                            phone=start_data.get("from") or start_data.get("to") or "",
                            language="hinglish",
                            status="in-progress"
                        )
                        session.add(contact)
                        await session.commit()
                        await session.refresh(contact)
                        contact_id = contact.id

                    # Ensure Call row exists in database
                    call_check = await session.execute(select(Call).where(Call.id == call_id))
                    call_row = call_check.scalars().first()
                    if not call_row:
                        call_row = Call(
                            id=call_id,
                            contact_id=contact.id,
                            campaign_id=campaign.id if campaign else (campaign_id or "default-camp"),
                            twilio_sid=call_sid,
                            status="in-progress",
                            started_at=datetime.now(timezone.utc)
                        )
                        session.add(call_row)
                        await session.commit()

                    # 1. Connect to Gnani Prisma STT
                    stt = GnaniPrismaSTT(on_transcript=on_stt_transcript)
                    await stt.connect()

                    # 2. Initialize Gemini Voice Agent LLM
                    agent = VoiceAgentLLM(
                        contact_name=contact.name if contact else "Tanmay",
                        contact_phone=contact.phone if contact else "",
                        contact_email=contact.email if contact else None,
                        preferred_language=contact.language if contact else "hinglish",
                        product_info=product.details if product else {},
                        campaign_goal=campaign.goal if campaign else "Share new drop details and send WhatsApp catalog",
                        previous_call_context=contact.notes if contact else None,
                        tool_handler=handle_agent_tool
                    )

                    # 3. Record Initial Greeting in LLM Context:
                    # TeXML <Say> speaks first: "Hi, main BARTA-AI se baat kar raha hoon. Bataiye, kaise madad kar sakta hoon?"
                    # We record it in agent history so LLM knows the conversation has started.
                    greeting_text = "Hi, main BARTA-AI se baat kar raha hoon. Bataiye, kaise madad kar sakta hoon?"
                    logger.info(f"Initial greeting active in agent history: '{greeting_text}'")
                    agent.history.append({
                        "speaker": "agent",
                        "text": greeting_text,
                        "timestamp": datetime.now(timezone.utc).isoformat()
                    })

            elif event_type == "media":
                # Audio from softphone/microphone arrives as Base64 encoded mu-law (8kHz)
                media_payload = data.get("media", {}).get("payload", "")
                if media_payload and stt and stt.is_connected:
                    # 1. Decode base64 to mu-law bytes
                    ulaw_bytes = AudioConverter.base64_to_bytes(media_payload)
                    # 2. Convert 8kHz mu-law to 8kHz 16-bit linear PCM for Gnani Prisma STT
                    pcm_bytes = AudioConverter.ulaw_to_pcm16(ulaw_bytes)
                    # 3. Stream to Gnani Prisma STT
                    await stt.send_audio(pcm_bytes)

            elif event_type == "stop":
                print("Call ended.")
                logger.info(f"Telnyx call ended for streamSid={stream_sid}")
                break

    except WebSocketDisconnect:
        logger.info(f"Telnyx WebSocket disconnected for callId={call_id}")
    except Exception as e:
        print(f"WebSocket closed: {e}")
        logger.error(f"Error in Telnyx Media WebSocket: {e}", exc_info=True)
    finally:
        if stt:
            await stt.close()

        # Finalize Call record in database
        if call_id and agent:
            summary_info = agent.generate_summary()
            async with AsyncSessionLocal() as session:
                res = await session.execute(select(Call).where(Call.id == call_id))
                call = res.scalars().first()
                if call:
                    call.status = "completed"
                    call.ended_at = datetime.now(timezone.utc)
                    call.duration_sec = summary_info.get("duration_sec", 15)
                    call.outcome = summary_info.get("outcome")
                    call.summary = summary_info.get("summary")
                    call.transcript = agent.history
                    await session.commit()

                if contact_id:
                    c_res = await session.execute(select(Contact).where(Contact.id == contact_id))
                    c = c_res.scalars().first()
                    if c and c.status != "dnc":
                        c.status = "done"
                        await session.commit()

            if campaign_id:
                dispatcher.on_call_completed(campaign_id, call_id)

