"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import {
  Sparkles,
  PhoneCall,
  PhoneOff,
  Send,
  User,
  Bot,
  Wrench,
  CheckCircle2,
  CalendarClock,
  ExternalLink,
  Volume2
} from "lucide-react";
import { api } from "@/lib/api";

export default function SimulatorPage() {
  const [contactName, setContactName] = useState("Aarav Sharma");
  const [contactPhone, setContactPhone] = useState("+919876543210");
  const [contactEmail, setContactEmail] = useState("aarav.sharma@example.com");
  const [language, setLanguage] = useState("hinglish");

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [callId, setCallId] = useState<string | null>(null);
  const [transcript, setTranscript] = useState<any[]>([]);
  const [isCalling, setIsCalling] = useState(false);
  const [inputMessage, setInputMessage] = useState("");
  const [loadingTurn, setLoadingTurn] = useState(false);
  const [lastTool, setLastTool] = useState<string | null>(null);
  const [callOutcome, setCallOutcome] = useState<string | null>(null);
  const [callEnded, setCallEnded] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [transcript]);

  const handleStartCall = async () => {
    setIsCalling(true);
    setCallEnded(false);
    setCallOutcome(null);
    setLastTool(null);
    try {
      const res = await api.startSimulation({
        contact_name: contactName,
        contact_phone: contactPhone,
        contact_email: contactEmail,
        preferred_language: language,
      });
      setSessionId(res.session_id);
      setCallId(res.call_id);
      setTranscript(res.transcript || []);
    } catch (e: any) {
      alert("Error starting simulator: " + e.message);
      setIsCalling(false);
    }
  };

  const handleSendTurn = async (textToSend?: string) => {
    const text = textToSend || inputMessage;
    if (!text.trim() || !sessionId || loadingTurn || callEnded) return;

    setInputMessage("");
    setLoadingTurn(true);

    // Optimistically add user turn
    setTranscript((prev) => [
      ...prev,
      { speaker: "user", text, timestamp: new Date().toISOString() },
    ]);

    try {
      const res = await api.sendSimTurn(sessionId, text);
      if (res.tool_called) {
        setLastTool(res.tool_called);
      }
      if (res.outcome) {
        setCallOutcome(res.outcome);
      }
      if (res.call_ended) {
        setCallEnded(true);
      }
      setTranscript(res.transcript || []);
    } catch (e: any) {
      alert("Error during voice turn: " + e.message);
    } finally {
      setLoadingTurn(false);
    }
  };

  const handleEndCall = () => {
    setCallEnded(true);
    setIsCalling(false);
    setSessionId(null);
  };

  const quickReplies = [
    { label: "Price inquiry", text: "Haan interested hoon! Price kitna hai aur koi festive offer hai kya?" },
    { label: "Colors & sizes", text: "Isme kaun kaun se colors aur sizes mil jayenge?" },
    { label: "Confirm Order (COD)", text: "Theek hai ek piece order confirm kar do Cash on Delivery pe." },
    { label: "Schedule Callback", text: "Main abhi drive kar raha hoon, mujhe kal shaam ko 4 baje call karo." },
    { label: "Do Not Call", text: "Aage se mujhe kabhi call mat karna please." },
    { label: "Not interested", text: "Nahi mujhe abhi nahi chahiye, thank you." },
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2.5">
            <Sparkles className="w-6 h-6 text-indigo-600" />
            Interactive Voice Call Simulator
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Test the Gnani Prisma STT + Timbre TTS + Gemini voice loop live right from your browser.
          </p>
        </div>

        {callId && (
          <Link
            href={`/calls?call_id=${callId}`}
            className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800 bg-indigo-50 px-3 py-1.5 rounded-lg border border-indigo-100"
          >
            <span>View Call In Main Dashboard</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Side: Call Config */}
        <div className="lg:col-span-4 space-y-5">
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-card space-y-4">
            <h3 className="text-sm font-bold text-slate-900 pb-2 border-b border-slate-100">
              Customer & Call Configuration
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Customer Name</label>
                <input
                  type="text"
                  disabled={isCalling}
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 disabled:bg-slate-50"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Phone Number</label>
                <input
                  type="text"
                  disabled={isCalling}
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 font-mono disabled:bg-slate-50"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Customer Email</label>
                <input
                  type="email"
                  disabled={isCalling}
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 disabled:bg-slate-50"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Preferred Spoken Language</label>
                <select
                  disabled={isCalling}
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white text-slate-800 disabled:bg-slate-50"
                >
                  <option value="hinglish">Hinglish (Conversational Mix)</option>
                  <option value="hindi">Hindi (Pure)</option>
                  <option value="english">English (Fluent)</option>
                </select>
              </div>
            </div>

            <div className="pt-2">
              {!isCalling ? (
                <button
                  onClick={handleStartCall}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition shadow-sm"
                >
                  <PhoneCall className="w-4 h-4" />
                  <span>Start Simulated Voice Call</span>
                </button>
              ) : (
                <button
                  onClick={handleEndCall}
                  className="w-full py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition shadow-sm"
                >
                  <PhoneOff className="w-4 h-4" />
                  <span>Hang Up Call</span>
                </button>
              )}
            </div>
          </div>

          {/* Real-time Status Card */}
          {isCalling && (
            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-card space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-700">Call State</span>
                <span className={`px-2 py-0.5 rounded-full font-bold uppercase text-[10px] ${callEnded ? "bg-slate-200 text-slate-700" : "bg-emerald-100 text-emerald-800 animate-pulse"}`}>
                  {callEnded ? "Call Concluded" : "Call Connected"}
                </span>
              </div>

              {lastTool && (
                <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-xl space-y-1">
                  <div className="font-bold text-indigo-900 flex items-center gap-1">
                    <Wrench className="w-3.5 h-3.5 text-indigo-600" />
                    Tool Executed: <code className="font-mono">{lastTool}</code>
                  </div>
                  <p className="text-[11px] text-indigo-700">
                    Recorded and saved to live PostgreSQL/SQLite database.
                  </p>
                </div>
              )}

              {callOutcome && (
                <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl space-y-1">
                  <div className="font-bold text-emerald-900 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    Final Outcome: <span className="uppercase">{callOutcome.replace(/_/g, " ")}</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Side: Conversation Dialogue Window */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200/80 shadow-card flex flex-col h-[680px]">
          {/* Header */}
          <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 rounded-t-2xl">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-emerald-500 animate-ping" />
              <span className="text-xs font-bold text-slate-800">
                Live Audio & Spoken Dialogue Stream
              </span>
            </div>
            <div className="text-[11px] text-slate-400 font-mono">
              CURATED India · BARTA ai Engine
            </div>
          </div>

          {/* Transcript Scroll Area */}
          <div className="flex-1 p-6 overflow-y-auto space-y-4">
            {!isCalling && transcript.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-8 text-slate-400 space-y-3">
                <Bot className="w-12 h-12 text-slate-300" />
                <p className="text-xs font-medium max-w-sm">
                  Click <strong>Start Simulated Voice Call</strong> on the left to begin an outbound call test.
                </p>
              </div>
            ) : (
              transcript.map((turn, idx) => {
                const isAgent = turn.speaker === "agent";
                return (
                  <div
                    key={idx}
                    className={`flex gap-3 text-xs ${isAgent ? "justify-start" : "justify-end"}`}
                  >
                    {isAgent && (
                      <div className="w-8 h-8 rounded-full bg-navy-900 text-white flex items-center justify-center shrink-0 text-xs font-bold shadow-sm">
                        AI
                      </div>
                    )}

                    <div
                      className={`max-w-[75%] rounded-2xl px-4 py-3 shadow-subtle ${
                        isAgent
                          ? "bg-slate-100 text-slate-900 rounded-tl-sm border border-slate-200/60"
                          : "bg-navy-900 text-white rounded-tr-sm"
                      }`}
                    >
                      <div className="text-[10px] font-semibold opacity-70 mb-1 flex items-center gap-1.5">
                        <span>{isAgent ? "BARTA (Voice Assistant)" : contactName}</span>
                        {isAgent && <Volume2 className="w-3 h-3" />}
                      </div>
                      <p className="leading-relaxed text-[13px]">{turn.text}</p>
                    </div>

                    {!isAgent && (
                      <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center shrink-0 text-xs font-bold">
                        <User className="w-4 h-4" />
                      </div>
                    )}
                  </div>
                );
              })
            )}

            {loadingTurn && (
              <div className="flex gap-2 items-center text-xs text-slate-400 italic">
                <div className="w-2 h-2 rounded-full bg-indigo-600 animate-bounce" />
                <div className="w-2 h-2 rounded-full bg-indigo-600 animate-bounce [animation-delay:0.2s]" />
                <div className="w-2 h-2 rounded-full bg-indigo-600 animate-bounce [animation-delay:0.4s]" />
                <span>BARTA is synthesizing voice response...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompts */}
          {isCalling && !callEnded && (
            <div className="px-4 py-2 bg-slate-50 border-t border-slate-100 flex items-center gap-2 overflow-x-auto text-[11px]">
              <span className="text-slate-400 font-semibold uppercase text-[9px] shrink-0">Quick Spoken:</span>
              {quickReplies.map((qr, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendTurn(qr.text)}
                  className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-200 rounded-md text-slate-700 font-medium whitespace-nowrap transition"
                >
                  {qr.label}
                </button>
              ))}
            </div>
          )}

          {/* Input Box */}
          <div className="p-4 border-t border-slate-200 flex items-center gap-3 bg-white rounded-b-2xl">
            <input
              type="text"
              disabled={!isCalling || callEnded || loadingTurn}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSendTurn()}
              placeholder={
                !isCalling
                  ? "Start the call to begin conversation..."
                  : callEnded
                  ? "Call has ended. Click 'Start Simulated Voice Call' to dial again."
                  : "Type what the customer says (Hindi, English, Hinglish)..."
              }
              className="flex-1 px-4 py-2.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-navy-900 disabled:bg-slate-50 text-slate-800"
            />
            <button
              disabled={!isCalling || callEnded || loadingTurn || !inputMessage.trim()}
              onClick={() => handleSendTurn()}
              className="px-4 py-2.5 bg-navy-900 hover:bg-slate-800 disabled:opacity-40 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition shadow-subtle"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Speak</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
