"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { Sparkles, User } from "lucide-react";
import { motion } from "framer-motion";

interface ChatMessageProps {
  sender: "assistant" | "user" | "system";
  content: string;
  timestamp?: string;
  children?: React.ReactNode;
}

export function ChatMessage({ sender, content, timestamp, children }: ChatMessageProps) {
  const isAssistant = sender === "assistant";
  const isUser = sender === "user";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        "w-full flex gap-3.5 items-start",
        isUser ? "justify-end" : "justify-start"
      )}
    >
      {/* Assistant Avatar */}
      {isAssistant && (
        <div className="relative flex-shrink-0 mt-0.5">
          <div className="w-8 h-8 rounded-full bg-zinc-900 text-white flex items-center justify-center shadow-xs ring-1 ring-zinc-800/10">
            <Sparkles className="w-3.5 h-3.5 text-brand-400" />
          </div>
          <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white" />
        </div>
      )}

      {/* Message Content Body */}
      <div
        className={cn(
          "flex flex-col space-y-2",
          isUser ? "items-end max-w-[82%]" : "items-start max-w-full flex-1 min-w-0"
        )}
      >
        {isUser ? (
          /* User Message Pill */
          <div className="bg-zinc-900 text-white px-4 py-2.5 rounded-2xl rounded-tr-xs shadow-xs text-sm font-normal leading-relaxed tracking-tight">
            <p className="whitespace-pre-wrap">{content}</p>
          </div>
        ) : (
          /* Assistant Editorial Block - No Box Borders */
          <div className="w-full space-y-3">
            <div className="text-[14.5px] leading-relaxed text-zinc-900 font-normal selection:bg-brand-500 selection:text-white">
              <p className="whitespace-pre-wrap">{content}</p>
            </div>

            {/* Embedded Action Children (Chips / Sliders / Buttons in the middle) */}
            {children && <div className="w-full pt-1">{children}</div>}
          </div>
        )}

        {timestamp && (
          <span className="text-[10px] text-zinc-400 px-1 font-mono tracking-tight">
            {timestamp}
          </span>
        )}
      </div>

      {/* User Avatar */}
      {isUser && (
        <div className="w-8 h-8 rounded-full bg-zinc-100 text-zinc-700 flex items-center justify-center flex-shrink-0 mt-0.5 text-xs font-semibold ring-1 ring-zinc-200">
          <User className="w-3.5 h-3.5" />
        </div>
      )}
    </motion.div>
  );
}

