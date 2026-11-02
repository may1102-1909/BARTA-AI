import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AppShell } from "@/components/AppShell";

export const metadata: Metadata = {
  title: "BARTA AI · Voice Agent Workspace",
  description: "Outbound voice agent console.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0f172a",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-white font-sans antialiased text-slate-900 selection:bg-navy-900 selection:text-white">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
