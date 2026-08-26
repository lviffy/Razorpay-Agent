"use client";

import React, { useState, useEffect } from "react";
import { Product } from "@/lib/types";
import { api } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { CloudinaryUpload } from "@/components/ui/cloudinary-upload";
import {
  X,
  Loader2,
  Tag,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Image as ImageIcon,
} from "lucide-react";

interface EditProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  onProductUpdated: (updated: Product) => void;
}

export function EditProductModal({
  isOpen,
  onClose,
  product,
  onProductUpdated,
}: EditProductModalProps) {
  const [title, setTitle] = useState("");
  const [sku, setSku] = useState("");
  const [price, setPrice] = useState<number>(0);
  const [floorPrice, setFloorPrice] = useState<number>(0);
  const [inventory, setInventory] = useState<number>(0);
  const [imageUrl, setImageUrl] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("General");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  useEffect(() => {
    if (product) {
      setTitle(product.title || "");
      setSku(product.sku || "");
      setPrice(product.price || 0);
      setFloorPrice(product.floorPrice || product.minPrice || product.price || 0);
      setInventory(product.inventory || 0);
      setImageUrl(product.imageUrl || "");
      setDescription(product.description || "");
      setCategory(product.category || "General");
      setError(null);
      setSuccessNotice(null);
    }
  }, [product]);

  if (!isOpen || !product) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const payload: Partial<Product> = {
        title,
        sku,
        price,
        floorPrice,
        minPrice: floorPrice,
        inventory,
        imageUrl,
        description,
        category,
      };

      const res = await api.products.update(product.id, payload);
      if (res) {
        onProductUpdated(res);
      } else {
        onProductUpdated({
          ...product,
          ...payload,
        });
      }

      setSuccessNotice("Product updated successfully!");
      setTimeout(() => {
        onClose();
      }, 800);
    } catch (err: any) {
      console.error("Failed to update product:", err);
      setError(err.message || "Failed to update product");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-zinc-800 text-zinc-100 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-950/50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center">
              <Tag className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-zinc-100">
                Edit Product
              </h3>
              <p className="text-xs text-zinc-400">
                Adjust retail pricing, floor limit, inventory stock, and product photo.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-200 p-1.5 rounded-lg hover:bg-zinc-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSave} className="p-6 space-y-4 overflow-y-auto">
          {error && (
            <div className="p-3 bg-red-950/50 border border-red-800/80 rounded-xl text-xs text-red-300 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successNotice && (
            <div className="p-3 bg-emerald-950/50 border border-emerald-800/80 rounded-xl text-xs text-emerald-300 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successNotice}</span>
            </div>
          )}

          <div className="space-y-3">
            {/* Title */}
            <div>
              <label className="text-xs font-medium text-zinc-300 block mb-1.5">
                Product Title
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-zinc-800/80 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-blue-500 transition-colors"
                placeholder="Rohan Running Shoes"
              />
            </div>

            {/* SKU & Category */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-zinc-300 block mb-1.5">
                  SKU Code
                </label>
                <input
                  type="text"
                  value={sku}
                  onChange={(e) => setSku(e.target.value)}
                  className="w-full bg-zinc-800/80 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-zinc-100 font-mono focus:outline-none focus:border-blue-500 transition-colors"
                  placeholder="SKU-001"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-zinc-300 block mb-1.5">
                  Category
                </label>
                <input
                  type="text"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-zinc-800/80 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-blue-500 transition-colors"
                  placeholder="Footwear"
                />
              </div>
            </div>

            {/* Pricing & Stock */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-medium text-zinc-300 block mb-1.5">
                  Retail Price (₹)
                </label>
                <input
                  type="number"
                  step="any"
                  required
                  value={price}
                  onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
                  className="w-full bg-zinc-800/80 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-zinc-100 font-mono focus:outline-none focus:border-blue-500 transition-colors"
                  placeholder="1200"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-zinc-300 block mb-1.5">
                  Floor Limit (₹)
                </label>
                <input
                  type="number"
                  step="any"
                  value={floorPrice}
                  onChange={(e) => setFloorPrice(parseFloat(e.target.value) || 0)}
                  className="w-full bg-zinc-800/80 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-zinc-100 font-mono focus:outline-none focus:border-blue-500 transition-colors"
                  placeholder="1100"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-zinc-300 block mb-1.5">
                  Stock Units
                </label>
                <input
                  type="number"
                  value={inventory}
                  onChange={(e) => setInventory(parseInt(e.target.value, 10) || 0)}
                  className="w-full bg-zinc-800/80 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-zinc-100 font-mono focus:outline-none focus:border-blue-500 transition-colors"
                  placeholder="10"
                />
              </div>
            </div>

            {/* Image URL / Upload */}
            <div>
              <label className="text-xs font-medium text-zinc-300 block mb-1.5 flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5 text-zinc-400" />
                Product Image URL (Public CDN / Cloudinary)
              </label>
              <input
                type="text"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                className="w-full bg-zinc-800/80 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-blue-500 transition-colors"
                placeholder="https://res.cloudinary.com/... or image link"
              />
              <div className="mt-2">
                <CloudinaryUpload
                  onUpload={(url) => setImageUrl(url)}
                  existingUrl={imageUrl}
                  label="Or upload a new photo"
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-zinc-800">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border-zinc-700 text-xs px-4 py-2"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={saving}
              className="bg-blue-600 hover:bg-blue-500 text-white text-xs px-5 py-2 flex items-center gap-1.5"
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
              Save Product
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
