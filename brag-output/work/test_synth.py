import subprocess
import os

ps_code = """
Add-Type -AssemblyName System.Speech
$speak = New-Object System.Speech.Synthesis.SpeechSynthesizer
$speak.SetOutputToWaveFile("brag-output/work/test_speech.wav")
$speak.Speak("Hi, kya mai Tanmay se baat kar raha hoon?")
$speak.Dispose()
"""

with open("brag-output/work/gen_speech.ps1", "w", encoding="utf-8") as f:
    f.write(ps_code)

res = subprocess.run(["powershell", "-ExecutionPolicy", "Bypass", "-File", "brag-output/work/gen_speech.ps1"], capture_output=True, text=True)
print("Return code:", res.returncode)
print("STDOUT:", res.stdout)
print("STDERR:", res.stderr)
print("WAV exists:", os.path.exists("brag-output/work/test_speech.wav"))

