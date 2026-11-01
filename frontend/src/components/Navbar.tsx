"use client";

import React from "react";
import Link from "next/link";
import { Menu, Sparkles } from "lucide-react";
import { api } from "@/lib/api";
import { usePolling } from "@/lib/hooks";
import { LiveDot, StatusChip } from "@/components/ui/Status";
import { buttonClass } from "@/components/ui/Button";

export function Navbar({ onMenu }: { onMenu: () => void }) {
  const { data: health, error } = usePolling(() => api.getHealth(), [], { intervalMs: 15000 });
  const online = !error && !!health;

  const integrations = [
    { label: "Gnani", ok: health?.gnani_configured },
    { label: "Gemini", ok: health?.gemini_configured },
    { label: "Twilio", ok: health?.twilio_configured },
  ];

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-slate-200/80 bg-white/80 px-4 backdrop-blur-md sm:px-6 lg:px-8">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenu}
          aria-label="Open navigation"
          className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-navy-900 lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>
        <StatusChip
          tone={online ? "live" : "danger"}
          label={online ? "API live" : "API offline"}
          className="hidden sm:inline-flex"
        />
        <LiveDot tone={online ? "live" : "danger"} className="sm:hidden" />
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden items-center gap-3 rounded-lg border border-slate-200/80 bg-slate-50 px-3 py-1.5 text-[11px] font-semibold text-navy-900 md:flex">
          {integrations.map((item) => (
            <span key={item.label} className="flex items-center gap-1.5">
              <LiveDot tone={item.ok ? "navy" : "neutral"} />
              {item.label}
            </span>
          ))}
        </div>
        <Link href="/simulator" className={buttonClass("primary", "sm")}>
          <Sparkles className="h-3.5 w-3.5" />
          Simulator
        </Link>
      </div>
    </header>
  );
}
