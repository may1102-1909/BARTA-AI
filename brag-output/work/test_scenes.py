import math
import os
from PIL import Image, ImageDraw, ImageFont, ImageFilter

WIDTH, HEIGHT = 1920, 1080

# Colors
NAVY_BG = (15, 23, 42)         # #0F172A
SURFACE_BG = (30, 41, 59)      # #1E293B
CARD_BORDER = (51, 65, 85)     # #334155
WHITE = (255, 255, 255)
TEXT_MUTED = (148, 163, 184)   # #94A3B8
TEXT_DIM = (100, 116, 139)     # #64748B
BLUE_ACCENT = (59, 130, 246)   # #3B82F6
CYAN_ACCENT = (56, 189, 248)   # #38BDF8
GREEN_ACCENT = (16, 185, 129)  # #10B981
GREEN_BG = (6, 78, 59)
AMBER_ACCENT = (245, 158, 11)  # #F59E0B
PURPLE_ACCENT = (139, 92, 246) # #8B5CF6

# Fonts
def get_font(name="segoeuib.ttf", size=32):
    try:
        return ImageFont.truetype(f"C:/Windows/Fonts/{name}", size)
    except:
        return ImageFont.load_default()

font_title_huge = get_font("segoeuib.ttf", 96)
font_title_large = get_font("segoeuib.ttf", 52)
font_title_med = get_font("segoeuib.ttf", 36)
font_bold_28 = get_font("segoeuib.ttf", 28)
font_bold_24 = get_font("segoeuib.ttf", 24)
font_bold_22 = get_font("segoeuib.ttf", 22)
font_bold_20 = get_font("segoeuib.ttf", 20)
font_bold_18 = get_font("segoeuib.ttf", 18)
font_bold_16 = get_font("segoeuib.ttf", 16)
font_reg_24 = get_font("segoeui.ttf", 24)
font_reg_20 = get_font("segoeui.ttf", 20)
font_reg_18 = get_font("segoeui.ttf", 18)
font_reg_16 = get_font("segoeui.ttf", 16)
font_mono_22 = get_font("consola.ttf", 22)
font_mono_18 = get_font("consola.ttf", 18)

# Load phone screenshot
phone_raw = Image.open("brag-output/work/phone_blurred.jpg")

os.makedirs("brag-output/work/test_frames", exist_ok=True)

def draw_navbar(draw, active_tab="Overview"):
    # Navbar container
    draw.rectangle([0, 0, WIDTH, 76], fill=(15, 23, 42))
    draw.line([(0, 76), (WIDTH, 76)], fill=CARD_BORDER, width=1)
    
    # Logo
    draw.text((80, 20), "⚡ BARTA AI", fill=WHITE, font=font_bold_28)
    
    # Nav items
    tabs = ["Overview", "Campaigns", "Calls", "Orders", "Simulator"]
    tx = 340
    for tab in tabs:
        if tab == active_tab:
            draw.text((tx, 26), tab, fill=CYAN_ACCENT, font=font_bold_20)
            # Underline
            draw.line([(tx, 66), (tx + 80, 66)], fill=BLUE_ACCENT, width=3)
        else:
            draw.text((tx, 26), tab, fill=TEXT_MUTED, font=font_reg_20)
        tx += 140
        
    # Right pill status
    draw.rounded_rectangle([WIDTH - 280, 18, WIDTH - 80, 58], radius=20, fill=(16, 42, 34), outline=GREEN_ACCENT, width=1)
    draw.ellipse([WIDTH - 262, 33, WIDTH - 250, 45], fill=GREEN_ACCENT)
    draw.text((WIDTH - 240, 26), "SYSTEM LIVE", fill=GREEN_ACCENT, font=font_bold_16)

