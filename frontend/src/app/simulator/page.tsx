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
  Radio,
  BrainCircuit,
  Sparkles,
  Headphones,
  Lightbulb,
  Globe
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
    notes: "Regular customer, interested in pure organic linen kurta festival drop",
  },
  {
    contact_name: "Aarav Mehta",
    contact_phone: "+919876543210",
    contact_email: "aarav.mehta@example.com",
    preferred_language: "hindi",
    notes: "Prefers Hindi, inquiring about festive discounts and Cash on Delivery",
  },
  {
    contact_name: "Priya Nair",
    contact_phone: "+919811223344",
    contact_email: "priya.nair@example.com",
    preferred_language: "english",
    notes: "Boutique owner inquiring about wholesale orders and size charts",
  },
];

const SUGGESTED_RESPONSES = [
  "Haan Shubham, batao kya offer hai aur price kitna hai?",
  "Cash on delivery available hai kya?",
  "Theek hai, ek Ivory colour Medium size confirm kardo COD pe",
  "Mujhe WhatsApp pe naya catalog aur size chart bhej do",
  "Main abhi driving kar raha hoon, kal shaam ko call karo",
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
  const [dialogueState, setDialogueState] = useState<"agent_speaking" | "waiting_for_user" | "agent_thinking">("agent_speaking");
  const [thinkingStep, setThinkingStep] = useState<string>("Analyzing response...");
  const [callDuration, setCallDuration] = useState<number>(0);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [callId, setCallId] = useState<string | null>(null);
  const [transcript, setTranscript] = useState<TranscriptTurn[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);

  // Audio & Mic Controls
  const [isSpeakerMuted, setIsSpeakerMuted] = useState(false);
  const [isMicListening, setIsMicListening] = useState(false);
  const [speechLang, setSpeechLang] = useState<"hi-IN" | "en-IN">("hi-IN");
  const [speechStatusText, setSpeechStatusText] = useState<string>("");

  // Agent Intelligence Metadata
  const [lastThought, setLastThought] = useState<string | null>(null);
  const [lastIntent, setLastIntent] = useState<string | null>(null);
  const [lastTool, setLastTool] = useState<string | null>(null);
  const [outcome, setOutcome] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Stale-closure-free mutable state refs
  const sessionIdRef = useRef<string | null>(null);
  const callStateRef = useRef<"idle" | "ringing" | "connected" | "ended">("idle");
  const sendingRef = useRef<boolean>(false);
  const dialogueStateRef = useRef<"agent_speaking" | "waiting_for_user" | "agent_thinking">("agent_speaking");
  const isAgentSpeakingRef = useRef<boolean>(false);
  const autoSendLockRef = useRef<boolean>(false);
  const liveTranscriptRef = useRef<string>("");

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const thinkingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const recognitionRef = useRef<any>(null);
  const transcriptEndRef = useRef<HTMLDivElement>(null);

  const currentContact = contacts[selectedIdx] || contacts[0] || DEFAULT_CONTACTS[0];

  // Sync state changes into refs to eliminate stale closure bugs
  useEffect(() => {
    sessionIdRef.current = sessionId;
  }, [sessionId]);

  useEffect(() => {
    callStateRef.current = callState;
  }, [callState]);

  useEffect(() => {
    sendingRef.current = sending;
  }, [sending]);

  useEffect(() => {
    dialogueStateRef.current = dialogueState;
  }, [dialogueState]);

  // Adjust default recognition language when contact changes
  useEffect(() => {
    if (currentContact.preferred_language === "english") {
      setSpeechLang("en-IN");
    } else {
      setSpeechLang("hi-IN");
    }
  }, [currentContact.preferred_language]);

  // Auto-scroll transcript
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [transcript, dialogueState, sending]);

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

  // Dynamic Thinking Animation Cycle
  useEffect(() => {
    if (dialogueState === "agent_thinking") {
      const steps = [
        "Analyzing customer response...",
        "Evaluating customer intent & context...",
        "Formulating optimal sales strategy...",
        "Synthesizing Shubham voice (Gnani Timbre)..."
      ];
      let stepIdx = 0;
      setThinkingStep(steps[0]);
      thinkingTimerRef.current = setInterval(() => {
        stepIdx = (stepIdx + 1) % steps.length;
        setThinkingStep(steps[stepIdx]);
      }, 800);
    } else {
      if (thinkingTimerRef.current) clearInterval(thinkingTimerRef.current);
    }
    return () => {
      if (thinkingTimerRef.current) clearInterval(thinkingTimerRef.current);
    };
  }, [dialogueState]);

  // Forward declarations for clean recursive turns
  const sendTurnDirectlyRef = useRef<((text: string) => Promise<void>) | null>(null);
  const startSpeechListeningRef = useRef<(() => void) | null>(null);

  // Audio playback function using Base64 WAV from Gnani Timbre TTS
  const playAgentAudio = useCallback((base64Wav: string | null | undefined) => {
    if (!base64Wav || isSpeakerMuted) {
      setDialogueState("waiting_for_user");
      dialogueStateRef.current = "waiting_for_user";
      isAgentSpeakingRef.current = false;
      setTimeout(() => {
        if (startSpeechListeningRef.current) startSpeechListeningRef.current();
      }, 350);
      return;
    }

    try {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      const audio = new Audio("data:audio/wav;base64," + base64Wav);
      audioRef.current = audio;
      setDialogueState("agent_speaking");
      dialogueStateRef.current = "agent_speaking";
      isAgentSpeakingRef.current = true;

      audio.onended = () => {
        // Agent finished speaking: transitions to waiting for user
        isAgentSpeakingRef.current = false;
        setDialogueState("waiting_for_user");
        dialogueStateRef.current = "waiting_for_user";
        // Directly auto-open microphone so caller can reply without touching anything!
        setTimeout(() => {
          if (startSpeechListeningRef.current) startSpeechListeningRef.current();
        }, 300);
      };

      audio.onerror = () => {
        isAgentSpeakingRef.current = false;
        setDialogueState("waiting_for_user");
        dialogueStateRef.current = "waiting_for_user";
        setTimeout(() => {
          if (startSpeechListeningRef.current) startSpeechListeningRef.current();
        }, 300);
      };

      audio.play().catch((err) => {
        console.warn("Autoplay notice (user interaction required):", err);
        isAgentSpeakingRef.current = false;
        setDialogueState("waiting_for_user");
        dialogueStateRef.current = "waiting_for_user";
      });
    } catch (e) {
      console.error("Audio playback error:", e);
      isAgentSpeakingRef.current = false;
      setDialogueState("waiting_for_user");
      dialogueStateRef.current = "waiting_for_user";
    }
  }, [isSpeakerMuted]);

  // Direct Auto-Send Function: sends speech to agent immediately with NO hand interaction needed
  const sendTurnDirectly = useCallback(async (spokenText: string) => {
    const text = spokenText.trim();
    if (!text) return;
    if (sendingRef.current || autoSendLockRef.current) return;

    const currentSessionId = sessionIdRef.current;
    if (!currentSessionId || callStateRef.current !== "connected") {
      console.warn("Cannot send speech turn: call not active or no session", {
        sessionId: currentSessionId,
        callState: callStateRef.current
      });
      return;
    }

    // Set lock
    autoSendLockRef.current = true;
    sendingRef.current = true;
    setSending(true);
    setError(null);
    setSpeechStatusText("");

    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }

    // Clear live speech
    liveTranscriptRef.current = "";
    setInput("");

    // Stop mic while agent thinks and speaks
    if (recognitionRef.current) {
      try {
        recognitionRef.current.onend = null;
        recognitionRef.current.onerror = null;
        recognitionRef.current.onresult = null;
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
    }
    setIsMicListening(false);

    // Enter thinking state
    setDialogueState("agent_thinking");
    dialogueStateRef.current = "agent_thinking";

    // Immediately reflect user message in dialogue bubbles
    setTranscript((prev) => [
      ...prev,
      { speaker: "user", text, timestamp: new Date().toISOString() },
    ]);

    try {
      const res = await api.sendSimTurn(currentSessionId, text);
      if (res.thought) setLastThought(res.thought);
      if (res.intent) setLastIntent(res.intent);
      if (res.tool_called) setLastTool(res.tool_called);
      if (res.outcome) setOutcome(res.outcome);
      if (res.transcript) setTranscript(res.transcript);

      // Play synthesized Shubham voice from Gnani Timbre TTS
      if (res.audio_base64) {
        playAgentAudio(res.audio_base64);
      } else {
        setDialogueState("waiting_for_user");
        dialogueStateRef.current = "waiting_for_user";
        setTimeout(() => {
          if (startSpeechListeningRef.current) startSpeechListeningRef.current();
        }, 300);
      }

      if (res.call_ended) {
        setTimeout(() => {
          setCallState("ended");
          callStateRef.current = "ended";
        }, 3500);
      }
    } catch (err) {
      console.error("Turn processing error:", err);
      setError(err instanceof Error ? err.message : "Failed to process speech turn");
      setDialogueState("waiting_for_user");
      dialogueStateRef.current = "waiting_for_user";
      setTimeout(() => {
        if (startSpeechListeningRef.current) startSpeechListeningRef.current();
      }, 400);
    } finally {
      sendingRef.current = false;
      autoSendLockRef.current = false;
      setSending(false);
    }
  }, [playAgentAudio]);

  sendTurnDirectlyRef.current = sendTurnDirectly;

  // Fully Automated Hands-Free Speech Recognition Starter
  const startSpeechListening = useCallback(() => {
    if (callStateRef.current !== "connected") return;
    if (sendingRef.current || autoSendLockRef.current) return;
    if (dialogueStateRef.current === "agent_speaking" || isAgentSpeakingRef.current) return;

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setError("Web Speech Recognition is not supported on this browser. Please use Chrome/Edge or type your reply.");
      return;
    }

    try {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.onend = null;
          recognitionRef.current.onerror = null;
          recognitionRef.current.onresult = null;
          recognitionRef.current.stop();
        } catch {
          // ignore
        }
      }

      const recognition = new SpeechRecognition();
      recognition.lang = speechLang;
      recognition.continuous = true; // Stay listening until silence is detected
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsMicListening(true);
        liveTranscriptRef.current = "";
        setSpeechStatusText("Listening... speak now");
      };

      recognition.onresult = (event: any) => {
        let finalChunk = "";
        let interimChunk = "";

        for (let i = 0; i < event.results.length; ++i) {
          const item = event.results[i];
          if (item.isFinal) {
            finalChunk += item[0].transcript;
          } else {
            interimChunk += item[0].transcript;
          }
        }

        const fullSpeech = (finalChunk + " " + interimChunk).trim();
        if (fullSpeech) {
          liveTranscriptRef.current = fullSpeech;
          setInput(fullSpeech);
          setSpeechStatusText(`Captured: "${fullSpeech}" (sending automatically...)`);

          // AUTOMATIC ZERO-TOUCH SEND: When caller pauses for 950ms, auto-submit directly!
          if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
          silenceTimerRef.current = setTimeout(() => {
            const captured = liveTranscriptRef.current.trim();
            if (captured && !sendingRef.current && !autoSendLockRef.current) {
              console.log("Zero-touch auto-sending caller speech after silence:", captured);
              if (sendTurnDirectlyRef.current) {
                sendTurnDirectlyRef.current(captured);
              }
            }
          }, 950);
        }
      };

      recognition.onerror = (e: any) => {
        console.warn("Speech recognition error:", e.error);
        if (e.error === "no-speech") {
          return;
        }
        setIsMicListening(false);
      };

      recognition.onend = () => {
        setIsMicListening(false);
        const captured = liveTranscriptRef.current.trim();
        // If speech was captured when recognition ended, immediately send it!
        if (captured && !sendingRef.current && !autoSendLockRef.current) {
          console.log("Auto-sending caller speech on recognition finalize:", captured);
          if (sendTurnDirectlyRef.current) {
            sendTurnDirectlyRef.current(captured);
          }
        } else if (
          callStateRef.current === "connected" &&
          dialogueStateRef.current === "waiting_for_user" &&
          !sendingRef.current &&
          !isAgentSpeakingRef.current
        ) {
          // If ended due to browser idle timeout with no speech, seamlessly restart
          setTimeout(() => {
            if (
              callStateRef.current === "connected" &&
              dialogueStateRef.current === "waiting_for_user" &&
              !sendingRef.current
            ) {
              startSpeechListening();
            }
          }, 250);
        }
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.warn("Could not start speech recognition:", err);
      setIsMicListening(false);
    }
  }, [speechLang]);

  startSpeechListeningRef.current = startSpeechListening;

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

  // Manual Mic Toggle (if user wants to force-restart mic)
  const toggleSpeechRecognition = () => {
    if (isMicListening) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
      }
      setIsMicListening(false);
    } else {
      startSpeechListening();
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
    callStateRef.current = "ringing";
    setCallDuration(0);
    setTranscript([]);
    setLastTool(null);
    setLastThought(null);
    setLastIntent(null);
    setOutcome(null);
    setSpeechStatusText("");
    liveTranscriptRef.current = "";
    autoSendLockRef.current = false;
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
      sessionIdRef.current = res.session_id;

      setCallId(res.call_id);
      setTranscript(res.transcript || []);
      if (res.thought) setLastThought(res.thought);
      if (res.intent) setLastIntent(res.intent);

      // Transition to connected state
      setTimeout(() => {
        setCallState("connected");
        callStateRef.current = "connected";

        if (res.audio_base64) {
          playAgentAudio(res.audio_base64);
        } else {
          setDialogueState("waiting_for_user");
          dialogueStateRef.current = "waiting_for_user";
          startSpeechListening();
        }
      }, 1400);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to initiate call simulation");
      setCallState("idle");
      callStateRef.current = "idle";
    }
  };

  // Hang up call
  const handleHangUp = () => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    isAgentSpeakingRef.current = false;
    if (recognitionRef.current) {
      try {
        recognitionRef.current.onend = null;
        recognitionRef.current.stop();
      } catch {}
    }
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    setIsMicListening(false);
    setCallState("ended");
    callStateRef.current = "ended";
  };

  // Reset simulator
  const handleReset = () => {
    if (audioRef.current) audioRef.current.pause();
    isAgentSpeakingRef.current = false;
    if (recognitionRef.current) {
      try {
        recognitionRef.current.onend = null;
        recognitionRef.current.stop();
      } catch {}
    }
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    setCallState("idle");
    callStateRef.current = "idle";
    setDialogueState("agent_speaking");
    dialogueStateRef.current = "agent_speaking";
    setSessionId(null);
    sessionIdRef.current = null;
    setCallId(null);
    setTranscript([]);
    setCallDuration(0);
    setLastTool(null);
    setLastThought(null);
    setLastIntent(null);
    setOutcome(null);
    setError(null);
    setSpeechStatusText("");
    liveTranscriptRef.current = "";
    autoSendLockRef.current = false;
    setInput("");
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
        {/* LEFT COLUMN: CSV Upload & Contact Selector & LLM Brain (5 cols) */}
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
                Supported columns: name, phone, email, language, notes
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

          {/* Interactive Agent Brain & Reasoning Activity */}
          <Card className="p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div className="flex items-center gap-1.5">
                <BrainCircuit className="h-4 w-4 text-emerald-600" />
                <span className="font-bold text-navy-900 uppercase tracking-wider text-[11px]">
                  Agent Brain Activity (Gemini LLM)
                </span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">
                Voice: Gnani (Shubham)
              </span>
            </div>

            {/* Live LLM Thought Display */}
            {lastThought ? (
              <div className="rounded-xl border border-indigo-100 bg-indigo-50/50 p-3 space-y-1">
                <div className="flex items-center gap-1.5 text-indigo-900 text-xs font-bold">
                  <Lightbulb className="h-3.5 w-3.5 text-amber-500" />
                  <span>LLM Thought Process:</span>
                </div>
                <p className="text-xs text-indigo-950/90 leading-relaxed italic">
                  &ldquo;{lastThought}&rdquo;
                </p>
                {lastIntent && (
                  <div className="pt-1 flex items-center gap-1.5">
                    <span className="text-[10px] uppercase font-bold text-indigo-500 tracking-wider">
                      Detected Intent:
                    </span>
                    <span className="rounded bg-indigo-100 px-2 py-0.5 text-[10px] font-mono font-bold text-indigo-800">
                      {lastIntent}
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">
                LLM reasoning, thoughts, and intent analysis will appear here in real time as the conversation progresses.
              </p>
            )}

            {/* Tools & Outcomes */}
            {lastTool && (
              <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-emerald-50/50 px-3 py-2 text-emerald-950 font-semibold text-xs">
                <Wrench className="h-3.5 w-3.5 text-emerald-600" />
                <span>Executed Tool:</span>
                <code className="font-mono text-emerald-800">{lastTool}</code>
              </div>
            )}

            {outcome && (
              <div className="flex items-center gap-2 rounded-lg bg-navy-900 px-3 py-2 font-semibold uppercase tracking-wider text-white text-xs">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                Outcome: {humanize(outcome)}
              </div>
            )}
          </Card>
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
                    Click &ldquo;Dial Contact via Simulator&rdquo; on the left to trigger the interactive phone call.
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

                  {/* Dynamic Turn State Visualization */}
                  <div className="flex flex-col items-center justify-center py-2.5">
                    {/* Visualizer: Agent Speaking */}
                    {dialogueState === "agent_speaking" && (
                      <div className="flex flex-col items-center">
                        <div className="flex items-center gap-1.5 h-10">
                          {[40, 75, 50, 90, 60, 85, 45, 95, 65, 35].map((h, i) => (
                            <div
                              key={i}
                              className="w-1 rounded-full bg-emerald-400 animate-pulse transition-all duration-150"
                              style={{
                                height: `${h}%`,
                                animationDelay: `${i * 0.08}s`,
                              }}
                            />
                          ))}
                        </div>
                        <span className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-emerald-950/80 px-3 py-1 text-[11px] font-semibold text-emerald-300 border border-emerald-800">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
                          Shubham is speaking...
                        </span>
                      </div>
                    )}

                    {/* Visualizer: Agent Waiting for User's Spoken Response */}
                    {dialogueState === "waiting_for_user" && (
                      <div className="flex flex-col items-center">
                        <div className="flex items-center gap-1.5 h-10">
                          {[30, 60, 80, 50, 70, 90, 40].map((h, i) => (
                            <div
                              key={i}
                              className={`w-1 rounded-full transition-all duration-150 ${
                                isMicListening ? "bg-amber-400 animate-pulse" : "bg-slate-600 opacity-40 h-2"
                              }`}
                              style={{
                                height: isMicListening ? `${h}%` : "6px",
                                animationDelay: `${i * 0.1}s`,
                              }}
                            />
                          ))}
                        </div>
                        <span className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-amber-950/90 px-3 py-1 text-[11px] font-bold text-amber-300 border border-amber-800 shadow-sm animate-pulse">
                          <Mic className="h-3 w-3 text-amber-400 animate-bounce" />
                          {speechStatusText || "Listening to you... speak now"}
                        </span>
                        <p className="mt-1 text-[10px] text-slate-400">
                          (Zero-touch: auto-sends directly when you finish speaking)
                        </p>
                      </div>
                    )}

                    {/* Visualizer: Agent Thinking Accordingly */}
                    {dialogueState === "agent_thinking" && (
                      <div className="flex flex-col items-center">
                        <div className="flex items-center gap-1.5 h-10">
                          {[30, 60, 45, 75, 50, 70, 40].map((h, i) => (
                            <div
                              key={i}
                              className="w-1 rounded-full bg-indigo-400 animate-bounce transition-all"
                              style={{
                                height: `${h}%`,
                                animationDelay: `${i * 0.12}s`,
                              }}
                            />
                          ))}
                        </div>
                        <span className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-indigo-950/80 px-3 py-1 text-[11px] font-semibold text-indigo-300 border border-indigo-800">
                          <Sparkles className="h-3 w-3 text-indigo-400 animate-spin" />
                          {thinkingStep}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Live Bubble Subtitle Box on Phone */}
                  <div className="max-h-[160px] overflow-y-auto space-y-2 rounded-2xl bg-slate-900/90 p-3 border border-slate-800 text-xs">
                    {transcript.slice(-4).map((turn, idx) => (
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

                  {/* Quick-reply chips & Language Selector */}
                  <div className="pt-2">
                    <div className="flex items-center justify-between mb-1 text-[10px]">
                      <span className="font-bold uppercase tracking-wider text-slate-400">
                        Quick Replies:
                      </span>
                      {/* Language Toggle Pill */}
                      <div className="flex items-center gap-1 text-[10px] bg-slate-900 px-2 py-0.5 rounded-full border border-slate-800">
                        <Globe className="h-2.5 w-2.5 text-slate-400" />
                        <button
                          type="button"
                          onClick={() => setSpeechLang("hi-IN")}
                          className={`font-semibold px-1 rounded ${
                            speechLang === "hi-IN" ? "text-emerald-400 font-bold" : "text-slate-500 hover:text-slate-300"
                          }`}
                        >
                          Hindi/Hinglish
                        </button>
                        <span className="text-slate-600">|</span>
                        <button
                          type="button"
                          onClick={() => setSpeechLang("en-IN")}
                          className={`font-semibold px-1 rounded ${
                            speechLang === "en-IN" ? "text-emerald-400 font-bold" : "text-slate-500 hover:text-slate-300"
                          }`}
                        >
                          English
                        </button>
                      </div>
                    </div>
                    <div className="flex gap-1.5 overflow-x-auto pb-1 text-[11px] scrollbar-none">
                      {SUGGESTED_RESPONSES.map((chip, idx) => (
                        <button
                          key={idx}
                          type="button"
                          disabled={sending || dialogueState === "agent_thinking"}
                          onClick={() => sendTurnDirectly(chip)}
                          className="shrink-0 rounded-full border border-slate-700 bg-slate-800/80 px-2.5 py-1 text-slate-200 hover:bg-slate-700 hover:text-white disabled:opacity-40 transition-colors"
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
                        disabled={sending || dialogueState === "agent_thinking"}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && sendTurnDirectly(input)}
                        placeholder={
                          dialogueState === "agent_thinking"
                            ? "Shubham is thinking..."
                            : isMicListening
                            ? "Listening to you... speak now"
                            : "Speak or type your reply..."
                        }
                        className="flex-1 bg-transparent text-xs text-white placeholder-slate-400 focus:outline-none px-2"
                      />

                      <button
                        type="button"
                        aria-label="Send response"
                        disabled={!input.trim() || sending || dialogueState === "agent_thinking"}
                        onClick={() => sendTurnDirectly(input)}
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
