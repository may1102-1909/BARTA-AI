"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import {
  Phone,
  PhoneCall,
  PhoneOff,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Upload,
  FileSpreadsheet,
  User,
  CheckCircle2,
  Wrench,
  Send,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Radio
} from "lucide-react";
import { api } from "@/lib/api";
import type { ParsedCsvContact, TranscriptTurn } from "@/lib/types";
import { humanize } from "@/lib/utils";
import { Card } from "@/components/ui/Card";
import { ErrorBanner } from "@/components/ui/Feedback";
import { Button, buttonClass } from "@/components/ui/Button";
import { PageHeader } from "@/components/ui/PageHeader";

const DEFAULT_CONTACTS: ParsedCsvContact[] = [
  {
    contact_name: "Tanmay Sharma",
    contact_phone: "+918454925469",
    contact_email: "tanmay@curatedindia.com",
    preferred_language: "hinglish",
    notes: "Interested in minimalist linen kurta and new festival drop",
  },
  {
    contact_name: "Aarav Mehta",
    contact_phone: "+919876543210",
    contact_email: "aarav.mehta@example.com",
    preferred_language: "hindi",
    notes: "Previous customer, likes festive ethnic wear",
  },
  {
    contact_name: "Priya Nair",
    contact_phone: "+919811223344",
    contact_email: "priya.nair@example.com",
    preferred_language: "english",
    notes: "B2B boutique owner inquiring about wholesale orders",
  },
];

const SUGGESTED_RESPONSES = [
  "Haan, product ke details aur price batao",
  "Theek hai, ek piece Cash on Delivery pe confirm kardo",
  "Mujhe WhatsApp pe naya catalog bhej do",
  "Main abhi thoda busy hoon, kal dopahar ko call kar sakte ho?",
  "Nahi, abhi interest nahi hai, thank you",
];

