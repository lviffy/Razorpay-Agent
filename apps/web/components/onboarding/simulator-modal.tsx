"use client";

import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Bot, User, CheckCircle2 } from "lucide-react";

interface SimulatorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function SimulatorModal({ open, onOpenChange, onSuccess }: SimulatorModalProps) {
  const [step, setStep] = useState(1);

  const simulationEvents = [
    {
      sender: "customer",
      text: "Find running shoes under ₹4,000 in size UK 9.",
      time: "10:00:01",
    },
    {
      sender: "assistant",
      text: "Found Nike Pegasus 40 (Stock: 18 units) listed at ₹3,999. Would you like free express delivery?",
      time: "10:00:03",
    },
    {
      sender: "customer",
      text: "Can you do ₹3,600?",
      time: "10:00:05",
    },
    {
      sender: "assistant",
      text: "I can't go below ₹3,700, but I can lock an exclusive deal at ₹3,799 + Free Shipping right now! Deal?",
      time: "10:00:07",
    },
    {
      sender: "customer",
      text: "Deal. Send payment link.",
      time: "10:00:09",
    },
    {
      sender: "assistant",
      text: "Razorpay Test Link: https://rzp.io/i/test_plink_9921 for ₹3,799.00 (Reserved for 15m)",
      time: "10:00:10",
    },
  ];

  const handleNext = () => {
    if (step < simulationEvents.length) {
      setStep(step + 1);
    } else {
      onSuccess();
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Live Storefront Simulation</DialogTitle>
          <DialogDescription>
            Simulating a real WhatsApp buyer interacting with your newly configured AI Seller Agent.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-3 max-h-80 overflow-y-auto pr-1">
          {simulationEvents.slice(0, step).map((ev, i) => (
            <div
              key={i}
              className={`flex gap-2 text-xs ${
                ev.sender === "customer" ? "justify-end" : "justify-start"
              }`}
            >
              {ev.sender === "assistant" && (
                <div className="w-6 h-6 rounded bg-[#0C2340] text-white flex items-center justify-center flex-shrink-0">
                  <Bot className="w-3.5 h-3.5" />
                </div>
              )}
              <div
                className={`p-2.5 rounded max-w-[80%] border leading-relaxed ${
                  ev.sender === "customer"
                    ? "bg-[#0C83FD] text-white border-[#0266D6]"
                    : "bg-surface-50 text-surface-900 border-surface-200"
                }`}
              >
                {ev.text}
              </div>
              {ev.sender === "customer" && (
                <div className="w-6 h-6 rounded bg-surface-200 text-surface-700 flex items-center justify-center flex-shrink-0">
                  <User className="w-3.5 h-3.5" />
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded text-xs text-emerald-800 flex items-center justify-between">
          <div className="flex items-center gap-1.5 font-medium">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Rules enforced: Floor ₹3,500 | Max discount 12%</span>
          </div>
          <span className="font-mono text-[11px]">TEST PASS</span>
        </div>

        <div className="flex justify-end gap-2 pt-3 border-t border-surface-100 mt-4">
          {step < simulationEvents.length ? (
            <Button onClick={handleNext} variant="primary" size="sm">
              Step Forward ({step}/{simulationEvents.length})
            </Button>
          ) : (
            <Button onClick={handleNext} variant="success" size="sm">
              Confirm & Launch Store
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
