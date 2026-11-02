import math
import struct
import wave

SAMPLE_RATE = 44100
TOTAL_DURATION = 100.0  # seconds

def make_sine(freq, t):
    return math.sin(2.0 * math.pi * freq * t)

# Chords (frequencies): Em9, Cmaj7, Gmaj7, Dadd9
chord_prog = [
    [164.81, 196.00, 246.94, 293.66, 392.00], # Em9
    [130.81, 164.81, 196.00, 246.94, 329.63], # Cmaj7
    [196.00, 246.94, 293.66, 369.99, 440.00], # Gmaj7
    [146.83, 185.00, 220.00, 293.66, 369.99]  # Dadd9
]

chord_duration = 4.0 # seconds per chord

n_samples = int(SAMPLE_RATE * TOTAL_DURATION)
samples = []

print("Generating ambient music bed...")
for i in range(n_samples):
    t = i / SAMPLE_RATE
    
    # Current chord
    c_idx = int((t % (chord_duration * 4)) / chord_duration)
    chord = chord_prog[c_idx]
    
    # Sub-bass root note (octave down)
    root = chord[0] / 2.0
    bass = 0.25 * make_sine(root, t) + 0.1 * make_sine(root * 2, t)
    
    # Pad harmonics with soft chorus/beating
    pad = 0.0
    for note in chord:
        # Slight detuning for warmth/lushness
        pad += 0.04 * make_sine(note * 0.998, t)
        pad += 0.04 * make_sine(note * 1.002, t)
        pad += 0.02 * make_sine(note * 2.0, t)
        
    # Gentle rhythmic pulse (120 BPM -> 0.5s per beat)
    beat_t = t % 0.5
    kick_pulse = math.exp(-beat_t * 20.0) * 0.15 * make_sine(55.0 - beat_t * 60.0, beat_t)
    
    # Hi-hat soft click every 0.25s
    hat_t = t % 0.25
    hat = math.exp(-hat_t * 60.0) * 0.03 * ((math.sin(t * 8000.0) > 0) * 2 - 1)
    
    # Subtle arpeggio chime
    arp_note = chord[int(t * 4) % len(chord)] * 2.0
    arp_t = t % 0.25
    arp = math.exp(-arp_t * 12.0) * 0.05 * make_sine(arp_note, t)
    
    # Fade in over 2s, fade out over 3s
    fade = min(1.0, t / 2.0) * min(1.0, (TOTAL_DURATION - t) / 3.0)
    
    val = (bass + pad + kick_pulse + hat + arp) * fade * 0.35
    val = max(-0.95, min(0.95, val))
    samples.append(int(val * 32767))

with wave.open("brag-output/work/music_bed.wav", "wb") as wf:
    wf.setnchannels(1)
    wf.setsampwidth(2)
    wf.setframerate(SAMPLE_RATE)
    wf.writeframes(struct.pack(f"<{len(samples)}h", *samples))

print("Music bed generated: brag-output/work/music_bed.wav")

