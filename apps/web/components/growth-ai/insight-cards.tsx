"use client";

import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertTriangle,
  TrendingUp,
  ShieldCheck,
  Package,
  ArrowUpRight,
  Zap,
  CheckCircle2,
  Clock,
  Sparkles,
  Flame,
} from "lucide-react";
import { formatINR } from "@/lib/utils";
import { api } from "@/lib/api/client";

export interface SuggestedAction {
  id: string;
  title: string;
  description: string;
  actionType: "UPDATE_FLOOR_PRICE" | "UPDATE_LISTED_PRICE" | "RESTOCK_INVENTORY" | "UPDATE_MAX_DISCOUNT";
  sku?: string;
  value: number;
  badge?: string;
}

export function ActionExecutionDialog({
  action,
  open,
  onOpenChange,
  onSuccess,
}: {
  action: SuggestedAction | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (msg: string) => void;
}) {
  const [val, setVal] = useState<number>(action?.value || 0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    if (action) {
      setVal(action.value);
      setError(null);
    }
  }, [action]);

  if (!action) return null;

  async function handleConfirm() {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.growthAi.executeAction({
        actionType: action?.actionType || "",
        sku: action?.sku,
        value: Number(val),
      });

      if (res && res.success) {
        onOpenChange(false);
        if (onSuccess) onSuccess(res.message || "Action completed successfully!");
      } else {
        setError(res?.error || "Failed to execute store action.");
      }
    } catch (err: any) {
      setError(err?.message || "An error occurred executing action.");
    } finally {
      setIsLoading(false);
    }
  }

  const actionLabels: Record<string, { label: string; unit: string; prefix: string }> = {
    UPDATE_FLOOR_PRICE: { label: "Minimum Margin Floor Price", unit: "INR", prefix: "₹" },
    UPDATE_LISTED_PRICE: { label: "Catalog Listed Price", unit: "INR", prefix: "₹" },
    RESTOCK_INVENTORY: { label: "Units to Add to Stock", unit: "units", prefix: "+" },
    UPDATE_MAX_DISCOUNT: { label: "Maximum Discount Allowed", unit: "%", prefix: "" },
  };

  const meta = actionLabels[action.actionType] || { label: "Value", unit: "", prefix: "" };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-white border-zinc-200">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
              <Zap className="w-4 h-4" />
            </div>
            <DialogTitle className="text-base font-semibold text-zinc-900">
              Confirm Store Action
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-zinc-500">
            {action.description}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {action.sku && (
            <div className="p-3 bg-zinc-50 rounded-lg border border-zinc-100 flex items-center justify-between text-xs">
              <span className="text-zinc-500">Target Product SKU:</span>
              <Badge variant="outline" className="font-mono text-zinc-800 bg-white">
                {action.sku}
              </Badge>
            </div>
          )}

          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-zinc-700">{meta.label}</Label>
            <div className="relative">
              {meta.prefix && (
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-zinc-400">
                  {meta.prefix}
                </span>
              )}
              <Input
                type="number"
                value={val}
                onChange={(e) => setVal(Number(e.target.value))}
                className={meta.prefix ? "pl-7 font-mono text-sm" : "font-mono text-sm"}
                disabled={isLoading}
              />
            </div>
          </div>

          {error && (
            <div className="p-2.5 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
              {error}
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
            className="text-xs border-zinc-200 text-zinc-700"
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isLoading || isNaN(val) || val <= 0}
            className="text-xs bg-blue-600 hover:bg-blue-700 text-white font-medium gap-1.5"
          >
            {isLoading ? "Applying..." : "Confirm & Apply Change"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function StockoutAlertCard({
  sku,
  title,
  availableStock,
  daysOfInventory,
  dailySalesBurnRate,
  onRestockClick,
}: {
  sku: string;
  title: string;
  availableStock: number;
  daysOfInventory: string;
  dailySalesBurnRate: number;
  onRestockClick?: () => void;
}) {
  const isCritical = availableStock <= 2 || daysOfInventory.includes("1 ") || daysOfInventory.includes("2 ") || daysOfInventory.includes("3 ");

  return (
    <Card className="border-zinc-200 bg-white shadow-xs overflow-hidden">
      <CardHeader className="p-4 pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-2">
              <Badge
                variant="outline"
                className={
                  isCritical
                    ? "bg-red-50 text-red-700 border-red-200 text-[10px] font-semibold gap-1"
                    : "bg-amber-50 text-amber-700 border-amber-200 text-[10px] font-semibold gap-1"
                }
              >
                {isCritical ? <Flame className="w-3 h-3 text-red-600" /> : <AlertTriangle className="w-3 h-3 text-amber-600" />}
                {isCritical ? "Critical Stockout Risk" : "Low Stock Alert"}
              </Badge>
              <span className="font-mono text-[11px] text-zinc-400 truncate">{sku}</span>
            </div>
            <CardTitle className="text-sm font-bold text-zinc-900 truncate">
              {title}
            </CardTitle>
          </div>
          <div className="text-right shrink-0">
            <div className="text-lg font-bold font-mono text-zinc-900">{availableStock} units</div>
            <div className="text-[11px] text-zinc-500">{daysOfInventory} left</div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="px-4 py-2 space-y-2">
        <div className="space-y-1">
          <div className="flex justify-between text-[11px] text-zinc-500 font-medium">
            <span>Inventory Burn Level</span>
            <span className="text-zinc-700 font-mono font-semibold">
              {dailySalesBurnRate > 0 ? `${dailySalesBurnRate} orders/day` : "Low velocity"}
            </span>
          </div>
          <Progress
            value={Math.min(100, Math.max(10, availableStock * 10))}
            className="h-1.5 bg-zinc-100"
            indicatorClassName={isCritical ? "bg-red-500" : "bg-amber-500"}
          />
        </div>
      </CardContent>

      <CardFooter className="p-4 pt-2 flex items-center justify-between border-t border-zinc-100 bg-zinc-50/50">
        <span className="text-[11px] text-zinc-500">Suggested PO: +30 units</span>
        <Button
          size="sm"
          variant="outline"
          onClick={onRestockClick}
          className="h-7 text-xs bg-white border-zinc-200 text-blue-600 hover:text-blue-700 hover:bg-blue-50 font-medium gap-1"
        >
          <Package className="w-3 h-3" />
          Restock Stock
        </Button>
      </CardFooter>
    </Card>
  );
}

export function ActionableCard({
  action,
  onExecute,
}: {
  action: SuggestedAction;
  onExecute: (action: SuggestedAction) => void;
}) {
  return (
    <div className="p-3.5 rounded-xl border border-blue-100 bg-gradient-to-r from-blue-50/70 to-indigo-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          {action.badge && (
            <Badge className="bg-blue-600 text-white text-[10px] font-semibold border-0">
              {action.badge}
            </Badge>
          )}
          <span className="text-xs font-bold text-zinc-900">{action.title}</span>
        </div>
        <p className="text-xs text-zinc-600">{action.description}</p>
      </div>

      <Button
        size="sm"
        onClick={() => onExecute(action)}
        className="shrink-0 h-8 text-xs bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-xs gap-1.5"
      >
        <Sparkles className="w-3.5 h-3.5 text-blue-200" />
        Apply Recommendation
      </Button>
    </div>
  );
}
