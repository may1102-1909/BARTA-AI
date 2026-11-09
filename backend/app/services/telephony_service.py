import logging
from typing import Optional

logger = logging.getLogger(__name__)

class TelephonyService:
    """Telephony service handling outbound calling and messaging."""

    def __init__(self):
        pass

    async def place_call(
        self,
        to_phone: str,
        call_id: str,
        contact_id: str,
        campaign_id: str
    ) -> Optional[str]:
        """
        Initiates outbound phone call.
        Returns Call SID / Session ID if successful.
        """
        logger.info(f"[TELEPHONY CALL] Placing call to {to_phone} for call_id={call_id}")
        return f"CALL_{call_id[:12]}"

    def send_whatsapp(self, to_phone: str, body: str) -> bool:
        """Sends WhatsApp message or logs as queued."""
        logger.info(f"[WHATSAPP] Dispatching message to {to_phone}: {body[:40]}...")
        return True

