"use client";

import React, { useEffect, useState } from "react";
import { api } from "@/lib/api/client";
import { Product } from "@/lib/types";
import { formatINR } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { NativeProductModal } from "@/components/onboarding/native-product-modal";
import {
  Plus,
  Search,
  Layers,
  ShoppingBag,
  Check,
  Package,
  ShieldCheck,
} from "lucide-react";

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<string>("ALL");
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

  const totalInventory = products.reduce((acc, p) => acc + p.inventory, 0);
  const aiActiveCount = products.filter((p) => p.aiSellingEnabled).length;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold text-zinc-900 tracking-tight">Unified Catalog</h1>
            <Badge variant="outline" className="text-[11px] font-mono bg-zinc-100 text-zinc-700 border-zinc-200">
              {products.length} Products
            </Badge>
          </div>
          <p className="text-xs text-zinc-500 mt-1">
            Omnichannel inventory synced across AgentBridge Native database and connected Shopify stores.
          </p>
        </div>
        <Button
          onClick={() => setModalOpen(true)}
          size="sm"
          className="gap-2 text-xs h-8 bg-blue-600 hover:bg-blue-700 font-medium text-white shadow-xs"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Native Product</span>
        </Button>
      </div>

      {/* Catalog KPI Quick Bar using shadcn Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="p-4 border-zinc-200 shadow-xs">
          <p className="text-[11px] font-medium text-zinc-500">Total SKUs</p>
          <p className="text-xl font-bold font-mono text-zinc-900 mt-0.5">{products.length}</p>
        </Card>
        <Card className="p-4 border-zinc-200 shadow-xs">
          <p className="text-[11px] font-medium text-zinc-500">AI Selling Enabled</p>
          <p className="text-xl font-bold font-mono text-zinc-900 mt-0.5">{aiActiveCount} Active</p>
        </Card>
        <Card className="p-4 border-zinc-200 shadow-xs">
          <p className="text-[11px] font-medium text-zinc-500">Available Stock Units</p>
          <p className="text-xl font-bold font-mono text-zinc-900 mt-0.5">{totalInventory} Units</p>
        </Card>
        <Card className="p-4 border-zinc-200 shadow-xs">
          <p className="text-[11px] font-medium text-zinc-500">Floor Price Compliance</p>
          <p className="text-xl font-bold font-mono text-zinc-900 mt-0.5">100% Enforced</p>
        </Card>
      </div>

      {/* Filter and Search Bar with shadcn Tabs */}
      <Card className="p-3 border-zinc-200 shadow-xs">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 w-full sm:w-80 bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-1.5 text-xs">
            <Search className="w-3.5 h-3.5 text-zinc-400" />
            <input
              type="text"
              aria-label="Search catalog"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by title, SKU, category..."
              className="bg-transparent border-none outline-none w-full text-xs text-zinc-900 placeholder:text-zinc-400"
            />
          </div>

          <div className="overflow-x-auto no-scrollbar max-w-full pb-0.5">
            <Tabs value={filter} onValueChange={setFilter}>
              <TabsList className="h-8 shrink-0">
                {[
                  { id: "ALL", label: "All Products" },
                  { id: "AI_ENABLED", label: "AI Active" },
                  { id: "IN_STOCK", label: "In Stock" },
                  { id: "AGENTBRIDGE", label: "Native" },
                  { id: "SHOPIFY", label: "Shopify" },
                ].map((tab) => (
                  <TabsTrigger key={tab.id} value={tab.id} className="text-xs py-1 px-2.5">
                    {tab.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>
        </div>
      </Card>

      {/* Catalog Table */}
      <Card className="border-zinc-200 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-50 text-zinc-600 font-semibold uppercase text-[10px] tracking-wider">
                <th className="py-3 px-4">Product Details</th>
                <th className="py-3 px-4">SKU</th>
                <th className="py-3 px-4">Source</th>
                <th className="py-3 px-4 text-right">Retail Price</th>
                <th className="py-3 px-4 text-right">Floor Limit</th>
                <th className="py-3 px-4 text-center">Stock</th>
                <th className="py-3 px-4 text-center">AI Autonomy</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-zinc-400">
                    No products matched your search or filters.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => (
                  <tr key={p.id} className="hover:bg-zinc-50 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-zinc-900">{p.title}</div>
                      <div className="text-[11px] text-zinc-500 line-clamp-1 mt-0.5">{p.description}</div>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-zinc-600">{p.sku}</td>
                    <td className="py-3.5 px-4">
                      <Badge variant="outline" className="text-[10px] font-medium bg-zinc-100 text-zinc-700 border-zinc-200">
                        {p.provider === "SHOPIFY" ? "Shopify Live" : "AgentBridge Native"}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-zinc-900">
                      {formatINR(p.price)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-zinc-600">
                      <span className="bg-zinc-100 px-2 py-0.5 rounded text-zinc-700 font-medium">
                        {formatINR(p.minPrice)}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono">
                      {p.inventory > 0 ? (
                        <span className="inline-flex items-center gap-1.5 text-zinc-800 font-medium">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          {p.inventory} in stock
                        </span>
                      ) : (
                        <span className="text-zinc-500 font-medium bg-zinc-100 px-2 py-0.5 rounded text-[10px]">
                          Out of Stock
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => handleToggleAI(p.id, p.aiSellingEnabled)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-medium border transition-colors ${
                          p.aiSellingEnabled
                            ? "bg-zinc-900 text-white border-zinc-800"
                            : "bg-zinc-100 text-zinc-500 border-zinc-200 hover:bg-zinc-200"
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            p.aiSellingEnabled ? "bg-emerald-400" : "bg-zinc-400"
                          }`}
                        />
                        {p.aiSellingEnabled ? "AI Enabled" : "Disabled"}
                      </button>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleAI(p.id, p.aiSellingEnabled)}
                        className="text-[11px] h-7 px-2.5 text-zinc-600 hover:text-zinc-900"
                      >
                        {p.aiSellingEnabled ? "Pause" : "Enable"}
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <NativeProductModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        onSave={handleSaveProduct}
      />
    </div>
  );
}

