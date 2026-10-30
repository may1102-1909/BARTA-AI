"use client";

import React, { useEffect, useState } from "react";
import {
  PhoneCall,
  Clock,
  User,
  Bot,
  Filter,
  CheckCircle2,
  CalendarClock,
  XCircle,
  HelpCircle,
  ArrowRight
} from "lucide-react";
import { api } from "@/lib/api";

export default function CallsPage() {
  const [calls, setCalls] = useState<any[]>([]);
  const [selectedCallId, setSelectedCallId] = useState<string | null>(null);
  const [callDetail, setCallDetail] = useState<any | null>(null);
  const [outcomeFilter, setOutcomeFilter] = useState<string>("");
  const [loadingDetail, setLoadingDetail] = useState(false);

  const loadCalls = async () => {
    try {
      const data = await api.getCalls({
        outcome: outcomeFilter || undefined,
        limit: 100,
      });
      setCalls(data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadCalls();
  }, [outcomeFilter]);

  const handleSelectCall = async (id: string) => {
    setSelectedCallId(id);
    setLoadingDetail(true);
    try {
      const detail = await api.getCallDetail(id);
      setCallDetail(detail);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingDetail(false);
    }
  };

  const getOutcomeBadge = (outcome: string) => {
    switch (outcome) {
      case "order_confirmed":
        return <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-semibold text-[10px] uppercase">Order Confirmed</span>;
      case "callback_requested":
        return <span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-semibold text-[10px] uppercase">Callback Requested</span>;
      case "interested":
        return <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full font-semibold text-[10px] uppercase">Interested</span>;
      case "do_not_call":
        return <span className="bg-red-100 text-red-800 px-2 py-0.5 rounded-full font-semibold text-[10px] uppercase">Do Not Call</span>;
      case "not_interested":
        return <span className="bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full font-semibold text-[10px] uppercase">Not Interested</span>;
      case "no_answer":
        return <span className="bg-orange-100 text-orange-800 px-2 py-0.5 rounded-full font-semibold text-[10px] uppercase">No Answer</span>;
      default:
        return <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-semibold text-[10px] uppercase">In Progress</span>;
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            Calls & Full Transcripts
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Complete call transcripts, AI qualification summaries, and conversational outcomes.
          </p>
        </div>

        {/* Outcome Filter */}
        <div className="flex items-center gap-2 text-xs">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={outcomeFilter}
            onChange={(e) => setOutcomeFilter(e.target.value)}
            className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-700 font-medium focus:outline-none"
          >
            <option value="">All Call Outcomes</option>
            <option value="order_confirmed">Order Confirmed</option>
            <option value="interested">Interested</option>
            <option value="callback_requested">Callback Requested</option>
            <option value="not_interested">Not Interested</option>
            <option value="do_not_call">Do Not Call (DNC)</option>
            <option value="no_answer">No Answer</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Calls Table */}
        <div className={`${selectedCallId ? "lg:col-span-6" : "lg:col-span-12"} transition-all duration-200`}>
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-100">
                  <tr>
                    <th className="py-3 px-4">Contact</th>
                    <th className="py-3 px-4">Outcome</th>
                    <th className="py-3 px-4">Duration</th>
                    <th className="py-3 px-4">Date / Time (IST)</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {calls.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-400">
                        No calls found for this filter.
                      </td>
                    </tr>
                  ) : (
                    calls.map((c) => (
                      <tr
                        key={c.id}
                        onClick={() => handleSelectCall(c.id)}
                        className={`hover:bg-slate-50 cursor-pointer transition ${
                          selectedCallId === c.id ? "bg-slate-50/90 font-medium" : ""
                        }`}
                      >
                        <td className="py-3.5 px-4 font-semibold text-slate-900">
                          {c.contact_name}
                          <span className="block text-[11px] text-slate-400 font-normal">{c.contact_phone}</span>
                        </td>
                        <td className="py-3.5 px-4">{getOutcomeBadge(c.outcome)}</td>
                        <td className="py-3.5 px-4 font-mono">{c.duration_sec}s</td>
                        <td className="py-3.5 px-4 text-slate-500">{c.started_at || "Recent"}</td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSelectCall(c.id);
                            }}
                            className="text-indigo-600 hover:text-indigo-800 font-semibold"
                          >
                            Transcript →
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Detailed Transcript Drawer */}
        {selectedCallId && (
          <div className="lg:col-span-6 bg-white rounded-2xl border border-slate-200/80 shadow-card p-6 space-y-5 animate-in fade-in duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Call Details & Transcript
                </h3>
                <p className="text-xs text-slate-400 font-mono mt-0.5">ID: {selectedCallId.slice(0, 16)}...</p>
              </div>
              <button
                onClick={() => setSelectedCallId(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-semibold p-1"
              >
                ✕
              </button>
            </div>

            {loadingDetail ? (
              <div className="py-12 text-center text-xs text-slate-400">Loading transcript...</div>
            ) : callDetail ? (
              <div className="space-y-4">
                {/* Meta summary chips */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-900 text-sm">{callDetail.contact_name}</span>
                    {getOutcomeBadge(callDetail.outcome)}
                  </div>
                  <div className="text-slate-500 flex flex-wrap gap-3 text-[11px]">
                    <span>Phone: <strong>{callDetail.contact_phone}</strong></span>
                    <span>·</span>
                    <span>Language: <strong>{callDetail.language_preferred}</strong></span>
                    <span>·</span>
                    <span>Duration: <strong>{callDetail.duration_sec}s</strong></span>
                  </div>
                  <div className="pt-2 text-slate-700 leading-relaxed font-normal border-t border-slate-200/60 mt-2">
                    <span className="font-semibold text-slate-900">AI Summary: </span>
                    {callDetail.summary}
                  </div>
                </div>

                {/* Turn-by-Turn Transcript */}
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
                    Spoken Dialogue Transcript
                  </h4>
                  <div className="space-y-3 max-h-[460px] overflow-y-auto pr-2">
                    {callDetail.transcript?.length === 0 ? (
                      <p className="text-xs text-slate-400 italic">No spoken dialogue recorded for this call.</p>
                    ) : (
                      callDetail.transcript.map((turn: any, idx: number) => {
                        const isAgent = turn.speaker === "agent";
                        return (
                          <div
                            key={idx}
                            className={`flex gap-3 text-xs ${isAgent ? "justify-start" : "justify-end"}`}
                          >
                            {isAgent && (
                              <div className="w-7 h-7 rounded-full bg-navy-900 text-white flex items-center justify-center shrink-0 text-[10px] font-bold">
                                AI
                              </div>
                            )}

                            <div
                              className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${
                                isAgent
                                  ? "bg-slate-100 text-slate-900 rounded-tl-sm"
                                  : "bg-indigo-600 text-white rounded-tr-sm"
                              }`}
                            >
                              <div className="text-[10px] font-medium opacity-70 mb-0.5">
                                {isAgent ? "BARTA Voice Assistant" : callDetail.contact_name}
                              </div>
                              <p className="leading-relaxed">{turn.text}</p>
                            </div>

                            {!isAgent && (
                              <div className="w-7 h-7 rounded-full bg-slate-300 text-slate-700 flex items-center justify-center shrink-0 text-[10px] font-bold">
                                <User className="w-3.5 h-3.5" />
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
