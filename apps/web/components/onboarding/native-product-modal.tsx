"use client";

import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Product } from "@/lib/types";

interface NativeProductModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (product: Partial<Product>) => void;
}

export function NativeProductModal({ open, onOpenChange, onSave }: NativeProductModalProps) {
  const [title, setTitle] = useState("Nike Air Zoom Pegasus 40");
  const [price, setPrice] = useState("3999");
  const [minPrice, setMinPrice] = useState("3500");
  const [inventory, setInventory] = useState("10");
  const [sku, setSku] = useState("NK-PEG-40");
  const [maxDiscountPercent, setMaxDiscountPercent] = useState("12");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      title,
      price: Number(price),
      minPrice: Number(minPrice),
      inventory: Number(inventory),
      sku,
      maxDiscountPercent: Number(maxDiscountPercent),
      provider: "ZAPAI",
      aiSellingEnabled: true,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Native Product</DialogTitle>
          <DialogDescription>
            Add a product directly to the ZapAI catalog with negotiation limits.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-surface-700">Product Title</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Nike Air Zoom Pegasus 40"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-surface-700">Listed Price (₹)</label>
              <Input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="3999"
                required
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-surface-700">Inventory Units</label>
              <Input
                type="number"
                value={inventory}
                onChange={(e) => setInventory(e.target.value)}
                placeholder="10"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-surface-700">SKU Code</label>
              <Input value={sku} onChange={(e) => setSku(e.target.value)} placeholder="SKU-01" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-surface-700">Floor Price (₹)</label>
              <Input
                type="number"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                placeholder="3500"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-surface-700">Max Discount %</label>
              <Input
                type="number"
                value={maxDiscountPercent}
                onChange={(e) => setMaxDiscountPercent(e.target.value)}
                placeholder="12"
              />
            </div>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded text-xs text-slate-600">
            <p className="font-semibold text-slate-900 mb-0.5">AI Negotiation Rule</p>
            Your AI Seller agent will never accept offers below ₹{minPrice || "0"} or discount more than{" "}
            {maxDiscountPercent || "0"}%.
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-surface-100">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Save & Add to AI Catalog
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
