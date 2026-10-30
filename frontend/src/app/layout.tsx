import type { Metadata } from "next";
import "./globals.css";
import { AppShell } from "@/components/AppShell";

export const metadata: Metadata = {
  title: "BARTA ai · Outbound Voice Agent Platform",
  description: "Autonomous Outbound Voice Agent for Sales, powered by Gnani AI (Prisma & Timbre) and Gemini.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 antialiased font-sans">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}

