"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Product } from "@/lib/types";
import { Plus, Trash2, Layers, Sparkles, Check, PackagePlus } from "lucide-react";

interface NativeProductModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (product: Partial<Product> | Partial<Product>[]) => void;
}

interface BatchProductRow {
  id: string;
  title: string;
  price: string;
  minPrice: string;
  inventory: string;
  sku: string;
}

export function NativeProductModal({ open, onOpenChange, onSave }: NativeProductModalProps) {
  const [activeTab, setActiveTab] = useState<"single" | "batch">("single");
  const [savedCount, setSavedCount] = useState(0);
  const [justSavedNotice, setJustSavedNotice] = useState<string | null>(null);

  // Single mode state
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [inventory, setInventory] = useState("");
  const [sku, setSku] = useState("");
  const [maxDiscountPercent, setMaxDiscountPercent] = useState("");

  // Batch mode state
  const [batchRows, setBatchRows] = useState<BatchProductRow[]>([
    { id: "row_1", title: "", price: "", minPrice: "", inventory: "", sku: "" },
    { id: "row_2", title: "", price: "", minPrice: "", inventory: "", sku: "" },
  ]);

  const resetSingleForm = () => {
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

  const constructSingleProduct = (): Partial<Product> | null => {
    if (!title.trim() || !price) return null;
    const numPrice = Number(price);
    const numFloor = minPrice ? Number(minPrice) : Math.round(numPrice * 0.88);
    const numInventory = inventory ? Number(inventory) : 10;
    const finalSku = sku.trim() || `SKU-${Date.now().toString().slice(-4)}`;
    const finalDiscount = maxDiscountPercent
      ? Number(maxDiscountPercent)
      : Math.round(((numPrice - numFloor) / numPrice) * 100);

    return {
      title: title.trim(),
      price: numPrice,
      minPrice: numFloor,
      inventory: numInventory,
      sku: finalSku,
      maxDiscountPercent: finalDiscount,
      provider: "ZAPAI",
      aiSellingEnabled: true,
    };
  };

  const handleSaveSingleAndClose = (e: React.FormEvent) => {
    e.preventDefault();
    const product = constructSingleProduct();
    if (!product) return;

    onSave(product);
    resetSingleForm();
    setSavedCount(0);
    setJustSavedNotice(null);
    onOpenChange(false);
  };

  const handleSaveSingleAndAddAnother = (e: React.MouseEvent) => {
    e.preventDefault();
    const product = constructSingleProduct();
    if (!product) return;

    onSave(product);
    setSavedCount((prev) => prev + 1);
    setJustSavedNotice(`"${product.title}" saved to catalog!`);
    resetSingleForm();
    setTimeout(() => {
      setJustSavedNotice(null);
    }, 4000);
  };

  // Batch Row Handlers
  const handleAddBatchRow = () => {
    setBatchRows((prev) => [
      ...prev,
      {
        id: `row_${Date.now()}_${Math.random()}`,
        title: "",
        price: "",
        minPrice: "",
        inventory: "",
        sku: "",
      },
    ]);
  };

  const handleRemoveBatchRow = (id: string) => {
    if (batchRows.length <= 1) return;
    setBatchRows((prev) => prev.filter((r) => r.id !== id));
  };

  const handleBatchRowChange = (id: string, field: keyof BatchProductRow, value: string) => {
    setBatchRows((prev) =>
      prev.map((row) => {
        if (row.id !== id) return row;
        const updated = { ...row, [field]: value };
        if (field === "price" && value && !row.minPrice) {
          const p = parseFloat(value);
          if (!isNaN(p) && p > 0) {
            updated.minPrice = String(Math.round(p * 0.88));
          }
        }
        return updated;
      })
    );
  };

  const handleSaveBatch = (e: React.FormEvent) => {
    e.preventDefault();
    const validRows = batchRows.filter((r) => r.title.trim() && r.price);
    if (validRows.length === 0) return;

    const products: Partial<Product>[] = validRows.map((r, idx) => {
      const numPrice = Number(r.price);
      const numFloor = r.minPrice ? Number(r.minPrice) : Math.round(numPrice * 0.88);
      const numInventory = r.inventory ? Number(r.inventory) : 10;
      const finalSku = r.sku.trim() || `SKU-${Date.now().toString().slice(-4)}${idx}`;
      return {
        title: r.title.trim(),
        price: numPrice,
        minPrice: numFloor,
        inventory: numInventory,
        sku: finalSku,
        maxDiscountPercent: Math.round(((numPrice - numFloor) / numPrice) * 100),
        provider: "ZAPAI",
        aiSellingEnabled: true,
      };
    });

    onSave(products);
    setBatchRows([
      { id: "row_1", title: "", price: "", minPrice: "", inventory: "", sku: "" },
      { id: "row_2", title: "", price: "", minPrice: "", inventory: "", sku: "" },
    ]);
    onOpenChange(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) {
          resetSingleForm();
          setSavedCount(0);
          setJustSavedNotice(null);
        }
        onOpenChange(isOpen);
      }}
    >
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2 text-base font-bold text-zinc-900">
              <PackagePlus className="w-5 h-5 text-blue-600" />
              Add Products to AI Catalog
            </DialogTitle>
            {savedCount > 0 && (
              <span className="text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                <Check className="w-3 h-3" />
                {savedCount} Added
              </span>
            )}
          </div>
          <DialogDescription className="text-xs text-zinc-500">
            Add single items or batch-create multiple products with AI floor barriers.
          </DialogDescription>
        </DialogHeader>

        {/* Tab Selector */}
        <div className="flex bg-zinc-100 p-1 rounded-xl gap-1 border border-zinc-200">
          <button
            type="button"
            onClick={() => setActiveTab("single")}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === "single"
                ? "bg-white text-zinc-900 shadow-2xs"
                : "text-zinc-500 hover:text-zinc-900"
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            Single Product
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("batch")}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === "batch"
                ? "bg-white text-zinc-900 shadow-2xs"
                : "text-zinc-500 hover:text-zinc-900"
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            Batch Add (Multiple Products)
          </button>
        </div>

        {justSavedNotice && (
          <div className="p-2.5 bg-emerald-50 border border-emerald-200/80 rounded-xl text-xs font-medium text-emerald-800 flex items-center gap-2 animate-in fade-in">
            <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>{justSavedNotice} Ready to add your next item below.</span>
          </div>
        )}

        {/* ── MODE 1: SINGLE PRODUCT ── */}
        {activeTab === "single" && (
          <form onSubmit={handleSaveSingleAndClose} className="space-y-4 pt-1">
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

            <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-2 border-t border-zinc-100">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Button
                  type="button"
                  variant="outline"
                  disabled={!title.trim() || !price}
                  onClick={handleSaveSingleAndAddAnother}
                  className="w-full sm:w-auto text-xs border-zinc-300 hover:bg-zinc-100 font-semibold"
                >
                  <Plus className="w-3.5 h-3.5 mr-1" />
                  Save & Add Another
                </Button>
                <Button
                  type="submit"
                  disabled={!title.trim() || !price}
                  className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-xs"
                >
                  Save & Done
                </Button>
              </div>
            </div>
          </form>
        )}

        {/* ── MODE 2: BATCH ADD MULTIPLE PRODUCTS ── */}
        {activeTab === "batch" && (
          <form onSubmit={handleSaveBatch} className="space-y-4 pt-1">
            <div className="space-y-3">
              {batchRows.map((row, index) => (
                <div
                  key={row.id}
                  className="p-3.5 rounded-xl bg-zinc-50/90 border border-zinc-200 space-y-2.5 relative group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">
                      Product #{index + 1}
                    </span>
                    {batchRows.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveBatchRow(row.id)}
                        className="text-zinc-400 hover:text-red-600 transition-colors p-1 rounded-md hover:bg-red-50 cursor-pointer"
                        title="Remove product row"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-zinc-700">Product Title *</label>
                      <Input
                        value={row.title}
                        onChange={(e) => handleBatchRowChange(row.id, "title", e.target.value)}
                        placeholder="e.g. Classic Chronograph"
                        required
                        className="bg-white h-8 text-xs"
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="space-y-1">
                        <label className="text-[11px] font-semibold text-zinc-700">Price (₹) *</label>
                        <Input
                          type="number"
                          value={row.price}
                          onChange={(e) => handleBatchRowChange(row.id, "price", e.target.value)}
                          placeholder="0"
                          required
                          min="1"
                          className="bg-white h-8 text-xs"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[11px] font-semibold text-zinc-700">Floor (₹)</label>
                        <Input
                          type="number"
                          value={row.minPrice}
                          onChange={(e) => handleBatchRowChange(row.id, "minPrice", e.target.value)}
                          placeholder="0"
                          className="bg-white h-8 text-xs"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[11px] font-semibold text-zinc-700">Stock</label>
                        <Input
                          type="number"
                          value={row.inventory}
                          onChange={(e) => handleBatchRowChange(row.id, "inventory", e.target.value)}
                          placeholder="10"
                          className="bg-white h-8 text-xs"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between pt-1">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddBatchRow}
                className="text-xs font-semibold border-dashed border-zinc-300 hover:border-zinc-400 gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Another Product Row
              </Button>
              <span className="text-[11px] text-zinc-400">
                {batchRows.filter((r) => r.title.trim() && r.price).length} valid items ready
              </span>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-zinc-100">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={batchRows.filter((r) => r.title.trim() && r.price).length === 0}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-xs"
              >
                Save All {batchRows.filter((r) => r.title.trim() && r.price).length || ""} Products
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
