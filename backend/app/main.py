import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, WebSocket
from fastapi.responses import HTMLResponse, Response
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database import init_db
from app.services.scheduler import scheduler
from app.routers import (
    campaigns,
    calls,
    orders,
    callbacks,
    public_forms,
    simulator,
    stream_media
)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("barta_ai")

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing BARTA AI Voice Platform...")
    # 1. Initialize SQLite / PostgreSQL DB & seed products
    await init_db()
    # 2. Start callback scheduler
    scheduler.start()
    logger.info("BARTA AI successfully started.")
    yield
    # Shutdown
    logger.info("Shutting down BARTA AI...")
    scheduler.stop()

app = FastAPI(
    title="BARTA AI - Voice Agent Platform",
    description="Autonomous Outbound AI Voice Agent for B2B & B2C Sales, powered by Gnani AI (Prisma STT & Timbre TTS) and Google Gemini.",
    version="1.0.0",
    lifespan=lifespan
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(campaigns.router)
app.include_router(calls.router)
app.include_router(orders.router)
app.include_router(callbacks.router)
app.include_router(public_forms.router)
app.include_router(simulator.router)
app.include_router(stream_media.router)

@app.api_route("/answer", methods=["GET", "POST"])
async def answer_incoming_call(request: Request):
    """
    Telnyx hits this endpoint when your softphone dials out or a call is received.
    We return TeXML to instruct Telnyx to route bidirectional audio to /stream WebSocket.
    """
    return await stream_media.answer_incoming_call(request)

@app.websocket("/stream")
async def websocket_endpoint(websocket: WebSocket):
    """
    Telnyx bidirectional audio streaming endpoint powered by:
    1. Gnani Timbre TTS (Voice: Shubham) for opening line & speech synthesis.
    2. Gnani Prisma STT for converting user speech to text.
    3. Gemini LLM agent for dialogue management and sales flow.
    """
    await stream_media.websocket_endpoint(websocket)

@app.get("/")
async def root():
    return {
        "platform": "BARTA AI",
        "tagline": "Upload a customer list, press start, and watch orders arrive on your dashboard.",
        "status": "online",
        "gnani_models": {
            "stt": "Gnani Prisma v2.5 / v3",
            "tts": "Gnani Timbre v2.0"
        },
        "llm": settings.GEMINI_MODEL,
        "docs_url": "/docs"
    }

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "gnani_configured": bool(settings.GNANI_API_KEY),
        "gemini_configured": bool(settings.GEMINI_API_KEY),
        "resend_configured": bool(settings.RESEND_API_KEY)
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host=settings.HOST, port=settings.PORT, reload=True)
