import subprocess
import os

FFMPEG = r"C:\Users\tanma\BARTA AI 2\backend\venv\Lib\site-packages\imageio_ffmpeg\binaries\ffmpeg-win-x86_64-v9.0.2.exe"

# Clips and start times in milliseconds
timeline = [
    ("intro_narration.wav", 3800, "volume=1.3"),
    ("setup_narration.wav", 13200, "volume=1.3"),
    ("csv_narration.wav", 23800, "volume=1.3"),
    ("agent_1.wav", 35800, "volume=1.35,treble=g=2"),
    ("customer_1.wav", 40200, "volume=1.25,highpass=f=300,lowpass=f=3400"),
    ("agent_2.wav", 43200, "volume=1.35,treble=g=2"),
    ("customer_2.wav", 55400, "volume=1.25,highpass=f=300,lowpass=f=3400"),
    ("agent_3.wav", 59000, "volume=1.35,treble=g=2"),
    ("email_narration.wav", 67800, "volume=1.3"),
    ("gnani_narration.wav", 77000, "volume=1.3"),
]

# Inputs:
# 0: music_bed.wav
inputs = ["-i", "brag-output/work/music_bed.wav"]
filter_parts = []

# Lower music bed volume slightly to 0.22 so speech cuts through clearly
filter_parts.append("[0:a]volume=0.22,aformat=sample_fmts=fltp:sample_rates=44100:channel_layouts=stereo[bg];")

for idx, (filename, delay_ms, audio_filter) in enumerate(timeline, start=1):
    path = f"brag-output/work/audio/{filename}"
    inputs.extend(["-i", path])
    # Apply filter and adelay
    filter_parts.append(
        f"[{idx}:a]{audio_filter},aresample=44100,aformat=channel_layouts=stereo,adelay={delay_ms}|{delay_ms}[v{idx}];"
    )

mix_inputs = "[bg]" + "".join(f"[v{i}]" for i in range(1, len(timeline) + 1))
filter_parts.append(f"{mix_inputs}amix=inputs={len(timeline) + 1}:duration=first:dropout_transition=2,volume=1.4[outa]")

filter_complex = "".join(filter_parts)

out_file = "brag-output/work/master_audio.wav"
cmd = [
    FFMPEG, "-y",
    *inputs,
    "-filter_complex", filter_complex,
    "-map", "[outa]",
    "-t", "101",
    out_file
]

print("Running ffmpeg audio mix...")
res = subprocess.run(cmd, capture_output=True, text=True)
if res.returncode != 0:
    print("FFMPEG ERROR:")
    print(res.stderr)
else:
    print("Success! Master audio created:", out_file, "size:", os.path.getsize(out_file))

