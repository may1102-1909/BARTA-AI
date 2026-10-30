"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Sparkles, Activity, ShieldCheck } from "lucide-react";
import { api } from "@/lib/api";

export function Navbar() {
  const [health, setHealth] = useState<any>(null);

  useEffect(() => {
    api.getHealth()
      .then(setHealth)
      .catch(() => setHealth({ status: "offline" }));
  }, []);

  return (
    <header className="h-16 bg-white/80 backdrop-blur-md border-b border-slate-200/80 px-8 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center space-x-3">
        <h1 className="text-sm font-medium text-slate-700">
          Outbound Campaign Console
        </h1>
        <div className="h-4 w-px bg-slate-200" />
        <div className="flex items-center gap-1.5 text-xs text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Voice Loop Active
        </div>
      </div>

      <div className="flex items-center space-x-4">
        {/* Tech Stack Indicators */}
        <div className="hidden md:flex items-center gap-2 text-xs text-slate-500 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200/60">
          <span className="font-semibold text-slate-800">Prisma STT</span>
          <span>·</span>
          <span className="font-semibold text-slate-800">Timbre TTS</span>
          <span>·</span>
          <span className="text-indigo-600 font-medium">Gemini 2.5</span>
        </div>

        {/* Live Simulator Quick Launch */}
        <Link
          href="/simulator"
          className="flex items-center gap-2 text-xs font-semibold bg-navy-900 text-white px-3.5 py-2 rounded-lg hover:bg-slate-800 transition-colors shadow-subtle"
        >
          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
          <span>Launch Simulator</span>
        </Link>
      </div>
    </header>
  );
}

