import subprocess
import os

clips = {
    "agent_1": "Hi, kya mai Tanmay se baat kar raha hoon?",
    "customer_1": "Haan, boliye kaun?",
    "agent_2": "Main Shubham hoon Curated India se. Main aapko hamare store ke naye drop ke baare mein batane ke liye call kar raha hoon. Kya aap product ke details dekhna chahenge?",
    "customer_2": "Haan email aur WhatsApp pe bhej do.",
    "agent_3": "Bilkul! Maine aapke email aur WhatsApp par secure link aur catalog bhej diya hai. Thank you!",
    "intro_narration": "Welcome to BARTA AI. The autonomous outbound voice sales platform converting customer lists into high-intent orders at scale.",
    "setup_narration": "First, create a campaign. Name your drop, define your sales goal, and verify your store URL with automatic validation.",
    "csv_narration": "Next, upload your customer CSV. BARTA AI instantly parses lead details, language preferences, and custom context.",
    "email_narration": "Once the customer confirms interest, BARTA AI instantly dispatches a personalized order form and catalog to their inbox.",
    "gnani_narration": "Under the hood, speech is powered exclusively by Gnani AI. Gnani Prisma STT v2.5 and v3.0 streams speech-to-text over WebSocket, while Gnani Timbre TTS v2.0 and v3.0 synthesizes neural Hinglish voice using the specialized Shubham voice profile."
}

os.makedirs("brag-output/work/audio", exist_ok=True)

ps_lines = [
    "Add-Type -AssemblyName System.Speech",
    "$speak = New-Object System.Speech.Synthesis.SpeechSynthesizer"
]

for name, text in clips.items():
    clean_text = text.replace('"', '`"')
    wav_path = f"brag-output/work/audio/{name}.wav".replace("/", "\\")
    ps_lines.append(f'$speak.SetOutputToWaveFile("{wav_path}")')
    ps_lines.append(f'$speak.Speak("{clean_text}")')

ps_lines.append("$speak.Dispose()")

ps_file = "brag-output/work/audio/gen_all_clips.ps1"
with open(ps_file, "w", encoding="utf-8") as f:
    f.write("\n".join(ps_lines))

res = subprocess.run(["powershell", "-ExecutionPolicy", "Bypass", "-File", ps_file], capture_output=True, text=True)
print("STDOUT:", res.stdout)
print("STDERR:", res.stderr)

for name in clips:
    path = f"brag-output/work/audio/{name}.wav"
    print(f"{name}: exists={os.path.exists(path)}, size={os.path.getsize(path) if os.path.exists(path) else 0}")

