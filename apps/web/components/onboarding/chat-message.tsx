import React from "react";
import { cn } from "@/lib/utils";
import { Bot, User } from "lucide-react";

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
    <div
      className={cn(
        "flex gap-3 max-w-[88%] text-sm",
        isUser ? "ml-auto flex-row-reverse" : "mr-auto"
      )}
    >
      {/* Avatar */}
      <div
        className={cn(
          "w-8 h-8 rounded flex items-center justify-center flex-shrink-0 text-xs font-semibold select-none",
          isAssistant ? "bg-[#0C2340] text-white" : "bg-[#0C83FD] text-white"
        )}
      >
        {isAssistant ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
      </div>

      {/* Bubble */}
      <div className="space-y-2">
        <div
          className={cn(
            "p-4 rounded-md border text-sm leading-relaxed",
            isUser
              ? "bg-[#0C83FD] text-white border-[#0266D6]"
              : "bg-white text-surface-900 border-surface-200"
          )}
        >
          <p className="whitespace-pre-wrap">{content}</p>
        </div>

        {/* Embedded action/component if any */}
        {children && <div className="pt-1">{children}</div>}

        {timestamp && (
          <p className={cn("text-[10px] text-surface-400 px-1", isUser ? "text-right" : "text-left")}>
            {timestamp}
          </p>
        )}
      </div>
    </div>
  );
}
