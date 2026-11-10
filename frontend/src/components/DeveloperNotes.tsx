"use client";

import React, { useState } from "react";
import Image from "next/image";

export default function DeveloperNotes() {
  const [isHovered, setIsHovered] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent) => {
    setIsHovered(true);
    setMousePos({ x: e.clientX, y: e.clientY });
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
  };

  const isNearRightEdge =
    typeof window !== "undefined" && mousePos.x > window.innerWidth - 180;

  return (
    <section
      id="developer-notes"
      className="relative w-full bg-[#08162B] py-[90px] text-white overflow-hidden selection:bg-[#4169BC] selection:text-white"
    >
      {/* Background subtle ambient glow */}
      <div className="pointer-events-none absolute -top-32 left-1/2 h-[340px] w-[640px] -translate-x-1/2 rounded-full bg-[#4169BC]/15 blur-[120px]" />
      <div className="pointer-events-none absolute -bottom-32 right-1/4 h-[280px] w-[460px] rounded-full bg-[#0B1D3A]/60 blur-[130px]" />

      <div className="relative mx-auto max-w-[1080px] px-6 sm:px-[60px]">
        {/* Section Header */}
        <div className="mx-auto max-w-[620px] text-center space-y-2 mb-14 sm:mb-16">
          <div className="inline-flex items-center gap-2">
            <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.22em] text-[#B9CAE6]">
              DEVELOPER NOTES
            </span>
          </div>

          <h2 className="text-[32px] sm:text-[40px] font-bold tracking-tight text-white leading-[1.15]">
            Behind the code.
          </h2>

          <p className="text-[14px] sm:text-[15px] leading-relaxed text-[#B9CAE6]/80 max-w-[540px] mx-auto">
            Engineering rationale and core design decisions behind BARTA ai.
          </p>
        </div>

        {/* Floating Cursor Pill Bubble (tracks cursor on hover) */}
        {isHovered && (
          <div
            style={{
              position: "fixed",
              left: isNearRightEdge ? mousePos.x - 170 : mousePos.x + 14,
              top: mousePos.y - 14,
              pointerEvents: "none",
              zIndex: 999999,
              background: "#4169BC",
              color: "#FFFFFF",
              borderRadius: 9999,
              padding: "6px 14px",
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: "-0.01em",
              fontFamily:
                'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              boxShadow:
                "0 10px 28px rgba(0, 0, 0, 0.45), 0 2px 10px rgba(65, 105, 188, 0.5)",
              border: "1px solid rgba(185, 202, 230, 0.35)",
              transform: "translate3d(0, 0, 0)",
              whiteSpace: "nowrap",
              userSelect: "none",
              transition: "opacity 0.1s ease",
            }}
          >
            <svg
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="currentColor"
              style={{ flexShrink: 0 }}
            >
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
            </svg>
            <span className="font-mono">may1102-1909</span>
            <span
              style={{
                fontSize: 13,
                fontWeight: 800,
                transform: "translateY(-0.5px)",
              }}
            >
              ↗
            </span>
          </div>
        )}

        {/* Main Minimal Card */}
        <div
          className="relative mx-auto"
          style={{
            maxWidth: 720,
            margin: "36px auto 0",
            position: "relative",
            background: "#0B1D3A",
            border: "1px solid #1E3760",
            borderRadius: "18px 18px 36px 36px",
            boxShadow:
              "0 24px 70px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(65, 105, 188, 0.2)",
            padding: "44px 32px 40px",
          }}
        >
          {/* THE SINGLE STICKER AT FULL TOP-LEFT CORNER */}
          <a
            href="https://github.com/may1102-1909"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="GitHub Profile - may1102-1909"
            onMouseEnter={handleMouseMove}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            className="group"
            style={{
              position: "absolute",
              top: -52,
              left: -26,
              width: 108,
              height: 108,
              zIndex: 30,
              cursor: "pointer",
              textDecoration: "none",
              display: "block",
              outline: "none",
            }}
          >
            <div
              style={{
                width: "100%",
                height: "100%",
                position: "relative",
                transform: isHovered
                  ? "rotate(-3deg) scale(1.12)"
                  : "rotate(-7deg) scale(1)",
                filter: isHovered
                  ? "drop-shadow(0 0 22px rgba(65, 105, 188, 0.75)) drop-shadow(0 16px 32px rgba(0, 0, 0, 0.85))"
                  : "drop-shadow(0 14px 28px rgba(0, 0, 0, 0.75))",
                transition:
                  "transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1), filter 0.25s ease",
                userSelect: "none",
              }}
            >
              <Image
                src="/dev-sticker.png"
                alt="may1102-1909"
                fill
                sizes="108px"
                className="object-contain"
                priority
                draggable={false}
              />
            </div>
          </a>

          {/* Clean Minimal Body Copy matching BARTA's Apple-inspired aesthetic */}
          <div className="space-y-6 pt-2">
            <p className="text-[15px] sm:text-[16px] leading-[1.7] text-[#E2EAF4]">
              Outbound sales calls in India have an instant drop-off if the voice lags, hallucinates, or sounds robotic. BARTA ai was architected from scratch to deliver natural, low-latency conversations across Hindi, English, and Hinglish under strict business guardrails.
            </p>

            <div className="space-y-4 border-l border-[#4169BC]/40 pl-5 text-[14px] leading-[1.7] text-[#B9CAE6]">
              <p>
                <strong className="text-white font-semibold">Sub-1.5s live response:</strong> Raw 8 kHz linear PCM audio streams over WebSocket directly into <strong className="text-white font-medium">Gnani Prisma STT</strong>, orchestrated sentence-by-sentence with <strong className="text-white font-medium">Gemini 2.5 Flash</strong>, and synthesized through <strong className="text-white font-medium">Gnani Timbre TTS</strong>—handling fast code-mixed speech without batch delay.
              </p>

              <p>
                <strong className="text-white font-semibold">Instant 250ms barge-in:</strong> Telephony audio buffers flush the millisecond a caller interrupts—halting speech synthesis immediately so the conversation stays responsive rather than talking over the customer.
              </p>

              <p>
                <strong className="text-white font-semibold">Contextual callbacks in IST:</strong> When leads ask to talk later, BARTA logs the conversation summary, respects regulatory calling hours, and re-dials at the promised time with full prior context intact.
              </p>

              <p>
                <strong className="text-white font-semibold">Frictionless closure:</strong> Instead of collecting payments over cold voice calls, BARTA triggers <code className="text-[#E2EAF4] bg-[#122444] px-1.5 py-0.5 rounded text-[12px] border border-[#4169BC]/30">confirm_order</code> mid-call to dispatch single-use 72-hour fulfillment tokens via WhatsApp and email, updating orders on the dashboard in real time.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
