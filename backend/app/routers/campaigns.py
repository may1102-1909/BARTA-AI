import io
import csv
import re
from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from pydantic import BaseModel
from sqlalchemy import select, func, and_, or_, desc
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.models import Campaign, Contact, Call, Product, Order
from app.services.dispatcher import dispatcher

router = APIRouter(prefix="/campaigns", tags=["Campaigns"])

class CampaignCreate(BaseModel):
    name: str
    product_id: Optional[str] = "curated-linen-kurta-01"
    goal: str = "Introduce the CURATED Minimalist Linen Kurta festive offer and confirm orders."
    max_concurrent: int = 1
    window_start: str = "09:00"
    window_end: str = "20:00"
    retry_limit: int = 2

class CampaignResponse(BaseModel):
    id: str
    name: str
    product_id: str
    goal: str
    max_concurrent: int
    window_start: str
    window_end: str
    retry_limit: int
    status: str
    created_at: datetime
    total_contacts: int = 0
    total_calls: int = 0
    orders_count: int = 0

@router.get("")
async def list_campaigns(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Campaign).order_by(desc(Campaign.created_at)))
    campaigns = result.scalars().all()
    
    output = []
    for camp in campaigns:
        # Count contacts
        c_res = await db.execute(select(func.count(Contact.id)).where(Contact.campaign_id == camp.id))
        total_contacts = c_res.scalar() or 0

        # Count calls
        calls_res = await db.execute(select(func.count(Call.id)).where(Call.campaign_id == camp.id))
        total_calls = calls_res.scalar() or 0

        # Count confirmed orders
        orders_res = await db.execute(
            select(func.count(Order.id))
            .join(Contact, Order.contact_id == Contact.id)
            .where(Contact.campaign_id == camp.id)
        )
        orders_count = orders_res.scalar() or 0

        output.append({
            "id": camp.id,
            "name": camp.name,
            "product_id": camp.product_id,
            "goal": camp.goal,
            "max_concurrent": camp.max_concurrent,
            "window_start": camp.window_start,
            "window_end": camp.window_end,
            "retry_limit": camp.retry_limit,
            "status": camp.status,
            "created_at": camp.created_at.isoformat() if camp.created_at else None,
            "total_contacts": total_contacts,
            "total_calls": total_calls,
            "orders_count": orders_count
        })
    return output

@router.post("")
async def create_campaign(payload: CampaignCreate, db: AsyncSession = Depends(get_db)):
    # Verify product exists or use default
    prod_res = await db.execute(select(Product).where(Product.id == payload.product_id))
    product = prod_res.scalars().first()
    if not product:
        prod_all = await db.execute(select(Product))
        product = prod_all.scalars().first()

    campaign = Campaign(
        name=payload.name,
        product_id=product.id if product else "default",
        goal=payload.goal,
        max_concurrent=payload.max_concurrent,
        window_start=payload.window_start,
        window_end=payload.window_end,
        retry_limit=payload.retry_limit,
        status="draft"
    )
    db.add(campaign)
    await db.commit()
    await db.refresh(campaign)
    return campaign

@router.get("/{campaign_id}")
async def get_campaign(campaign_id: str, db: AsyncSession = Depends(get_db)):
    camp_res = await db.execute(select(Campaign).where(Campaign.id == campaign_id))
    campaign = camp_res.scalars().first()
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")

    p_res = await db.execute(select(Product).where(Product.id == campaign.product_id))
    product = p_res.scalars().first()

    return {
        "campaign": campaign,
        "product": product
    }

@router.post("/{campaign_id}/start")
async def start_campaign(campaign_id: str):
    await dispatcher.start_campaign(campaign_id)
    return {"status": "success", "message": f"Campaign {campaign_id} started"}

@router.post("/{campaign_id}/pause")
async def pause_campaign(campaign_id: str):
    await dispatcher.pause_campaign(campaign_id)
    return {"status": "success", "message": f"Campaign {campaign_id} paused"}

@router.post("/{campaign_id}/stop")
async def stop_campaign(campaign_id: str):
    await dispatcher.stop_campaign(campaign_id)
    return {"status": "success", "message": f"Campaign {campaign_id} stopped"}