export default function SimulatorPage() {
  // CSV & Contacts State
  const [contacts, setContacts] = useState<ParsedCsvContact[]>(DEFAULT_CONTACTS);
  const [selectedIdx, setSelectedIdx] = useState<number>(0);
  const [csvFileName, setCsvFileName] = useState<string>("default_sample_contacts.csv");
  const [isParsingCsv, setIsParsingCsv] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  // Active Call State
  const [callState, setCallState] = useState<"idle" | "ringing" | "connected" | "ended">("idle");
  const [callDuration, setCallDuration] = useState<number>(0);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [callId, setCallId] = useState<string | null>(null);
  const [transcript, setTranscript] = useState<TranscriptTurn[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [isAgentSpeaking, setIsAgentSpeaking] = useState(false);
  const [isSpeakerMuted, setIsSpeakerMuted] = useState(false);
  const [isMicListening, setIsMicListening] = useState(false);
  const [lastTool, setLastTool] = useState<string | null>(null);
  const [outcome, setOutcome] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const recognitionRef = useRef<any>(null);
  const transcriptEndRef = useRef<HTMLDivElement>(null);

  const currentContact = contacts[selectedIdx] || contacts[0] || DEFAULT_CONTACTS[0];

  // Auto-scroll transcript
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [transcript, isAgentSpeaking, sending]);

  // Call duration timer
  useEffect(() => {
    if (callState === "connected") {
      timerRef.current = setInterval(() => {
        setCallDuration((d) => d + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [callState]);

  // Audio playback function using Base64 WAV from Gnani Timbre TTS
  const playAgentAudio = useCallback((base64Wav: string | null | undefined) => {
    if (!base64Wav || isSpeakerMuted) return;

    try {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      const audio = new Audio("data:audio/wav;base64," + base64Wav);
      audioRef.current = audio;
      setIsAgentSpeaking(true);

      audio.onended = () => {
        setIsAgentSpeaking(false);
      };
      audio.onerror = () => {
        setIsAgentSpeaking(false);
      };

      audio.play().catch((err) => {
        console.warn("Autoplay notice (user interaction required):", err);
        setIsAgentSpeaking(false);
      });
    } catch (e) {
      console.error("Audio playback error:", e);
      setIsAgentSpeaking(false);
    }
  }, [isSpeakerMuted]);

  // Soft ringing sound generator using Web Audio API
  const playRingtone = useCallback(() => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      osc.frequency.setValueAtTime(480, ctx.currentTime + 0.1);

      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.7);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.7);
    } catch {
      // AudioContext not allowed without interaction
    }
  }, []);

  // Browser Speech Recognition for talking to Shubham
  const toggleSpeechRecognition = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setError("Speech recognition is not supported in this browser. Please type your message.");
      return;
    }

    if (isMicListening) {
      if (recognitionRef.current) recognitionRef.current.stop();
      setIsMicListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = currentContact.preferred_language === "english" ? "en-IN" : "hi-IN";
      recognition.continuous = false;
      recognition.interimResults = true;

      recognition.onstart = () => {
        setIsMicListening(true);
      };

      recognition.onresult = (event: any) => {
        const transcriptText = Array.from(event.results)
          .map((result: any) => (result as any)[0].transcript)
          .join("");
        setInput(transcriptText);
      };

      recognition.onerror = () => {
        setIsMicListening(false);
      };

      recognition.onend = () => {
        setIsMicListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch {
      setError("Microphone permission denied or not available.");
      setIsMicListening(false);
    }
  };

  // CSV Upload handler
  const handleCsvUpload = async (file: File) => {
    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".csv")) {
      setError("Please upload a valid CSV file (.csv).");
      return;
    }

    setIsParsingCsv(true);
    setError(null);
    try {
      const res = await api.parseSimulatorCsv(file);
      if (res.contacts && res.contacts.length > 0) {
        setContacts(res.contacts);
        setSelectedIdx(0);
        setCsvFileName(file.name);
      } else {
        setError("No valid contact rows found in CSV.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to parse CSV file");
    } finally {
      setIsParsingCsv(false);
    }
  };

  // Start Call Simulation
  const handleStartCall = async () => {
    setError(null);
    setCallState("ringing");
    setCallDuration(0);
    setTranscript([]);
    setLastTool(null);
    setOutcome(null);
    playRingtone();

    try {
      const res = await api.startSimulation({
        contact_name: currentContact.contact_name,
        contact_phone: currentContact.contact_phone,
        contact_email: currentContact.contact_email,
        preferred_language: currentContact.preferred_language,
        notes: currentContact.notes,
      });

      setSessionId(res.session_id);
      setCallId(res.call_id);
      setTranscript(res.transcript || []);

      // Small delay for realistic phone pickup transition
      setTimeout(() => {
        setCallState("connected");
        if (res.audio_base64) {
          playAgentAudio(res.audio_base64);
        }
      }, 1400);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to initiate call simulation");
      setCallState("idle");
    }
  };

  // Send turn to LLM & Synthesize with Gnani Shubham Voice
  const handleSendTurn = async (userText?: string) => {
    const text = (userText || input).trim();
    if (!text || !sessionId || callState !== "connected" || sending) return;

    setInput("");
    setSending(true);
    setError(null);

    // Stop mic if listening
    if (isMicListening && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsMicListening(false);
    }

    // Immediately reflect user message in dialogue
    setTranscript((prev) => [
      ...prev,
      { speaker: "user", text, timestamp: new Date().toISOString() },
    ]);

    try {
      const res = await api.sendSimTurn(sessionId, text);
      if (res.tool_called) setLastTool(res.tool_called);
      if (res.outcome) setOutcome(res.outcome);
      if (res.transcript) setTranscript(res.transcript);

      // Play synthesized Shubham voice from Gnani Timbre TTS
      if (res.audio_base64) {
        playAgentAudio(res.audio_base64);
      }

      if (res.call_ended) {
        setTimeout(() => {
          setCallState("ended");
          setIsAgentSpeaking(false);
        }, 3000);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to process speech turn");
    } finally {
      setSending(false);
    }
  };

  // Hang up call
  const handleHangUp = () => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    setIsAgentSpeaking(false);
    setCallState("ended");
  };

  // Reset simulator
  const handleReset = () => {
    if (audioRef.current) audioRef.current.pause();
    setCallState("idle");
    setSessionId(null);
    setCallId(null);
    setTranscript([]);
    setCallDuration(0);
    setLastTool(null);
    setOutcome(null);
    setError(null);
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div className="space-y-6 pb-16">
      <PageHeader
        title="Call Simulator"
        actions={
          <div className="flex items-center gap-3">
            {callId && (
              <Link href={`/calls?call_id=${callId}`} className={buttonClass("secondary", "sm")}>
                View call log <ExternalLink className="h-3.5 w-3.5" />
              </Link>
            )}
            <Button
              variant="secondary"
              size="sm"
              icon={<RotateCcw className="h-3.5 w-3.5" />}
              onClick={handleReset}
            >
              Reset
            </Button>
          </div>
        }
      />

      <ErrorBanner message={error} />

      {/* Main Grid: Left Controls & CSV + Right Smartphone Simulator */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* LEFT COLUMN: CSV Upload & Contact Selector (5 cols) */}
        <div className="space-y-5 lg:col-span-5">
          {/* CSV File Dropzone Card */}
          <Card className="p-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="h-4 w-4 text-navy-900" />
                <span className="text-sm font-bold text-navy-900">Upload Contacts CSV</span>
              </div>
              <span className="text-[11px] font-semibold text-slate-500">
                {contacts.length} {contacts.length === 1 ? "contact" : "contacts"}
              </span>
            </div>

            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                const file = e.dataTransfer.files?.[0];
                if (file) handleCsvUpload(file);
              }}
              className={`mt-4 flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-5 text-center transition-all ${
                dragOver
                  ? "border-navy-900 bg-navy-50/50"
                  : "border-slate-200 hover:border-slate-300 bg-slate-50/50"
              }`}
            >
              <Upload className="h-6 w-6 text-slate-400 mb-2" />
              <p className="text-xs font-semibold text-navy-900">
                Drop your CSV file here or{" "}
                <label className="cursor-pointer text-navy-900 underline hover:text-navy-950 font-bold">
                  browse
                  <input
                    type="file"
                    accept=".csv"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleCsvUpload(file);
                    }}
                  />
                </label>
              </p>
              <p className="mt-1 text-[11px] text-slate-400">
                Supported columns: name, phone, email, language
              </p>
              {isParsingCsv && (
                <div className="mt-2 text-xs font-medium text-navy-900 flex items-center gap-1.5">
                  <span className="h-2 w-2 animate-spin rounded-full border-2 border-navy-900 border-t-transparent" />
                  Parsing CSV contacts...
                </div>
              )}
            </div>

            <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
              <span className="truncate max-w-[200px] font-mono text-[11px]">
                Active: {csvFileName}
              </span>
              <button
                type="button"
                onClick={() => {
                  setContacts(DEFAULT_CONTACTS);
                  setSelectedIdx(0);
                  setCsvFileName("default_sample_contacts.csv");
                }}
                className="text-[11px] font-bold text-navy-900 hover:underline"
              >
                Reload Sample CSV
              </button>
            </div>
          </Card>

          {/* Contact Carousel Card */}
          <Card className="p-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Target Contact ({selectedIdx + 1} of {contacts.length})
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  aria-label="Previous contact"
                  disabled={selectedIdx <= 0 || callState === "connected" || callState === "ringing"}
                  onClick={() => setSelectedIdx((i) => Math.max(0, i - 1))}
                  className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-navy-900 disabled:opacity-30"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  aria-label="Next contact"
                  disabled={
                    selectedIdx >= contacts.length - 1 ||
                    callState === "connected" ||
                    callState === "ringing"
                  }
                  onClick={() => setSelectedIdx((i) => Math.min(contacts.length - 1, i + 1))}
                  className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-navy-900 disabled:opacity-30"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="mt-4 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-base font-extrabold text-navy-900">
                    {currentContact.contact_name}
                  </h3>
                  <p className="font-mono text-xs text-slate-500">{currentContact.contact_phone}</p>
                </div>
                <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-navy-900">
                  {currentContact.preferred_language}
                </span>
              </div>

              {currentContact.contact_email && (
                <div className="text-xs text-slate-500">
                  <span className="font-semibold text-slate-400">Email:</span>{" "}
                  {currentContact.contact_email}
                </div>
              )}

              {currentContact.notes && (
                <div className="rounded-lg bg-slate-50 p-2.5 text-xs text-slate-600 border border-slate-100">
                  <span className="font-semibold text-slate-500">Context:</span> {currentContact.notes}
                </div>
              )}
            </div>

            {/* Launch Simulator Button */}
            <div className="mt-5">
              {callState === "idle" || callState === "ended" ? (
                <Button
                  size="lg"
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-md font-bold"
                  icon={<PhoneCall className="h-4 w-4" />}
                  onClick={handleStartCall}
                >
                  {callState === "ended" ? "Start New Call Simulation" : "Dial Contact via Simulator"}
                </Button>
              ) : (
                <Button
                  size="lg"
                  variant="danger"
                  className="w-full font-bold"
                  icon={<PhoneOff className="h-4 w-4" />}
                  onClick={handleHangUp}
                >
                  Hang Up Call
                </Button>
              )}
            </div>
          </Card>

          {/* Call Metadata & Tools Info Card */}
          {(lastTool || outcome || callId) && (
            <Card className="p-4 space-y-2 text-xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="font-bold text-navy-900 uppercase tracking-wider text-[10px]">
                  Agent Brain Activity
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  Voice: Gnani Timbre (Shubham)
                </span>
              </div>
              {lastTool && (
                <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-emerald-50/50 px-3 py-2 text-emerald-950 font-semibold">
                  <Wrench className="h-3.5 w-3.5 text-emerald-600" />
                  <span>Executed Tool:</span>
                  <code className="font-mono text-emerald-800">{lastTool}</code>
                </div>
              )}
              {outcome && (
                <div className="flex items-center gap-2 rounded-lg bg-navy-900 px-3 py-2 font-semibold uppercase tracking-wider text-white">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                  Outcome: {humanize(outcome)}
                </div>
              )}
            </Card>
          )}
        </div>

        {/* RIGHT COLUMN: Realistic Phone Screen Simulator (7 cols) */}
        <div className="flex justify-center lg:col-span-7">
          {/* Smartphone Frame Outer Shell */}
          <div className="relative w-full max-w-[400px] overflow-hidden rounded-[40px] border-[10px] border-slate-800 bg-slate-950 shadow-2xl ring-1 ring-slate-900/10 min-h-[640px] flex flex-col justify-between">
            {/* Top Phone Speaker Notch & Camera */}
            <div className="absolute top-2 left-1/2 -translate-x-1/2 flex items-center gap-2 z-20">
              <div className="h-3.5 w-24 rounded-full bg-slate-900 flex items-center justify-center">
                <div className="h-1 w-10 rounded-full bg-slate-800" />
              </div>
            </div>

            {/* In-Phone Screen Content */}
            <div className="flex flex-col flex-1 pt-8 pb-4 px-5 justify-between">
              {/* Phone Status Bar */}
              <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400 px-1 pt-1">
                <span>9:41</span>
                <div className="flex items-center gap-1.5">
                  <Radio className="h-3 w-3 text-emerald-400" />
                  <span>5G</span>
                  <div className="h-2 w-4 rounded-sm border border-slate-400 p-[1px]">
                    <div className="h-full w-full bg-slate-300 rounded-[1px]" />
                  </div>
                </div>
              </div>

              {/* CENTER DISPLAY AREA */}
              {callState === "idle" && (
                <div className="flex flex-col items-center justify-center flex-1 py-12 text-center text-slate-300">
                  <div className="relative mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-slate-900 text-slate-400 border border-slate-800">
                    <User className="h-9 w-9 text-slate-400" />
                  </div>
                  <h4 className="text-lg font-bold text-white tracking-tight">
                    {currentContact.contact_name}
                  </h4>
                  <p className="font-mono text-xs text-slate-400 mt-1">
                    {currentContact.contact_phone}
                  </p>
                  <p className="mt-4 text-xs text-slate-400 max-w-[240px]">
                    Click &ldquo;Dial Contact via Simulator&rdquo; on the left to trigger the phone call.
                  </p>
                </div>
              )}

              {callState === "ringing" && (
                <div className="flex flex-col items-center justify-center flex-1 py-12 text-center">
                  <div className="relative mb-6 flex h-24 w-24 items-center justify-center">
                    <div className="absolute inset-0 animate-ping rounded-full bg-emerald-500/20" />
                    <div className="absolute inset-2 animate-pulse rounded-full bg-emerald-500/30" />
                    <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-emerald-600 text-white shadow-lg">
                      <Phone className="h-8 w-8 animate-bounce" />
                    </div>
                  </div>
                  <h4 className="text-lg font-bold text-white tracking-tight">
                    {currentContact.contact_name}
                  </h4>
                  <p className="font-mono text-xs text-slate-400 mt-1">
                    {currentContact.contact_phone}
                  </p>
                  <span className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-emerald-400 border border-slate-800">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
                    Connecting call to BARTA AI...
                  </span>
                </div>
              )}

              {callState === "connected" && (
                <div className="flex flex-col flex-1 justify-between py-2">
                  {/* Connected Header */}
                  <div className="text-center pt-2">
                    <h4 className="text-base font-extrabold text-white">
                      {currentContact.contact_name}
                    </h4>
                    <p className="font-mono text-xs text-emerald-400 font-semibold mt-0.5">
                      {formatTime(callDuration)}
                    </p>
                    <div className="mt-1 flex items-center justify-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">
                        AI Agent: Shubham (Gnani Timbre)
                      </span>
                    </div>
                  </div>

                  {/* Audio Waveform Animation when Agent Speaks */}
                  <div className="flex flex-col items-center justify-center py-4">
                    <div className="flex items-center gap-1.5 h-10">
                      {[40, 75, 50, 90, 60, 85, 45, 95, 65, 35].map((h, i) => (
                        <div
                          key={i}
                          className={`w-1 rounded-full bg-emerald-400 transition-all duration-150 ${
                            isAgentSpeaking
                              ? "animate-pulse"
                              : "opacity-30 h-2"
                          }`}
                          style={{
                            height: isAgentSpeaking ? `${h}%` : "6px",
                            animationDelay: `${i * 0.08}s`,
                          }}
                        />
                      ))}
                    </div>
                    <span className="mt-2 text-[11px] font-semibold text-slate-300">
                      {isAgentSpeaking ? "Shubham is speaking..." : sending ? "Thinking..." : "Listening to you..."}
                    </span>
                  </div>

                  {/* Live Bubble Subtitle Box on Phone */}
                  <div className="max-h-[160px] overflow-y-auto space-y-2 rounded-2xl bg-slate-900/90 p-3 border border-slate-800 text-xs">
                    {transcript.slice(-3).map((turn, idx) => (
                      <div
                        key={idx}
                        className={`flex flex-col ${
                          turn.speaker === "agent" ? "items-start" : "items-end"
                        }`}
                      >
                        <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">
                          {turn.speaker === "agent" ? "Shubham (AI)" : "You (Customer)"}
                        </span>
                        <div
                          className={`rounded-xl px-3 py-2 text-xs leading-relaxed max-w-[90%] ${
                            turn.speaker === "agent"
                              ? "bg-slate-800 text-slate-100"
                              : "bg-emerald-600 text-white font-medium"
                          }`}
                        >
                          {turn.text}
                        </div>
                      </div>
                    ))}
                    <div ref={transcriptEndRef} />
                  </div>

                  {/* Quick-reply chips */}
                  <div className="pt-2">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                      Quick Responses:
                    </p>
                    <div className="flex gap-1.5 overflow-x-auto pb-1 text-[11px] scrollbar-none">
                      {SUGGESTED_RESPONSES.map((chip, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleSendTurn(chip)}
                          className="shrink-0 rounded-full border border-slate-700 bg-slate-800/80 px-2.5 py-1 text-slate-200 hover:bg-slate-700 hover:text-white transition-colors"
                        >
                          {chip}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Customer Voice / Text Input Box */}
                  <div className="pt-2">
                    <div className="flex items-center gap-1.5 rounded-full bg-slate-900 border border-slate-700 px-2 py-1">
                      <button
                        type="button"
                        aria-label="Toggle microphone"
                        onClick={toggleSpeechRecognition}
                        className={`flex h-8 w-8 items-center justify-center rounded-full transition-colors ${
                          isMicListening
                            ? "bg-rose-600 text-white animate-pulse"
                            : "bg-slate-800 text-slate-300 hover:text-white"
                        }`}
                      >
                        {isMicListening ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
                      </button>

                      <input
                        type="text"
                        value={input}
                        disabled={sending}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleSendTurn()}
                        placeholder={isMicListening ? "Listening... Speak now" : "Type reply to Shubham..."}
                        className="flex-1 bg-transparent text-xs text-white placeholder-slate-400 focus:outline-none px-2"
                      />

                      <button
                        type="button"
                        aria-label="Send response"
                        disabled={!input.trim() || sending}
                        onClick={() => handleSendTurn()}
                        className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-600 text-white hover:bg-emerald-500 disabled:opacity-40"
                      >
                        <Send className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {callState === "ended" && (
                <div className="flex flex-col items-center justify-center flex-1 py-12 text-center">
                  <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-rose-900/30 text-rose-500 border border-rose-800/40">
                    <PhoneOff className="h-7 w-7" />
                  </div>
                  <h4 className="text-base font-bold text-white">Call Ended</h4>
                  <p className="font-mono text-xs text-slate-400 mt-1">
                    Duration: {formatTime(callDuration)}
                  </p>
                  {outcome && (
                    <div className="mt-4 rounded-xl bg-slate-900 px-3 py-2 border border-slate-800">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Final Call Outcome:
                      </p>
                      <p className="text-xs font-extrabold text-emerald-400 mt-0.5">
                        {humanize(outcome)}
                      </p>
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={handleStartCall}
                    className="mt-6 inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-5 py-2 text-xs font-bold text-white hover:bg-emerald-500 transition-colors"
                  >
                    <RotateCcw className="h-3.5 w-3.5" /> Call Again
                  </button>
                </div>
              )}

              {/* IN-CALL BOTTOM CONTROLS DOCK */}
              <div className="pt-3 border-t border-slate-900 flex items-center justify-around">
                {/* Speaker Toggle */}
                <button
                  type="button"
                  aria-label="Toggle speaker volume"
                  onClick={() => setIsSpeakerMuted((m) => !m)}
                  className={`flex h-11 w-11 flex-col items-center justify-center rounded-full transition-colors ${
                    isSpeakerMuted
                      ? "bg-rose-950 text-rose-400 border border-rose-800"
                      : "bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-white"
                  }`}
                >
                  {isSpeakerMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                </button>

                {/* Hang Up Action (Large Red Button) */}
                {callState === "connected" || callState === "ringing" ? (
                  <button
                    type="button"
                    aria-label="Hang up call"
                    onClick={handleHangUp}
                    className="flex h-14 w-14 items-center justify-center rounded-full bg-rose-600 text-white shadow-lg shadow-rose-900/50 hover:bg-rose-500 transition-transform active:scale-95"
                  >
                    <PhoneOff className="h-6 w-6" />
                  </button>
                ) : (
                  <button
                    type="button"
                    aria-label="Start call"
                    onClick={handleStartCall}
                    className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-600 text-white shadow-lg shadow-emerald-900/50 hover:bg-emerald-500 transition-transform active:scale-95"
                  >
                    <Phone className="h-6 w-6" />
                  </button>
                )}

                {/* Mic Action */}
                <button
                  type="button"
                  aria-label="Toggle mic speech"
                  onClick={toggleSpeechRecognition}
                  className={`flex h-11 w-11 flex-col items-center justify-center rounded-full transition-colors ${
                    isMicListening
                      ? "bg-rose-600 text-white animate-pulse"
                      : "bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-white"
                  }`}
                >
                  {isMicListening ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
