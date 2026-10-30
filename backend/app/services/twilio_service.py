import logging
from typing import Optional
from twilio.rest import Client
from twilio.twiml.voice_response import VoiceResponse, Connect, Stream
from app.config import settings

logger = logging.getLogger(__name__)

class TwilioService:
    def __init__(self):
        self.account_sid = settings.TWILIO_ACCOUNT_SID
        self.auth_token = settings.TWILIO_AUTH_TOKEN
        self.phone_number = settings.TWILIO_PHONE_NUMBER
        self.client = None

        if self.account_sid and self.auth_token:
            try:
                self.client = Client(self.account_sid, self.auth_token)
            except Exception as e:
                logger.error(f"Failed to initialize Twilio client: {e}")

    def generate_twiml(self, call_id: str, contact_id: str, campaign_id: str) -> str:
        """
        Generates TwiML connecting the call directly to our bidirectional 
        WebSocket Media Stream endpoint (/twilio/media).
        """
        response = VoiceResponse()
        connect = Connect()
        
        # Build WebSocket URL from configured base URL
        ws_base = settings.TWILIO_WEBHOOK_URL.replace("https://", "wss://").replace("http://", "ws://")
        stream_url = f"{ws_base}/twilio/media"
        
        stream = Stream(url=stream_url)
        stream.parameter(name="callId", value=call_id)
        stream.parameter(name="contactId", value=contact_id)
        stream.parameter(name="campaignId", value=campaign_id)
        
        connect.append(stream)
        response.append(connect)
        return str(response)

    async def place_call(
        self,
        to_phone: str,
        call_id: str,
        contact_id: str,
        campaign_id: str
    ) -> Optional[str]:
        """
        Initiates outbound phone call via Twilio Programmable Voice.
        Returns Twilio Call SID if successful.
        """
        if not self.client or not self.phone_number:
            logger.info(f"[SIMULATED CALL] Dialing {to_phone} for call_id={call_id}")
            return f"SIM_CA_{call_id[:12]}"

        try:
            # Twilio will fetch the TwiML from /twilio/voice
            voice_url = f"{settings.TWILIO_WEBHOOK_URL}/twilio/voice?call_id={call_id}&contact_id={contact_id}&campaign_id={campaign_id}"
            status_callback_url = f"{settings.TWILIO_WEBHOOK_URL}/twilio/status?call_id={call_id}"

            call = self.client.calls.create(
                to=to_phone,
                from_=self.phone_number,
                url=voice_url,
                status_callback=status_callback_url,
                status_callback_event=["initiated", "ringing", "answered", "completed"],
                status_callback_method="POST"
            )
            logger.info(f"Twilio call initiated: SID={call.sid} to {to_phone}")
            return call.sid
        except Exception as e:
            logger.error(f"Twilio call creation failed for {to_phone}: {e}")
            return None