@router.post("/{campaign_id}/contacts/import")
async def import_contacts_csv(
    campaign_id: str,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db)
):
    """
    Imports contacts from CSV. Expected headers: name, phone (E.164), language (optional), notes (optional), email (optional).
    Rejects invalid rows with clear messages.
    """
    content = await file.read()
    try:
        decoded = content.decode("utf-8-sig")
    except Exception:
        decoded = content.decode("latin-1")

    reader = csv.DictReader(io.StringIO(decoded))
    imported = 0
    rejected = []

    # E.164 phone pattern (e.g. +919876543210 or 10-12 digits)
    phone_pattern = re.compile(r"^\+?[1-9]\d{7,14}$")

    for idx, row in enumerate(reader, start=2): # row 1 is header
        # Normalize keys (strip whitespace, lowercase)
        norm_row = {k.strip().lower(): (v.strip() if v else "") for k, v in row.items() if k}
        name = norm_row.get("name") or norm_row.get("full_name") or norm_row.get("customer_name")
        phone = norm_row.get("phone") or norm_row.get("phone_number") or norm_row.get("mobile")
        email = norm_row.get("email")
        language = norm_row.get("language") or norm_row.get("preferred_language") or "hinglish"
        notes = norm_row.get("notes") or norm_row.get("remark")

        if not name:
            rejected.append({"row": idx, "reason": "Missing contact name"})
            continue

        if not phone:
            rejected.append({"row": idx, "reason": f"Missing phone number for {name}"})
            continue

        # Clean phone
        clean_phone = re.sub(r"[\s\-\(\)]", "", phone)
        if not clean_phone.startswith("+"):
            if len(clean_phone) == 10:
                clean_phone = "+91" + clean_phone
            else:
                clean_phone = "+" + clean_phone

        if not phone_pattern.match(clean_phone):
            rejected.append({"row": idx, "reason": f"Invalid phone format: '{phone}'. Must be valid E.164."})
            continue

        # Add contact
        contact = Contact(
            campaign_id=campaign_id,
            name=name,
            phone=clean_phone,
            email=email if email else None,
            language=language.lower() if language else "hinglish",
            notes=notes,
            status="new"
        )
        db.add(contact)
        imported += 1

    await db.commit()
    return {
        "status": "success",
        "imported_count": imported,
        "rejected_count": len(rejected),
        "rejected_details": rejected[:20]
    }

@router.get("/{campaign_id}/stats")
async def get_campaign_stats(campaign_id: str, db: AsyncSession = Depends(get_db)):
    """
    Returns funnel data and headline counters:
    contacts -> called -> connected -> interested -> order confirmed
    """
    # 1. Contacts
    c_res = await db.execute(select(func.count(Contact.id)).where(Contact.campaign_id == campaign_id))
    total_contacts = c_res.scalar() or 0

    # 2. Called (any call placed)
    calls_res = await db.execute(select(func.count(Call.id)).where(Call.campaign_id == campaign_id))
    total_calls = calls_res.scalar() or 0

    # 3. Connected (duration > 0 or status completed)
    conn_res = await db.execute(
        select(func.count(Call.id)).where(
            and_(
                Call.campaign_id == campaign_id,
                Call.duration_sec > 0
            )
        )
    )
    connected_calls = conn_res.scalar() or 0

    # 4. Interested
    int_res = await db.execute(
        select(func.count(Call.id)).where(
            and_(
                Call.campaign_id == campaign_id,
                Call.outcome.in_(["interested", "order_confirmed", "callback_requested"])
            )
        )
    )
    interested_calls = int_res.scalar() or 0

    # 5. Orders confirmed
    orders_res = await db.execute(
        select(func.count(Call.id)).where(
            and_(
                Call.campaign_id == campaign_id,
                Call.outcome == "order_confirmed"
            )
        )
    )
    orders_confirmed = orders_res.scalar() or 0

    # 6. Callbacks pending
    cb_res = await db.execute(
        select(func.count(Call.id)).where(
            and_(
                Call.campaign_id == campaign_id,
                Call.outcome == "callback_requested"
            )
        )
    )
    callbacks_count = cb_res.scalar() or 0

    # 7. Avg duration
    avg_res = await db.execute(
        select(func.avg(Call.duration_sec)).where(
            and_(Call.campaign_id == campaign_id, Call.duration_sec > 0)
        )
    )
    avg_duration = round(avg_res.scalar() or 0, 1)

    return {
        "funnel": {
            "contacts": total_contacts,
            "called": total_calls,
            "connected": connected_calls,
            "interested": interested_calls,
            "order_confirmed": orders_confirmed
        },
        "counters": {
            "total_calls": total_calls,
            "connected_calls": connected_calls,
            "orders_confirmed": orders_confirmed,
            "callbacks_pending": callbacks_count,
            "avg_duration_sec": avg_duration
        }
    }

