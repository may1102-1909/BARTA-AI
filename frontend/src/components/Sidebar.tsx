"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Megaphone,
  PhoneCall,
  ShoppingBag,
  CalendarClock,
  Sparkles,
  ExternalLink,
  Bot
} from "lucide-react";

export function Sidebar() {
  const pathname = usePathname();

  const navItems = [
    { label: "Overview", href: "/", icon: LayoutDashboard },
    { label: "Campaigns", href: "/campaigns", icon: Megaphone },
    { label: "Calls & Transcripts", href: "/calls", icon: PhoneCall },
    { label: "Orders", href: "/orders", icon: ShoppingBag },
    { label: "Callbacks", href: "/callbacks", icon: CalendarClock },
    { label: "Voice Simulator", href: "/simulator", icon: Sparkles },
  ];

  return (
    <aside className="w-64 bg-white border-r border-slate-200/80 flex flex-col justify-between min-h-screen select-none">
      <div>
        {/* Brand Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-navy-900 flex items-center justify-center text-white shadow-sm">
              <Bot className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <div className="text-base font-semibold tracking-tight text-slate-900 flex items-center gap-1.5">
                BARTA <span className="text-xs bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded font-mono font-medium">ai</span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium">Outbound Voice Agent</p>
            </div>
          </Link>
        </div>

        {/* Navigation items */}
        <div className="px-3 py-4 space-y-1">
          <div className="px-3 mb-2 text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
            Menu
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center space-x-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? "bg-slate-900 text-white shadow-subtle"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? "text-indigo-400" : "text-slate-400"}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Footer Info & Product Anchor */}
      <div className="p-4 border-t border-slate-100">
        <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-800">
            <span>CURATED India</span>
            <a
              href="https://curatedindia.vercel.app"
              target="_blank"
              rel="noreferrer"
              className="text-indigo-600 hover:text-indigo-800 flex items-center gap-0.5 text-[11px]"
            >
              Store <ExternalLink className="w-3 h-3" />
            </a>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Voice loop powered by <strong>Gnani AI</strong> (Prisma STT + Timbre TTS).
          </p>
        </div>
      </div>
    </aside>
  );
}
