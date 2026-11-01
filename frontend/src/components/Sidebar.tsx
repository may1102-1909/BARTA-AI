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
  Bot,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { label: "Overview", href: "/", icon: LayoutDashboard },
  { label: "Campaigns", href: "/campaigns", icon: Megaphone },
  { label: "Calls", href: "/calls", icon: PhoneCall },
  { label: "Orders", href: "/orders", icon: ShoppingBag },
  { label: "Callbacks", href: "/callbacks", icon: CalendarClock },
  { label: "Simulator", href: "/simulator", icon: Sparkles },
];

export function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const pathname = usePathname();

  return (
    <>
      <div
        onClick={onClose}
        className={cn(
          "fixed inset-0 z-40 bg-navy-950/40 backdrop-blur-sm transition-opacity lg:hidden",
          open ? "opacity-100" : "pointer-events-none opacity-0"
        )}
      />
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-slate-200/80 bg-white transition-transform duration-200 lg:sticky lg:top-0 lg:h-screen lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-14 items-center justify-between border-b border-slate-200/80 px-5">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-navy-900 text-white">
              <Bot className="h-4 w-4" />
            </div>
            <span className="text-sm font-bold tracking-tight text-navy-900">
              BARTA <span className="font-mono text-xs font-medium text-slate-500">ai</span>
            </span>
          </Link>
          <button
            onClick={onClose}
            aria-label="Close navigation"
            className="rounded-md p-1 text-slate-400 hover:text-navy-900 lg:hidden"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <nav className="flex-1 space-y-0.5 px-3 py-4">
          {NAV.map(({ label, href, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  active ? "bg-navy-900 text-white shadow-subtle" : "text-slate-600 hover:bg-slate-50 hover:text-navy-900"
                )}
              >
                <Icon className={cn("h-4 w-4", active ? "text-white" : "text-slate-400")} />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-slate-200/80 px-5 py-4 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
          Voice agent workspace
        </div>
      </aside>
    </>
  );
}
