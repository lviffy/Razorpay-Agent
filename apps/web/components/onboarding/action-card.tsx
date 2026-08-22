"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

export interface ActionOption {
  id: string;
  label: string;
  description?: string;
  badge?: string;
  icon?: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
}

interface ActionCardProps {
  title?: string;
  options: ActionOption[];
  className?: string;
  layout?: "grid" | "stack" | "pills";
}

export function ActionCard({
  title,
  options,
  className,
  layout = "stack",
}: ActionCardProps) {
  return (
    <div className={cn("w-full space-y-2.5 my-1", className)}>
      {title && (
        <p className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider pl-0.5">
          {title}
        </p>
      )}

      {layout === "pills" ? (
        /* Horizontal flow of tactile chips */
        <div className="flex flex-wrap items-center gap-2">
          {options.map((opt, i) => (
            <motion.button
              key={opt.id}
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05, duration: 0.2 }}
              onClick={opt.onClick}
              disabled={opt.disabled}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full bg-white border border-zinc-200/90 hover:border-brand-500 hover:bg-brand-50/40 text-xs font-medium text-zinc-800 hover:text-brand-700 shadow-2xs hover:shadow-xs transition-all active:scale-[0.98] disabled:opacity-50 group cursor-pointer"
            >
              {opt.icon && <span className="text-zinc-500 group-hover:text-brand-600 transition-colors">{opt.icon}</span>}
              <span>{opt.label}</span>
              {opt.badge && (
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-zinc-100 text-zinc-600 group-hover:bg-brand-100 group-hover:text-brand-800 font-mono">
                  {opt.badge}
                </span>
              )}
            </motion.button>
          ))}
        </div>
      ) : (
        /* Sleek interactive cards with zero outer container boxing */
        <div className={cn(
          "gap-2.5",
          layout === "grid" ? "grid grid-cols-1 sm:grid-cols-2" : "flex flex-col space-y-2"
        )}>
          {options.map((opt, i) => (
            <motion.button
              key={opt.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06, duration: 0.22 }}
              onClick={opt.onClick}
              disabled={opt.disabled}
              className="w-full flex items-center justify-between p-3.5 rounded-xl bg-white border border-zinc-200/80 hover:border-brand-500/60 hover:bg-brand-50/20 hover:shadow-xs transition-all active:scale-[0.99] disabled:opacity-50 text-left group cursor-pointer"
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                {opt.icon && (
                  <div className="w-8 h-8 rounded-lg bg-zinc-100/80 group-hover:bg-brand-100/70 text-zinc-600 group-hover:text-brand-600 flex items-center justify-center flex-shrink-0 transition-colors">
                    {opt.icon}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-zinc-900 group-hover:text-brand-700 transition-colors truncate">
                      {opt.label}
                    </span>
                    {opt.badge && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-brand-50 text-brand-700 border border-brand-200/60 font-mono font-medium flex-shrink-0">
                        {opt.badge}
                      </span>
                    )}
                  </div>
                  {opt.description && (
                    <p className="text-[11px] text-zinc-500 group-hover:text-zinc-600 mt-0.5 leading-snug">
                      {opt.description}
                    </p>
                  )}
                </div>
              </div>

              <div className="w-6 h-6 rounded-full flex items-center justify-center text-zinc-300 group-hover:text-brand-600 group-hover:translate-x-0.5 transition-all flex-shrink-0 ml-2">
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </motion.button>
          ))}
        </div>
      )}
    </div>
  );
}

