"use client";

import { Inter, Space_Grotesk } from "next/font/google";
import { useState } from "react";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { ChatModal } from "@/components/chat/chat-modal";
import { Toaster } from "@/components/ui/toaster";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["500", "600"],
  variable: "--font-space-grotesk",
});

export function MarketingShell({ children }: { children: React.ReactNode }) {
  const [chatOpen, setChatOpen] = useState(false);
  const [chatSeed, setChatSeed] = useState<string | undefined>();

  return (
    <div className={`${inter.variable} ${spaceGrotesk.variable}`}>
      <SiteHeader
        onOpenChat={() => {
          setChatSeed(undefined);
          setChatOpen(true);
        }}
      />
      <main className="max-w-screen-2xl mx-auto">{children}</main>
      <SiteFooter />
      <ChatModal
        open={chatOpen}
        onOpenChange={setChatOpen}
        initialMessage={chatSeed}
      />
      <Toaster />
    </div>
  );
}

export { inter, spaceGrotesk };