# Scene 1: Title Card
def render_scene_1(t):
    img = Image.new("RGB", (WIDTH, HEIGHT), NAVY_BG)
    draw = ImageDraw.Draw(img)
    
    draw.ellipse([WIDTH//2 - 450, HEIGHT//2 - 350, WIDTH//2 + 450, HEIGHT//2 + 350], fill=(22, 38, 80))
    
    pill_text = "✦  AUTONOMOUS OUTBOUND VOICE SALES PLATFORM"
    pw = 680
    px = (WIDTH - pw) // 2
    draw.rounded_rectangle([px, 310, px + pw, 356], radius=23, fill=(24, 38, 70), outline=BLUE_ACCENT, width=2)
    draw.text((px + 38, 319), pill_text, fill=CYAN_ACCENT, font=font_bold_20)
    
    title = "BARTA AI"
    bbox = draw.textbbox((0, 0), title, font=font_title_huge)
    tw = bbox[2] - bbox[0]
    draw.text(((WIDTH - tw)//2, 390), title, fill=WHITE, font=font_title_huge)
    
    tagline = "Transforming Customer Contact Lists into Verified Orders with Native Voice AI"
    t_bbox = draw.textbbox((0, 0), tagline, font=font_bold_28)
    draw.text(((WIDTH - (t_bbox[2]-t_bbox[0]))//2, 530), tagline, fill=TEXT_MUTED, font=font_bold_28)
    
    badges = ["⚡ 100% Autonomous Calling", "🗣️ Native Hinglish Dialects", "🚀 Instant Order Link Delivery"]
    bx = 330
    for b in badges:
        draw.rounded_rectangle([bx, 640, bx + 390, 700], radius=16, fill=SURFACE_BG, outline=CARD_BORDER, width=1)
        draw.text((bx + 26, 656), b, fill=WHITE, font=font_bold_20)
        bx += 420
        
    return img

# Scene 2: Problem & Solution / Overview Dashboard
def render_scene_2(t):
    img = Image.new("RGB", (WIDTH, HEIGHT), NAVY_BG)
    draw = ImageDraw.Draw(img)
    draw_navbar(draw, active_tab="Overview")
    
    # Subheader banner
    draw.text((80, 110), "Outbound Sales, Reimagined", fill=WHITE, font=font_title_large)
    draw.text((80, 175), "Eliminate human call centers. BARTA AI dials contact lists with intelligent, natural Hinglish conversations.", fill=TEXT_MUTED, font=font_reg_20)
    
    # Metrics cards
    metrics = [
        ("TOTAL CALLS", "1,420", "+24% this week", BLUE_ACCENT),
        ("CONNECTED RATE", "86.4%", "Industry high answer rate", GREEN_ACCENT),
        ("ORDERS CONVERTED", "312", "₹4,98,000 GMV generated", PURPLE_ACCENT),
        ("CALL CENTERS NEEDED", "0", "100% Autonomous AI loop", CYAN_ACCENT),
    ]
    mx = 80
    for title, val, sub, col in metrics:
        draw.rounded_rectangle([mx, 230, mx + 415, 360], radius=16, fill=SURFACE_BG, outline=CARD_BORDER, width=1)
        draw.text((mx + 28, 250), title, fill=TEXT_MUTED, font=font_bold_16)
        draw.text((mx + 28, 276), val, fill=WHITE, font=font_title_med)
        draw.text((mx + 28, 324), sub, fill=col, font=font_bold_16)
        mx += 445
        
    # Problem vs Solution comparison
    py = 410
    # Problem card
    draw.rounded_rectangle([80, py, 930, py + 360], radius=18, fill=(35, 20, 25), outline=(150, 40, 50), width=2)
    draw.rounded_rectangle([110, py + 25, 340, py + 65], radius=12, fill=(100, 20, 30))
    draw.text((125, py + 32), "TRADITIONAL CALL CENTERS", fill=(255, 180, 180), font=font_bold_16)
    
    probs = [
        "❌ Expensive manual labor ($15/hr per dialing seat)",
        "❌ Inconsistent script execution and agent burnout",
        "❌ Slow scaling: hiring, onboarding, and QA bottlenecks",
        "❌ Manual follow-up: leads go cold before WhatsApp/Email links are sent"
    ]
    y_prob = py + 95
    for p in probs:
        draw.text((110, y_prob), p, fill=(240, 200, 205), font=font_reg_20)
        y_prob += 62
        
    # Solution card
    draw.rounded_rectangle([980, py, 1830, py + 360], radius=18, fill=(15, 45, 38), outline=GREEN_ACCENT, width=2)
    draw.rounded_rectangle([1010, py + 25, 1260, py + 65], radius=12, fill=(10, 80, 50))
    draw.text((1025, py + 32), "THE BARTA AI ADVANTAGE", fill=(180, 255, 210), font=font_bold_16)
    
    sols = [
        "✅ 100% Autonomous AI sales calls at massive scale",
        "✅ Converses fluently in Hinglish & regional Indian accents",
        "✅ Rigorous state machine guarantees sales pitch compliance",
        "✅ Instant order link delivery to inbox/WhatsApp while on the call"
    ]
    y_sol = py + 95
    for s in sols:
        draw.text((1010, y_sol), s, fill=(210, 250, 230), font=font_reg_20)
        y_sol += 62
        
    return img

# Scene 3: Step 1 Campaign Creation Flow
def render_scene_3(t):
    img = Image.new("RGB", (WIDTH, HEIGHT), NAVY_BG)
    draw = ImageDraw.Draw(img)
    draw_navbar(draw, active_tab="Campaigns")
    
    # Modal Card
    mx, my, mw, mh = 260, 105, 1400, 920
    draw.rounded_rectangle([mx, my, mx + mw, my + mh], radius=24, fill=SURFACE_BG, outline=CARD_BORDER, width=2)
    
    # Stepper
    sx = mx + 200
    # Step 1 pill (Active)
    draw.rounded_rectangle([sx, my + 30, sx + 320, my + 80], radius=16, fill=BLUE_ACCENT)
    draw.text((sx + 30, my + 44), "Step 1: Campaign Details", fill=WHITE, font=font_bold_16)
    # Connector
    draw.line([(sx + 335, my + 55), (sx + 445, my + 55)], fill=CARD_BORDER, width=3)
    # Step 2 pill
    draw.rounded_rectangle([sx + 460, my + 30, sx + 780, my + 80], radius=16, fill=(40, 52, 72), outline=CARD_BORDER, width=1)
    draw.text((sx + 490, my + 44), "Step 2: Script & CSV Import", fill=TEXT_MUTED, font=font_bold_16)
    
    # Title
    draw.text((mx + 60, my + 115), "Create New Outbound Campaign", fill=WHITE, font=font_title_med)
    draw.text((mx + 60, my + 165), "Define campaign goals and verify your product storefront URL.", fill=TEXT_MUTED, font=font_reg_18)
    
    # Field 1: Name
    draw.text((mx + 60, my + 215), "Campaign Name", fill=WHITE, font=font_bold_20)
    draw.rounded_rectangle([mx + 60, my + 250, mx + mw - 60, my + 310], radius=12, fill=(20, 28, 45), outline=CARD_BORDER, width=1)
    draw.text((mx + 80, my + 266), "CURATED India - Festive Linen Drop", fill=WHITE, font=font_bold_20)
    
    # Field 2: Goal / Pitch
    draw.text((mx + 60, my + 335), "Sales Pitch / Objective", fill=WHITE, font=font_bold_20)
    draw.rounded_rectangle([mx + 60, my + 370, mx + mw - 60, my + 460], radius=12, fill=(20, 28, 45), outline=CARD_BORDER, width=1)
    draw.text((mx + 80, my + 386), "Highlighting the new fashion drop of Curated India store and checking interest in product details.", fill=WHITE, font=font_reg_18)
    
    # Field 3: Product URL with Verified Badge
    draw.text((mx + 60, my + 485), "Product / Storefront URL", fill=WHITE, font=font_bold_20)
    draw.rounded_rectangle([mx + 60, my + 520, mx + mw - 60, my + 580], radius=12, fill=(20, 28, 45), outline=GREEN_ACCENT, width=1)
    draw.text((mx + 80, my + 536), "https://curatedindia.vercel.app", fill=WHITE, font=font_mono_22)
    # Green Verified Badge inside input
    draw.rounded_rectangle([mx + mw - 250, my + 530, mx + mw - 80, my + 570], radius=10, fill=GREEN_BG, outline=GREEN_ACCENT, width=1)
    draw.text((mx + mw - 235, my + 540), "✓ URL Verified", fill=(200, 255, 220), font=font_bold_16)
    
    # Field 4: Concurrency & Retries
    draw.text((mx + 60, my + 605), "Dialing Concurrency", fill=WHITE, font=font_bold_20)
    draw.rounded_rectangle([mx + 60, my + 640, mx + 600, my + 700], radius=12, fill=(20, 28, 45), outline=CARD_BORDER, width=1)
    draw.text((mx + 80, my + 656), "1 Concurrent Line (Trial Safe)", fill=WHITE, font=font_reg_18)
    
    draw.text((mx + 660, my + 605), "Max Retry Limit", fill=WHITE, font=font_bold_20)
    draw.rounded_rectangle([mx + 660, my + 640, mx + mw - 60, my + 700], radius=12, fill=(20, 28, 45), outline=CARD_BORDER, width=1)
    draw.text((mx + 680, my + 656), "2 Retry Attempts on Busy / Unanswered", fill=WHITE, font=font_reg_18)
    
    # Bottom Button
    btn_x = mx + mw - 420
    draw.rounded_rectangle([btn_x, my + 810, mx + mw - 60, my + 875], radius=14, fill=BLUE_ACCENT)
    draw.text((btn_x + 36, my + 830), "Next: Script Customization →", fill=WHITE, font=font_bold_20)
    
    return img

# Scene 4: Step 2 CSV Ingestion
def render_scene_4(t):
    img = Image.new("RGB", (WIDTH, HEIGHT), NAVY_BG)
    draw = ImageDraw.Draw(img)
    draw_navbar(draw, active_tab="Campaigns")
    
    mx, my, mw, mh = 260, 105, 1400, 920
    draw.rounded_rectangle([mx, my, mx + mw, my + mh], radius=24, fill=SURFACE_BG, outline=CARD_BORDER, width=2)
    
    # Stepper
    sx = mx + 200
    # Step 1 pill (Completed)
    draw.rounded_rectangle([sx, my + 30, sx + 320, my + 80], radius=16, fill=(16, 80, 50), outline=GREEN_ACCENT, width=1)
    draw.text((sx + 30, my + 44), "✓ Step 1: Details Saved", fill=(200, 255, 220), font=font_bold_16)
    # Connector
    draw.line([(sx + 335, my + 55), (sx + 445, my + 55)], fill=GREEN_ACCENT, width=3)
    # Step 2 pill (Active)
    draw.rounded_rectangle([sx + 460, my + 30, sx + 780, my + 80], radius=16, fill=BLUE_ACCENT)
    draw.text((sx + 490, my + 44), "Step 2: Script & CSV Import", fill=WHITE, font=font_bold_16)
    
    # Option selected: No, generate with AI
    draw.text((mx + 60, my + 115), "AI Script Configuration", fill=WHITE, font=font_title_med)
    draw.rounded_rectangle([mx + 60, my + 160, mx + mw - 60, my + 245], radius=14, fill=(24, 38, 70), outline=BLUE_ACCENT, width=2)
    draw.ellipse([mx + 85, my + 190, mx + 105, my + 210], fill=CYAN_ACCENT)
    draw.text((mx + 120, my + 175), "No, generate with AI (Hinglish Voice Script Auto-Drafted)", fill=WHITE, font=font_bold_20)
    draw.text((mx + 120, my + 208), "Branching logic: Busy check -> Language comfort -> Fashion drop pitch -> WhatsApp/Email closing", fill=TEXT_MUTED, font=font_reg_16)
    
    # CSV Upload Box
    draw.text((mx + 60, my + 270), "Customer Contact List (CSV)", fill=WHITE, font=font_title_med)
    draw.rounded_rectangle([mx + 60, my + 310, mx + mw - 60, my + 440], radius=16, fill=(18, 25, 42), outline=CARD_BORDER, width=2)
    draw.text((mx + 90, my + 335), "📄  Uploaded: barta_campaign_contacts.csv", fill=WHITE, font=font_bold_20)
    draw.rounded_rectangle([mx + mw - 320, my + 330, mx + mw - 90, my + 370], radius=10, fill=GREEN_BG, outline=GREEN_ACCENT, width=1)
    draw.text((mx + mw - 300, my + 340), "✓ 1 Lead Parsed", fill=(200, 255, 220), font=font_bold_16)
    draw.text((mx + 90, my + 380), "Columns verified: name, phone, email, language, reason_for_calling", fill=TEXT_MUTED, font=font_reg_16)
    
    # Lead Table Preview
    draw.rounded_rectangle([mx + 60, my + 460, mx + mw - 60, my + 720], radius=16, fill=(20, 28, 48), outline=CARD_BORDER, width=1)
    # Header
    draw.text((mx + 90, my + 485), "NAME", fill=TEXT_MUTED, font=font_bold_16)
    draw.text((mx + 340, my + 485), "PHONE", fill=TEXT_MUTED, font=font_bold_16)
    draw.text((mx + 560, my + 485), "EMAIL", fill=TEXT_MUTED, font=font_bold_16)
    draw.text((mx + 860, my + 485), "LANG", fill=TEXT_MUTED, font=font_bold_16)
    draw.text((mx + 980, my + 485), "CAMPAIGN CONTEXT", fill=TEXT_MUTED, font=font_bold_16)
    draw.line([(mx + 60, my + 520), (mx + mw - 60, my + 520)], fill=CARD_BORDER, width=1)
    
    # Row
    draw.text((mx + 90, my + 545), "Tanmay Vijay Khurpe", fill=WHITE, font=font_bold_20)
    draw.text((mx + 340, my + 547), "+91 84549 •••••", fill=CYAN_ACCENT, font=font_mono_18)
    draw.text((mx + 560, my + 547), "may.911.505@gmail.com", fill=WHITE, font=font_reg_18)
    draw.text((mx + 860, my + 547), "Hinglish", fill=AMBER_ACCENT, font=font_bold_16)
    draw.text((mx + 980, my + 547), "Curated India Fashion Drop", fill=TEXT_MUTED, font=font_reg_18)
    
    draw.line([(mx + 60, my + 590), (mx + mw - 60, my + 590)], fill=CARD_BORDER, width=1)
    draw.text((mx + 90, my + 630), "⚡ Status: Ready for Automated Autonomous Voice Outreach", fill=GREEN_ACCENT, font=font_bold_18)
    draw.text((mx + 90, my + 665), "Target Dialing Route: E.164 verified carrier line via Shubham voice model", fill=TEXT_MUTED, font=font_reg_16)
    
    # Action Trigger Button
    btn_x = mx + mw - 460
    draw.rounded_rectangle([btn_x, my + 780, mx + mw - 60, my + 850], radius=16, fill=(16, 120, 80), outline=GREEN_ACCENT, width=2)
    draw.text((btn_x + 36, my + 802), "Run Campaign & Start Calling 🚀", fill=WHITE, font=font_bold_20)
    
    return img

# Scene 5: Customer Phone Incoming Call & Live Conversation
def render_scene_5(turn_idx=1):
    img = Image.new("RGB", (WIDTH, HEIGHT), NAVY_BG)
    draw = ImageDraw.Draw(img)
    
    # Left Console: Live Call Monitor
    cx, cy, cw, ch = 80, 80, 1150, 920
    draw.rounded_rectangle([cx, cy, cx + cw, cy + ch], radius=24, fill=SURFACE_BG, outline=CARD_BORDER, width=2)
    
    # Call Header
    draw.rounded_rectangle([cx + 40, cy + 30, cx + 220, cy + 70], radius=14, fill=(16, 60, 40), outline=GREEN_ACCENT, width=1)
    draw.ellipse([cx + 56, cy + 46, cx + 66, cy + 56], fill=GREEN_ACCENT)
    draw.text((cx + 76, cy + 40), "CALL CONNECTED", fill=(200, 255, 220), font=font_bold_16)
    
    draw.text((cx + 250, cy + 40), "Target: Tanmay Khurpe (Curated India Drop)", fill=WHITE, font=font_bold_20)
    draw.text((cx + 880, cy + 40), "Duration: 00:28", fill=TEXT_MUTED, font=font_mono_22)
    
    # Audio Waveform visualization
    draw.rounded_rectangle([cx + 40, cy + 90, cx + cw - 40, cy + 170], radius=14, fill=(18, 25, 42), outline=CARD_BORDER, width=1)
    draw.text((cx + 60, cy + 102), "LIVE AUDIO STREAM · Gnani Timbre TTS (Shubham Voice)", fill=CYAN_ACCENT, font=font_bold_16)
    
    # Draw animated wave bars
    wx = cx + 60
    for i in range(48):
        h = int(12 + 28 * math.sin(i * 0.45 + turn_idx * 1.5) ** 2)
        draw.rounded_rectangle([wx, cy + 145 - h, wx + 12, cy + 145 + h], radius=4, fill=BLUE_ACCENT)
        wx += 21
        
    # Transcript Thread
    draw.text((cx + 40, cy + 195), "REAL-TIME CONVERSATION TRANSCRIPT", fill=TEXT_MUTED, font=font_bold_16)
    
    dialogues = [
        ("Agent (Shubham)", "Hi, kya mai Tanmay se baat kar raha hoon?", BLUE_ACCENT, True),
        ("Customer (Tanmay)", "Haan, boliye kaun?", AMBER_ACCENT, False),
        ("Agent (Shubham)", "Main Shubham hoon Curated India se. Main aapko hamare store ke naye drop ke baare mein batane ke liye call kar raha hoon. Kya aap product ke details dekhna chahenge?", BLUE_ACCENT, True),
        ("Customer (Tanmay)", "Haan email aur WhatsApp pe bhej do.", AMBER_ACCENT, False),
        ("Agent (Shubham)", "Bilkul! Maine aapke email aur WhatsApp par secure link aur catalog bhej diya hai. Thank you!", GREEN_ACCENT, True)
    ]
    
    ty = cy + 235
    for idx, (speaker, text, color, is_agent) in enumerate(dialogues):
        if idx > turn_idx:
            break
        # Bubble
        bw = cw - 120
        # Speaker label
        draw.text((cx + 50, ty), speaker, fill=color, font=font_bold_16)
        
        # Text wrap
        words = text.split(" ")
        lines = []
        cur = ""
        for w in words:
            if len(cur + " " + w) < 70:
                cur = (cur + " " + w).strip()
            else:
                lines.append(cur)
                cur = w
        if cur:
            lines.append(cur)
            
        bubble_h = len(lines) * 28 + 24
        bg_col = (25, 35, 60) if is_agent else (40, 32, 25)
        border_col = BLUE_ACCENT if is_agent else AMBER_ACCENT
        draw.rounded_rectangle([cx + 50, ty + 24, cx + 50 + bw, ty + 24 + bubble_h], radius=12, fill=bg_col, outline=border_col, width=1)
        
        ly = ty + 36
        for l in lines:
            draw.text((cx + 70, ly), l, fill=WHITE, font=font_reg_18)
            ly += 28
            
        ty += bubble_h + 46
        
    # Right: Mobile Screen Overlay (phone_blurred.jpg)
    px = 1320
    py = 60
    # Scale phone_blurred.jpg so height is ~960
    target_h = 960
    target_w = int(phone_raw.width * (target_h / phone_raw.height))
    phone_resized = phone_raw.resize((target_w, target_h), Image.Resampling.LANCZOS)
    
    # Phone border frame
    draw.rounded_rectangle([px - 14, py - 14, px + target_w + 14, py + target_h + 14], radius=38, fill=(10, 15, 28), outline=(60, 80, 110), width=3)
    img.paste(phone_resized, (px, py))
    
    # Phone header badge
    draw.rounded_rectangle([px, py - 50, px + target_w, py - 18], radius=12, fill=(20, 30, 50), outline=CARD_BORDER, width=1)
    draw.text((px + 50, py - 44), "CUSTOMER INCOMING CALL", fill=CYAN_ACCENT, font=font_bold_16)
    
    return img

# Scene 6: Instant Confirmation Email
def render_scene_6(t):
    img = Image.new("RGB", (WIDTH, HEIGHT), NAVY_BG)
    draw = ImageDraw.Draw(img)
    draw_navbar(draw, active_tab="Orders")
    
    # Center Inbox Card
    mx, my, mw, mh = 320, 110, 1280, 890
    draw.rounded_rectangle([mx, my, mx + mw, my + mh], radius=24, fill=SURFACE_BG, outline=CARD_BORDER, width=2)
    
    # Inbox Header
    draw.rounded_rectangle([mx + 50, my + 30, mx + 310, my + 72], radius=14, fill=(16, 60, 40), outline=GREEN_ACCENT, width=1)
    draw.text((mx + 66, my + 40), "✓ INSTANT DISPATCH · 0s LATENCY", fill=(200, 255, 220), font=font_bold_16)
    
    draw.text((mx + 50, my + 95), "Customer Inbox: may.911.505@gmail.com", fill=WHITE, font=font_title_med)
    draw.text((mx + 50, my + 145), "Delivered automatically immediately following the voice call agreement.", fill=TEXT_MUTED, font=font_reg_18)
    
    # Email Card
    ey = my + 195
    ew = mw - 100
    draw.rounded_rectangle([mx + 50, ey, mx + 50 + ew, ey + 630], radius=18, fill=(20, 28, 48), outline=CARD_BORDER, width=2)
    
    # Email Header
    draw.text((mx + 90, ey + 30), "FROM: Curated India VIP Team <orders@curatedindia.com>", fill=CYAN_ACCENT, font=font_bold_20)
    draw.text((mx + 90, ey + 65), "TO: Tanmay Vijay Khurpe <may.911.505@gmail.com>", fill=TEXT_MUTED, font=font_reg_18)
    draw.text((mx + 90, ey + 105), "SUBJECT: Exclusive Festive Linen Drop — Your Private Order Link", fill=WHITE, font=font_bold_24)
    draw.line([(mx + 50, ey + 150), (mx + 50 + ew, ey + 150)], fill=CARD_BORDER, width=1)
    
    # Email Body
    by = ey + 180
    draw.text((mx + 90, by), "Hi Tanmay,", fill=WHITE, font=font_bold_24)
    draw.text((mx + 90, by + 45), "Thank you for speaking with Shubham today from Curated India!", fill=WHITE, font=font_reg_20)
    draw.text((mx + 90, by + 85), "As discussed, here is your private link to explore the Festive Linen Drop before the public launch:", fill=TEXT_MUTED, font=font_reg_20)
    
    # Big CTA Button
    btn_y = by + 145
    draw.rounded_rectangle([mx + 90, btn_y, mx + 620, btn_y + 70], radius=16, fill=BLUE_ACCENT)
    draw.text((mx + 130, btn_y + 20), "View Product Catalog & Order Now →", fill=WHITE, font=font_bold_22)
    
    # Token / Link info
    draw.text((mx + 90, btn_y + 95), "Secure Direct URL:", fill=TEXT_MUTED, font=font_bold_16)
    draw.rounded_rectangle([mx + 90, btn_y + 125, mx + ew - 90, btn_y + 185], radius=12, fill=(15, 20, 35), outline=CARD_BORDER, width=1)
    draw.text((mx + 110, btn_y + 145), "https://curatedindia.vercel.app/order-form/curated_india_tanmay_7f03", fill=CYAN_ACCENT, font=font_mono_22)
    
    draw.text((mx + 90, btn_y + 215), "✓ Link is secured, personalized to Tanmay Vijay Khurpe, and valid for 48 hours.", fill=GREEN_ACCENT, font=font_bold_16)
    
    return img

# Scene 7: Gnani AI Speech Architecture
def render_scene_7(t):
    img = Image.new("RGB", (WIDTH, HEIGHT), NAVY_BG)
    draw = ImageDraw.Draw(img)
    
    # Header Badge
    draw.rounded_rectangle([WIDTH//2 - 220, 60, WIDTH//2 + 220, 105], radius=18, fill=(24, 38, 70), outline=BLUE_ACCENT, width=1)
    draw.text((WIDTH//2 - 180, 72), "CONVERSATIONAL SPEECH ARCHITECTURE", fill=CYAN_ACCENT, font=font_bold_16)
    
    # Title
    title = "Powered Exclusively by Gnani AI"
    bbox = draw.textbbox((0, 0), title, font=font_title_large)
    draw.text(((WIDTH - (bbox[2]-bbox[0]))//2, 125), title, fill=WHITE, font=font_title_large)
    
    sub = "High-accuracy Indian Hinglish streaming loop with ultra-low conversational latency"
    s_bbox = draw.textbbox((0, 0), sub, font=font_reg_20)
    draw.text(((WIDTH - (s_bbox[2]-s_bbox[0]))//2, 195), sub, fill=TEXT_MUTED, font=font_reg_20)
    
    # Architecture Flow Box
    # Box 1: Gnani Prisma STT
    bx1 = 120
    by = 265
    bw = 760
    bh = 460
    draw.rounded_rectangle([bx1, by, bx1 + bw, by + bh], radius=24, fill=SURFACE_BG, outline=BLUE_ACCENT, width=2)
    draw.rounded_rectangle([bx1 + 35, by + 30, bx1 + 320, by + 75], radius=14, fill=(16, 45, 80))
    draw.text((bx1 + 50, by + 42), "SPEECH-TO-TEXT (STT)", fill=CYAN_ACCENT, font=font_bold_16)
    
    draw.text((bx1 + 35, by + 95), "Gnani Prisma STT (v2.5 / v3.0)", fill=WHITE, font=font_title_med)
    draw.text((bx1 + 35, by + 145), "Real-time streaming speech recognition engineered for Indian accents.", fill=TEXT_MUTED, font=font_reg_18)
    
    stt_features = [
        ("📡 WebSocket Stream", "Raw 8 kHz / 16 kHz linear PCM audio streaming"),
        ("🗣️ Multi-Dialect Support", "Native recognition of Hindi, English & mixed Hinglish"),
        ("🎯 Domain Vocabulary", "High accuracy on Indian fashion brands & product names"),
        ("⚡ Ultra-Low Latency", "Chunked streaming with under 250ms recognition delay")
    ]
    fy = by + 205
    for title, desc in stt_features:
        draw.text((bx1 + 35, fy), title, fill=WHITE, font=font_bold_18)
        draw.text((bx1 + 280, fy), desc, fill=TEXT_MUTED, font=font_reg_18)
        fy += 56
        
    # Box 2: Gnani Timbre TTS
    bx2 = 1040
    draw.rounded_rectangle([bx2, by, bx2 + bw, by + bh], radius=24, fill=SURFACE_BG, outline=PURPLE_ACCENT, width=2)
    draw.rounded_rectangle([bx2 + 35, by + 30, bx2 + 320, by + 75], radius=14, fill=(50, 25, 75))
    draw.text((bx2 + 50, by + 42), "TEXT-TO-SPEECH (TTS)", fill=(210, 180, 255), font=font_bold_16)
    
    draw.text((bx2 + 35, by + 95), "Gnani Timbre TTS (v2.0 / v3.0)", fill=WHITE, font=font_title_med)
    draw.text((bx2 + 35, by + 145), "Neural voice synthesis delivering lifelike conversational delivery.", fill=TEXT_MUTED, font=font_reg_18)
    
    tts_features = [
        ("🎙️ Voice Profile: Shubham", "Specialized Indian male sales agent conversational persona"),
        ("🌊 Linear PCM Stream", "Synthesizes 8 kHz telephony-compatible audio stream"),
        ("🎶 Natural Intonation", "Authentic pauses, pitch contours, and sentence rhythms"),
        ("⚡ Rapid Audio Turnaround", "Immediate speech chunk delivery to the live voice channel")
    ]
    fy = by + 205
    for title, desc in tts_features:
        draw.text((bx2 + 35, fy), title, fill=WHITE, font=font_bold_18)
        draw.text((bx2 + 310, fy), desc, fill=TEXT_MUTED, font=font_reg_18)
        fy += 56
        
    # Bottom Center Banner
    cy = 770
    draw.rounded_rectangle([120, cy, WIDTH - 120, cy + 180], radius=20, fill=(18, 30, 55), outline=GREEN_ACCENT, width=2)
    draw.text((160, cy + 30), "THE CLOSED CONVERSATIONAL LOOP", fill=GREEN_ACCENT, font=font_bold_22)
    draw.text((160, cy + 70), "Customer Speech  ──>  Gnani Prisma STT  ──>  Dialogue State Arbiter  ──>  Gnani Timbre TTS (Shubham)  ──>  Customer Audio", fill=WHITE, font=font_mono_22)
    draw.text((160, cy + 120), "✓ End-to-end response latency < 500ms   |   ✓ Zero robotic pauses   |   ✓ Flawless Hinglish comprehension", fill=CYAN_ACCENT, font=font_bold_18)
    
    return img

# Scene 8: Outro
def render_scene_8(t):
    img = Image.new("RGB", (WIDTH, HEIGHT), NAVY_BG)
    draw = ImageDraw.Draw(img)
    
    draw.ellipse([WIDTH//2 - 450, HEIGHT//2 - 350, WIDTH//2 + 450, HEIGHT//2 + 350], fill=(22, 38, 80))
    
    pill_text = "✦  PRODUCTION READY"
    pw = 320
    px = (WIDTH - pw) // 2
    draw.rounded_rectangle([px, 320, px + pw, 366], radius=23, fill=(16, 50, 36), outline=GREEN_ACCENT, width=1)
    draw.text((px + 45, 332), pill_text, fill=(200, 255, 220), font=font_bold_18)
    
    title = "BARTA AI"
    bbox = draw.textbbox((0, 0), title, font=font_title_huge)
    tw = bbox[2] - bbox[0]
    draw.text(((WIDTH - tw)//2, 400), title, fill=WHITE, font=font_title_huge)
    
    tagline = "Autonomous Outbound Voice Sales Agent Platform"
    t_bbox = draw.textbbox((0, 0), tagline, font=font_bold_28)
    draw.text(((WIDTH - (t_bbox[2]-t_bbox[0]))//2, 540), tagline, fill=TEXT_MUTED, font=font_bold_28)
    
    # GitHub link card
    gh_w = 640
    gh_x = (WIDTH - gh_w) // 2
    draw.rounded_rectangle([gh_x, 630, gh_x + gh_w, 700], radius=18, fill=SURFACE_BG, outline=CARD_BORDER, width=2)
    draw.text((gh_x + 50, 648), "GitHub: github.com/may1102-1909/BARTA-AI", fill=CYAN_ACCENT, font=font_mono_22)
    
    return img

# Test render all scenes
render_scene_1(0).save("brag-output/work/test_frames/scene_1.jpg", quality=95)
render_scene_2(0).save("brag-output/work/test_frames/scene_2.jpg", quality=95)
render_scene_3(0).save("brag-output/work/test_frames/scene_3.jpg", quality=95)
render_scene_4(0).save("brag-output/work/test_frames/scene_4.jpg", quality=95)
render_scene_5(4).save("brag-output/work/test_frames/scene_5.jpg", quality=95)
render_scene_6(0).save("brag-output/work/test_frames/scene_6.jpg", quality=95)
render_scene_7(0).save("brag-output/work/test_frames/scene_7.jpg", quality=95)
render_scene_8(0).save("brag-output/work/test_frames/scene_8.jpg", quality=95)

print("All 8 test scenes successfully rendered!")
