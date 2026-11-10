"use client";

import React from "react";
import Link from "next/link";
import {
  AudioLines,
  ArrowRight,
  Phone,
  MessageCircle,
  Mail,
  Check,
  Languages,
  CalendarClock,
  BarChart3
} from "lucide-react";

// Reusable Primary Button matching the design spec (#0B1D3A, 10px radius, 14px weight 600)
function PrimaryButton({
  children,
  href = "/auth",
  className = "",
}: {
  children: React.ReactNode;
  href?: string;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={`inline-flex items-center justify-center gap-[12px] rounded-[10px] bg-[#0B1D3A] px-[22px] py-[15px] text-[14px] font-semibold text-white transition-all duration-150 hover:bg-[#0B1D3A]/90 active:scale-[0.98] shadow-sm ${className}`}
    >
      <span>{children}</span>
      <ArrowRight className="h-[17px] w-[17px] shrink-0" />
    </Link>
  );
}

// 43 static rounded waveform bars matching the exact visual spec
const WAVEFORM_BARS = [
  18, 24, 32, 22, 45, 52, 38, 62, 70, 58,
  42, 65, 72, 60, 48, 66, 68, 54, 38, 56,
  72, 64, 46, 58, 68, 62, 44, 52, 60, 48,
  34, 50, 56, 42, 30, 46, 52, 38, 26, 36,
  28, 22, 16
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-[#0B1D3A] font-sans selection:bg-[#0B1D3A] selection:text-white">
      {/* 1. NAVIGATION BAR */}
      <nav className="w-full border-b border-[#DFE5EE] bg-white">
        <div className="mx-auto flex max-w-[1080px] items-center justify-between px-6 py-[22px] sm:px-[60px]">
          {/* Brand Logo & Wordmark */}
          <Link href="/" className="flex items-center gap-[10px] group">
            <div className="flex h-[42px] w-[42px] items-center justify-center rounded-[12px] bg-[#0B1D3A] text-white shadow-sm transition-transform group-hover:scale-105">
              <span className="font-serif text-[26px] font-semibold leading-none select-none pb-0.5">
                बा
              </span>
            </div>
            <span className="text-[21px] font-bold tracking-tight text-[#0B1D3A]">
              barta ai
            </span>
          </Link>

          {/* Center Navigation Links */}
          <div className="hidden md:flex items-center gap-[32px] text-[14px] font-medium text-[#637086]">
            <a
              href="#features"
              className="transition-colors hover:text-[#0B1D3A]"
            >
              Features
            </a>
            <a
              href="#how-it-works"
              className="transition-colors hover:text-[#0B1D3A]"
            >
              How it works
            </a>
            <a
              href="https://github.com/may1102-1909/BARTA-AI"
              target="_blank"
              rel="noopener noreferrer"
              className="transition-colors hover:text-[#0B1D3A]"
            >
              GitHub
            </a>
          </div>

          {/* Right Primary Action */}
          <div>
            <PrimaryButton href="/auth">Explore Barta</PrimaryButton>
          </div>
        </div>
      </nav>

      {/* 2. MEET BARTA — INTRODUCTION HERO */}
      <section className="mx-auto max-w-[1080px] px-6 pt-[88px] pb-[72px] sm:px-[60px]">
        <div className="grid grid-cols-1 items-center gap-[56px] lg:grid-cols-12">
          {/* Left Column: Intro Message */}
          <div className="space-y-[26px] lg:col-span-7">
            {/* Audio Badge */}
            <div className="inline-flex items-center gap-2 rounded-full bg-[#F3F6FA] px-[12px] py-[7px] text-[12px] font-semibold uppercase tracking-wider text-[#0B1D3A]">
              <AudioLines className="h-3.5 w-3.5 text-[#4169BC]" />
              <span>A VOICE FOR YOUR BUSINESS</span>
            </div>

            {/* Display Headline */}
            <h1 className="text-[44px] sm:text-[56px] lg:text-[64px] font-semibold leading-[1.08] tracking-[-0.045em] text-[#0B1D3A]">
              More conversations. Fewer missed opportunities.
            </h1>

            {/* Supporting Copy */}
            <p className="max-w-[480px] text-[16px] leading-[1.65] tracking-[-0.01em] text-[#637086]">
              Meet Barta, your AI sales-calling assistant. Turn leads into meaningful conversations, timely follow-ups, and a clearer next step.
            </p>

            {/* Actions */}
            <div className="flex flex-wrap items-center gap-[24px] pt-1">
              <PrimaryButton href="/auth">Explore Barta</PrimaryButton>
              <a
                href="#how-it-works"
                className="text-[14px] font-semibold text-[#0B1D3A] hover:underline"
              >
                How it works
              </a>
            </div>

            {/* Supporting Note */}
            <p className="text-[13px] leading-[1.5] text-[#637086]">
              Voice, WhatsApp &amp; email. One connected conversation.
            </p>
          </div>

          {/* Right Column: Illustrative Voice-Call Preview */}
          <div className="lg:col-span-5">
            {/* Outer Pale Surround */}
            <div className="rounded-[28px] bg-[#F3F6FA] p-[18px]">
              {/* Inner White Card */}
              <div className="rounded-[18px] bg-white p-[24px] space-y-[22px]">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2 text-[13px] font-bold text-[#0B1D3A]">
                    <Phone className="h-4 w-4 text-[#4169BC]" />
                    <span>Barta voice agent</span>
                  </div>
                  <span className="rounded bg-[#F3F6FA] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#637086]">
                    DEMO PREVIEW
                  </span>
                </div>

                {/* Voice Panel (Navy) */}
                <div className="rounded-[14px] bg-[#0B1D3A] p-[24px] text-center text-white space-y-[18px]">
                  <p className="text-[13px] font-medium text-white">
                    A natural conversation. In your language.
                  </p>

                  {/* 43 Bars Waveform */}
                  <div className="flex h-[72px] items-center justify-center gap-[4px] px-2">
                    {WAVEFORM_BARS.map((height, i) => {
                      const opacity =
                        i < 4 || i > 38 ? 0.35 : i < 8 || i > 34 ? 0.65 : 1;
                      return (
                        <div
                          key={i}
                          className="w-[3px] rounded-full bg-[#B9CAE6] transition-all"
                          style={{
                            height: `${height}%`,
                            opacity,
                          }}
                        />
                      );
                    })}
                  </div>

                  <p className="text-[11px] text-[#B9CAE6] font-mono">
                    Hinglish / English / Regional languages
                  </p>
                </div>

                {/* Example Transcript */}
                <div className="space-y-3 text-[13px] leading-relaxed">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#637086]">
                      BARTA
                    </span>
                    <p className="mt-0.5 text-[#0B1D3A] font-medium">
                      &ldquo;Hi! I’m Barta, an AI assistant. Is this a good time to talk about your enquiry?&rdquo;
                    </p>
                  </div>

                  <div className="rounded-[12px] bg-[#F3F6FA] px-[16px] py-[12px] text-[#0B1D3A] font-medium">
                    &ldquo;Can you send me the details on WhatsApp?&rdquo;
                  </div>
                </div>

                {/* Example Outcome */}
                <div className="flex items-center gap-2.5 rounded-[12px] bg-[#F3F6FA] p-[14px] text-[13px] font-semibold text-[#0B1D3A]">
                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[#0B1D3A] text-white">
                    <Check className="h-3 w-3 stroke-[3]" />
                  </div>
                  <span>Next step: send product details</span>
                </div>
              </div>
            </div>

            {/* Disclaimer */}
            <p className="mt-3 text-center text-[12px] text-[#637086]">
              Illustrative conversation · Not a live call
            </p>
          </div>
        </div>
      </section>

      {/* 3. CONNECTED CHANNELS STRIP */}
      <section className="w-full bg-[#F3F6FA] py-[25px]">
        <div className="mx-auto flex max-w-[1080px] flex-col sm:flex-row items-center justify-between gap-6 px-6 sm:px-[60px]">
          <p className="text-[14px] font-semibold text-[#0B1D3A]">
            Built for the way your customers talk.
          </p>
          <div className="flex flex-wrap items-center gap-8 text-[14px] font-semibold text-[#0B1D3A]">
            <div className="flex items-center gap-[10px]">
              <Phone className="h-[18px] w-[18px] text-[#4169BC]" />
              <span>Voice calls</span>
            </div>
            <div className="flex items-center gap-[10px]">
              <MessageCircle className="h-[18px] w-[18px] text-[#4169BC]" />
              <span>WhatsApp</span>
            </div>
            <div className="flex items-center gap-[10px]">
              <Mail className="h-[18px] w-[18px] text-[#4169BC]" />
              <span>Email</span>
            </div>
          </div>
        </div>
      </section>

      {/* 4. FEATURES SECTION */}
      <section id="features" className="mx-auto max-w-[1080px] px-6 py-[80px] sm:px-[60px] space-y-[40px]">
        {/* Eyebrow & Problem Statement Header */}
        <div>
          <span className="text-[12px] font-semibold uppercase tracking-[0.15em] text-[#637086]">
            LESS BUSYWORK. MORE BUSINESS.
          </span>
          <div className="mt-3 grid grid-cols-1 gap-6 lg:grid-cols-12 lg:gap-[80px] items-start">
            <h2 className="text-[32px] sm:text-[40px] font-semibold leading-[1.15] tracking-[-0.045em] text-[#0B1D3A] lg:col-span-6">
              Your next lead shouldn’t have to wait.
            </h2>
            <p className="text-[16px] leading-[1.65] tracking-[-0.01em] text-[#637086] lg:col-span-6">
              Missed calls. Forgotten callbacks. Scattered updates. Barta is designed to keep the conversation moving, without the manual chase.
            </p>
          </div>
        </div>

        {/* Benefit Cards (Three Equal Columns) */}
        <div className="grid grid-cols-1 gap-[20px] md:grid-cols-3">
          {/* Card 1 */}
          <div className="rounded-[16px] bg-[#F3F6FA] p-[28px] space-y-[20px] flex flex-col justify-between">
            <div>
              <Languages className="h-[25px] w-[25px] text-[#4169BC] mb-5" />
              <h3 className="text-[21px] font-semibold tracking-[-0.01em] text-[#0B1D3A]">
                Conversations, not scripts.
              </h3>
              <p className="mt-3 text-[16px] leading-[1.65] text-[#637086]">
                Natural back-and-forth in Hinglish and regional languages, with room for questions and interruptions.
              </p>
            </div>
          </div>

          {/* Card 2 */}
          <div className="rounded-[16px] bg-[#F3F6FA] p-[28px] space-y-[20px] flex flex-col justify-between">
            <div>
              <CalendarClock className="h-[25px] w-[25px] text-[#4169BC] mb-5" />
              <h3 className="text-[21px] font-semibold tracking-[-0.01em] text-[#0B1D3A]">
                Follow-ups with context.
              </h3>
              <p className="mt-3 text-[16px] leading-[1.65] text-[#637086]">
                Schedule a callback and carry the earlier conversation forward. No starting from scratch.
              </p>
            </div>
          </div>

          {/* Card 3 */}
          <div className="rounded-[16px] bg-[#F3F6FA] p-[28px] space-y-[20px] flex flex-col justify-between">
            <div>
              <BarChart3 className="h-[25px] w-[25px] text-[#4169BC] mb-5" />
              <h3 className="text-[21px] font-semibold tracking-[-0.01em] text-[#0B1D3A]">
                Clarity after every call.
              </h3>
              <p className="mt-3 text-[16px] leading-[1.65] text-[#637086]">
                See lead status, transcripts, and next actions together, so you know where to focus.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. HOW IT WORKS (Full-Width Navy Section) */}
      <section id="how-it-works" className="w-full bg-[#0B1D3A] text-white py-[76px]">
        <div className="mx-auto max-w-[1080px] px-6 sm:px-[60px] space-y-[40px]">
          <div>
            <span className="text-[12px] font-semibold uppercase tracking-[0.18em] text-[#B9CAE6]">
              FROM LEAD LIST TO NEXT STEP
            </span>
            <h2 className="mt-3 max-w-[700px] text-[32px] sm:text-[40px] font-semibold leading-[1.15] tracking-[-0.045em] text-white">
              You bring the leads. Barta keeps things moving.
            </h2>
          </div>

          {/* Workflow Steps (Three Columns) */}
          <div className="grid grid-cols-1 gap-[40px] md:grid-cols-3">
            {/* Step 01 */}
            <div className="border-t border-[#4169BC]/40 pt-[24px] space-y-[16px]">
              <span className="text-[14px] font-mono font-bold text-[#B9CAE6]">
                01
              </span>
              <h3 className="text-[21px] font-semibold tracking-[-0.01em] text-white">
                Add your leads
              </h3>
              <p className="text-[16px] leading-[1.65] text-[#B9CAE6]">
                Upload your lead list and choose the product, language, and calling window.
              </p>
            </div>

            {/* Step 02 */}
            <div className="border-t border-[#4169BC]/40 pt-[24px] space-y-[16px]">
              <span className="text-[14px] font-mono font-bold text-[#B9CAE6]">
                02
              </span>
              <h3 className="text-[21px] font-semibold tracking-[-0.01em] text-white">
                Let Barta start the conversation
              </h3>
              <p className="text-[16px] leading-[1.65] text-[#B9CAE6]">
                Your voice agent qualifies interest, answers questions, and identifies the right next action.
              </p>
            </div>

            {/* Step 03 */}
            <div className="border-t border-[#4169BC]/40 pt-[24px] space-y-[16px]">
              <span className="text-[14px] font-mono font-bold text-[#B9CAE6]">
                03
              </span>
              <h3 className="text-[21px] font-semibold tracking-[-0.01em] text-white">
                Stay in the loop
              </h3>
              <p className="text-[16px] leading-[1.65] text-[#B9CAE6]">
                Review outcomes, follow-ups, and transcripts from one clear dashboard.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. EXPLORE THE PROJECT (Closing Section) */}
      <section className="mx-auto max-w-[1080px] px-6 py-[76px] sm:px-[60px]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-[40px] lg:gap-[80px]">
          <div className="space-y-[16px]">
            <h2 className="text-[32px] sm:text-[40px] font-semibold leading-[1.15] tracking-[-0.045em] text-[#0B1D3A]">
              Better conversations start here.
            </h2>
            <p className="max-w-[540px] text-[16px] leading-[1.65] text-[#637086]">
              Explore what we’re building: a more natural, connected way for businesses to follow up.
            </p>
          </div>

          <div className="shrink-0">
            <PrimaryButton href="/auth">Explore Barta</PrimaryButton>
          </div>
        </div>
      </section>

      {/* 7. FOOTER */}
      <footer className="w-full border-t border-[#DFE5EE] bg-white py-[36px]">
        <div className="mx-auto flex max-w-[1080px] flex-col sm:flex-row items-center justify-between gap-4 px-6 sm:px-[60px] text-[13px] text-[#637086]">
          {/* Brand */}
          <Link href="/" className="flex items-center gap-[10px]">
            <div className="flex h-[32px] w-[32px] items-center justify-center rounded-[8px] bg-[#0B1D3A] text-white">
              <span className="font-serif text-[18px] font-semibold leading-none select-none">
                बा
              </span>
            </div>
            <span className="text-[16px] font-bold text-[#0B1D3A]">barta ai</span>
          </Link>

          {/* Center Copy */}
          <p>Built for better conversations.</p>

          {/* Right Copyright */}
          <p>© 2026 Barta AI</p>
        </div>
      </footer>
    </div>
  );
}
