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
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [inventory, setInventory] = useState("");
  const [sku, setSku] = useState("");
  const [maxDiscountPercent, setMaxDiscountPercent] = useState("");

  const resetForm = () => {
    setTitle("");
    setPrice("");
    setMinPrice("");
    setInventory("");
    setSku("");
    setMaxDiscountPercent("");
  };

  const handlePriceChange = (val: string) => {
    setPrice(val);
    const numPrice = parseFloat(val);
    if (!isNaN(numPrice) && numPrice > 0) {
      if (!minPrice) {
        setMinPrice(String(Math.round(numPrice * 0.88)));
      }
      if (!maxDiscountPercent) {
        setMaxDiscountPercent("12");
      }
    }
  };

  const handleFloorChange = (val: string) => {
    setMinPrice(val);
    const numPrice = parseFloat(price);
    const numFloor = parseFloat(val);
    if (!isNaN(numPrice) && !isNaN(numFloor) && numPrice > 0) {
      const discount = Math.max(0, Math.round(((numPrice - numFloor) / numPrice) * 100));
      setMaxDiscountPercent(String(discount));
    }
  };

  const handleDiscountChange = (val: string) => {
    setMaxDiscountPercent(val);
    const numPrice = parseFloat(price);
    const numDiscount = parseFloat(val);
    if (!isNaN(numPrice) && !isNaN(numDiscount) && numPrice > 0) {
      const floor = Math.max(0, Math.round(numPrice * (1 - numDiscount / 100)));
      setMinPrice(String(floor));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !price) return;

    const numPrice = Number(price);
    const numFloor = minPrice ? Number(minPrice) : Math.round(numPrice * 0.88);
    const numInventory = inventory ? Number(inventory) : 10;
    const finalSku = sku.trim() || `SKU-${Date.now().toString().slice(-4)}`;
    const finalDiscount = maxDiscountPercent
      ? Number(maxDiscountPercent)
      : Math.round(((numPrice - numFloor) / numPrice) * 100);

    onSave({
      title: title.trim(),
      price: numPrice,
      minPrice: numFloor,
      inventory: numInventory,
      sku: finalSku,
      maxDiscountPercent: finalDiscount,
      provider: "ZAPAI",
      aiSellingEnabled: true,
    });

    resetForm();
    onOpenChange(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) resetForm();
        onOpenChange(isOpen);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Native Product</DialogTitle>
          <DialogDescription>
            Add a product directly to your ZapAI catalog with negotiation limits.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-700">Product Title</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter product title..."
              required
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-700">Listed Price (₹)</label>
              <Input
                type="number"
                value={price}
                onChange={(e) => handlePriceChange(e.target.value)}
                placeholder="0.00"
                required
                min="1"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-700">Inventory Units</label>
              <Input
                type="number"
                value={inventory}
                onChange={(e) => setInventory(e.target.value)}
                placeholder="0"
                required
                min="1"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-700">SKU Code</label>
              <Input
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                placeholder="e.g. SKU-001"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-700">Floor Price (₹)</label>
              <Input
                type="number"
                value={minPrice}
                onChange={(e) => handleFloorChange(e.target.value)}
                placeholder="0.00"
                min="0"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-700">Max Discount %</label>
              <Input
                type="number"
                value={maxDiscountPercent}
                onChange={(e) => handleDiscountChange(e.target.value)}
                placeholder="0"
                min="0"
                max="100"
              />
            </div>
          </div>

          <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-lg text-xs text-zinc-600">
            <p className="font-semibold text-zinc-900 mb-0.5">AI Negotiation Rule</p>
            {price ? (
              <span>
                Your AI Seller agent will never accept offers below ₹{minPrice || "0"} or discount more than{" "}
                {maxDiscountPercent || "0"}%.
              </span>
            ) : (
              <span>Enter a listed price to configure automated AI floor and discount barriers.</span>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-zinc-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                resetForm();
                onOpenChange(false);
              }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!title.trim() || !price}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-xs"
            >
              Save & Add to AI Catalog
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
