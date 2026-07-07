"use client";

import { Bot, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { getBotResponse } from "@/lib/data/demo-data";
import type { ChatMessage } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function ChatModal({
  open,
  onOpenChange,
  initialMessage,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialMessage?: string;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open && messages.length === 0) {
      setMessages([
        {
          role: "assistant",
          content: "Hi! Ask about any product, material, quote, or order.",
        },
      ]);
    }
  }, [open, messages.length]);

  useEffect(() => {
    if (open && initialMessage) {
      sendMessage(initialMessage);
    }
  }, [open, initialMessage]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function sendMessage(text: string) {
    if (!text.trim()) return;
    setMessages((prev) => [...prev, { role: "user", content: text.trim() }]);
    setInput("");
    window.setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: getBotResponse(text) },
      ]);
    }, 400);
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 bg-black/60 z-[90] flex items-end md:items-center justify-center"
      onClick={() => onOpenChange(false)}
    >
      <div
        className="w-full md:w-[440px] bg-white rounded-t-3xl md:rounded-3xl shadow-xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center bg-navy px-5 py-3 text-white">
          <div className="flex items-center gap-x-3">
            <div className="w-8 h-8 bg-white/10 rounded-2xl flex items-center justify-center">
              <Bot className="w-4 h-4" />
            </div>
            <div>
              <div className="font-semibold">FLG Assistant</div>
              <div className="text-[10px] text-white/60">
                Real answers from 75 years of production experience
              </div>
            </div>
          </div>
          <button type="button" onClick={() => onOpenChange(false)}>
            <X className="text-white/60 hover:text-white" />
          </button>
        </div>
        <div className="h-[320px] p-4 overflow-y-auto bg-slate-50 space-y-4 text-sm">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.role === "user" ? "justify-end" : ""}`}
            >
              {msg.role === "user" ? (
                <div className="max-w-[78%] chat-bubble-user px-4 py-2 rounded-3xl text-sm">
                  {msg.content}
                </div>
              ) : (
                <div className="flex gap-2 max-w-[82%]">
                  <div className="w-5 h-5 bg-teal flex-shrink-0 text-white rounded-full flex items-center justify-center mt-px">
                    <Bot className="w-3 h-3" />
                  </div>
                  <div className="chat-bubble-bot px-3.5 py-2 rounded-3xl text-sm">
                    {msg.content}
                  </div>
                </div>
              )}
            </div>
          ))}
          <div ref={endRef} />
        </div>
        <div className="p-3 bg-white flex gap-2 border-t">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about products, materials or orders..."
            onKeyDown={(e) => e.key === "Enter" && sendMessage(input)}
          />
          <Button onClick={() => sendMessage(input)}>Send</Button>
        </div>
      </div>
    </div>
  );
}
