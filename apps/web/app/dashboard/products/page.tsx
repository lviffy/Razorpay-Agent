"use client";

import React, { useEffect, useState } from "react";
import { api } from "@/lib/api/client";
import { Product } from "@/lib/types";
import { formatINR } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { NativeProductModal } from "@/components/onboarding/native-product-modal";
import { Plus, Search, Layers, Zap, ShoppingBag, Check, AlertCircle } from "lucide-react";

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<"ALL" | "IN_STOCK" | "AI_ENABLED" | "SHOPIFY" | "AGENTBRIDGE">("ALL");
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    const list = await api.products.list();
    setProducts(list);
  };

  const handleToggleAI = async (id: string, current: boolean) => {
    await api.products.toggleAI(id, !current);
    loadProducts();
  };

  const handleSaveProduct = async (productData: any) => {
    await api.products.create(productData);
    setModalOpen(false);
    loadProducts();
  };

  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;
    if (filter === "IN_STOCK") return p.inventory > 0;
    if (filter === "AI_ENABLED") return p.aiSellingEnabled;
    if (filter === "SHOPIFY") return p.provider === "SHOPIFY";
    if (filter === "AGENTBRIDGE") return p.provider === "AGENTBRIDGE";
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-surface-900 tracking-tight">Unified Catalog</h1>
          <p className="text-xs text-surface-500 mt-0.5">
            Unified catalog across Native AgentBridge and connected Shopify stores.
          </p>
        </div>
        <Button onClick={() => setModalOpen(true)} size="sm" className="gap-1.5">
          <Plus className="w-4 h-4" />
          <span>Add Native Product</span>
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 border border-surface-200 rounded-xl shadow-subtle">
        <div className="flex items-center gap-2 w-full sm:w-80 bg-surface-50 border border-surface-200 rounded-lg px-2.5 py-1.5 text-xs">
          <Search className="w-3.5 h-3.5 text-surface-400" />
          <input
            type="text"
            aria-label="Search catalog"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by title, SKU..."
            className="bg-transparent border-none outline-none w-full text-xs text-surface-900 placeholder:text-surface-400"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto">
          {[
            { id: "ALL", label: "All Products" },
            { id: "AI_ENABLED", label: "AI Selling Active" },
            { id: "IN_STOCK", label: "In Stock" },
            { id: "AGENTBRIDGE", label: "Native" },
            { id: "SHOPIFY", label: "Shopify" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id as any)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                filter === tab.id
                  ? "bg-[#195adc] text-white shadow-xs"
                  : "bg-surface-100 text-surface-600 hover:bg-surface-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Catalog Table */}
      <div className="bg-white border border-surface-200 rounded-xl overflow-hidden shadow-subtle">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-surface-200 bg-surface-50 text-surface-600 font-semibold uppercase text-[10px] tracking-wider">
              <th className="py-3 px-4">Product</th>
              <th className="py-3 px-4">SKU</th>
              <th className="py-3 px-4">Provider</th>
              <th className="py-3 px-4 text-right">Price</th>
              <th className="py-3 px-4 text-right">Floor Price</th>
              <th className="py-3 px-4 text-center">Stock</th>
              <th className="py-3 px-4 text-center">AI Selling</th>
              <th className="py-3 px-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-100">
            {filteredProducts.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-8 text-center text-surface-400">
                  No products matched your search or filters.
                </td>
              </tr>
            ) : (
              filteredProducts.map((p) => (
                <tr key={p.id} className="hover:bg-surface-50/60 transition-colors">
                  <td className="py-3 px-4">
                    <div className="font-semibold text-surface-900">{p.title}</div>
                    <div className="text-[11px] text-surface-500 line-clamp-1">{p.description}</div>
                  </td>
                  <td className="py-3 px-4 font-mono text-surface-600">{p.sku}</td>
                  <td className="py-3 px-4">
                    {p.provider === "SHOPIFY" ? (
                      <Badge variant="success">Shopify</Badge>
                    ) : (
                      <Badge variant="brand">AgentBridge</Badge>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-semibold text-surface-900">
                    {formatINR(p.price)}
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-surface-600">
                    {formatINR(p.minPrice)}
                  </td>
                  <td className="py-3 px-4 text-center font-mono">
                    {p.inventory > 0 ? (
                      <span className="text-surface-800 font-semibold">{p.inventory}</span>
                    ) : (
                      <span className="text-red-600 font-semibold">Out of Stock</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <button
                      onClick={() => handleToggleAI(p.id, p.aiSellingEnabled)}
                      className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium border ${
                        p.aiSellingEnabled
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : "bg-surface-100 text-surface-500 border-surface-200"
                      }`}
                    >
                      {p.aiSellingEnabled ? "● Enabled" : "○ Disabled"}
                    </button>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleToggleAI(p.id, p.aiSellingEnabled)}
                      className="text-[11px] h-7 px-2"
                    >
                      {p.aiSellingEnabled ? "Pause AI" : "Enable AI"}
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        </div>
      </div>

      <NativeProductModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        onSave={handleSaveProduct}
      />
    </div>
  );
}
