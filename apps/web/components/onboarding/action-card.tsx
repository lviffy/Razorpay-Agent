import React from "react";
import { cn } from "@/lib/utils";

interface ActionOption {
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
}

export function ActionCard({ title, options, className }: ActionCardProps) {
  return (
    <div className={cn("bg-surface-50 border border-surface-200 rounded-md p-3 space-y-2", className)}>
      {title && <p className="text-xs font-semibold text-surface-700 px-1">{title}</p>}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {options.map((opt) => (
          <button
            key={opt.id}
            onClick={opt.onClick}
            disabled={opt.disabled}
            className="flex items-start text-left gap-2.5 p-3 rounded-md bg-white border border-surface-200 hover:border-brand-500 hover:bg-blue-50/40 active:bg-blue-50 transition-colors disabled:opacity-50 disabled:pointer-events-none group"
          >
            {opt.icon && <div className="mt-0.5 text-brand-500 flex-shrink-0">{opt.icon}</div>}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-1">
                <span className="text-xs font-semibold text-surface-900 group-hover:text-brand-600 truncate">
                  {opt.label}
                </span>
                {opt.badge && (
                  <span className="text-[10px] px-1.5 py-0.2 bg-surface-100 text-surface-600 border border-surface-200 rounded">
                    {opt.badge}
                  </span>
                )}
              </div>
              {opt.description && (
                <p className="text-[11px] text-surface-500 mt-0.5 leading-tight">{opt.description}</p>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
