"use client";

import { Bot } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { getBotResponse } from "@/lib/data/demo-data";
import type { ChatMessage } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const QUICK_REPLIES = [
  "How do I quote packaging or kits?",
  "Quote estimate for labels",
  "Do you do serialized electronics labels?",
  "Where do I sign in as a customer?",
];

export function ChatWidget({
  className,
  initialMessage,
}: {
  className?: string;
  initialMessage?: string;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content:
        "Hi — this is the Summit demo assistant. Ask about product types or start a self-serve quote. Numbers are EXAMPLE stubs.",
    },
  ]);
  const [input, setInput] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (initialMessage) {
      sendMessage(initialMessage);
    }
  }, [initialMessage]);

  function sendMessage(text: string) {
    if (!text.trim()) return;
    setMessages((prev) => [...prev, { role: "user", content: text.trim() }]);
    setInput("");
    window.setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: getBotResponse(text) },
      ]);
    }, 450);
  }

  return (
    <div
      className={cn(
        "bg-white border border-slate-200 rounded-3xl shadow-sm p-1 max-w-4xl",
        className
      )}
    >
      <div className="flex items-center justify-between px-6 pt-5 pb-3">
        <div className="flex items-center gap-x-3">
          <div className="w-8 h-8 bg-teal rounded-2xl flex items-center justify-center">
            <Bot className="text-white w-4 h-4" />
          </div>
          <div>
            <div className="font-semibold">Summit assistant</div>
            <div className="text-xs text-teal">
              Demo • EXAMPLE catalog only
            </div>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="rounded-full text-xs text-slate-500"
          onClick={() =>
            setMessages([
              {
                role: "assistant",
                content: "Chat reset. How can I help?",
              },
            ])
          }
        >
          Reset
        </Button>
      </div>

      <div className="h-[380px] md:h-[420px] bg-slate-50 mx-1 rounded-2xl overflow-y-auto p-4 space-y-4 text-sm border">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={cn("flex", msg.role === "user" && "justify-end")}
          >
            {msg.role === "user" ? (
              <div className="max-w-[80%] chat-bubble-user px-4 py-2.5 rounded-3xl text-sm">
                {msg.content}
              </div>
            ) : (
              <div className="max-w-[82%] flex gap-2">
                <div className="w-6 h-6 mt-0.5 bg-teal text-white flex-shrink-0 rounded-xl flex items-center justify-center">
                  <Bot className="w-3 h-3" />
                </div>
                <div className="chat-bubble-bot px-4 py-2.5 rounded-3xl text-sm">
                  {msg.content}
                </div>
              </div>
            )}
          </div>
        ))}
        <div ref={endRef} />
      </div>

      <div className="px-4 pt-4 pb-1 flex flex-wrap gap-2">
        {QUICK_REPLIES.map((reply) => (
          <button
            key={reply}
            type="button"
            onClick={() => sendMessage(reply)}
            className="text-xs bg-white border hover:bg-slate-100 px-4 py-1.5 rounded-2xl text-slate-700"
          >
            {reply.split(" ").slice(0, 3).join(" ")}…
          </button>
        ))}
      </div>

      <div className="p-4 flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about materials, pricing, lead times, or products..."
          onKeyDown={(e) => e.key === "Enter" && sendMessage(input)}
        />
        <Button onClick={() => sendMessage(input)}>Send</Button>
      </div>
    </div>
  );
}
