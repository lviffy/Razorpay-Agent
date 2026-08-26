"use client";

import React, { useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Product } from "@/lib/types";
import { formatINR } from "@/lib/utils";
import {
  Upload,
  FileText,
  Download,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Trash2,
  Sparkles,
  ShieldCheck,
  Table as TableIcon,
  HelpCircle,
} from "lucide-react";

interface CSVImportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImportComplete: (products: Partial<Product>[]) => void;
}

interface ParsedRow {
  title: string;
  price: number;
  minPrice: number;
  inventory: number;
  sku: string;
  category: string;
  description: string;
  imageUrl?: string;
  isValid: boolean;
  error?: string;
}

export function CSVImportModal({
  open,
  onOpenChange,
  onImportComplete,
}: CSVImportModalProps) {
  const [dragActive, setDragActive] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [rawText, setRawText] = useState("");
  const [inputMode, setInputMode] = useState<"file" | "paste">("file");
  const [importing, setImporting] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetState = () => {
    setFileName(null);
    setParsedRows([]);
    setRawText("");
    setParseError(null);
    setImporting(false);
  };

  // Robust CSV parser supporting quotes, commas, tabs
  const parseCSVContent = (content: string) => {
    setParseError(null);
    if (!content.trim()) {
      setParsedRows([]);
      return;
    }

    try {
      const lines = content
        .replace(/\r\n/g, "\n")
        .replace(/\r/g, "\n")
        .split("\n")
        .filter((l) => l.trim().length > 0);

      if (lines.length < 2) {
        setParseError("CSV must contain a header row and at least one product row.");
        return;
      }

      // Determine delimiter
      const firstLine = lines[0];
      const delimiter = firstLine.includes("\t") ? "\t" : firstLine.includes(";") ? ";" : ",";

      const parseLine = (line: string): string[] => {
        const result: string[] = [];
        let current = "";
        let inQuotes = false;

        for (let i = 0; i < line.length; i++) {
          const char = line[i];
          if (char === '"') {
            if (inQuotes && line[i + 1] === '"') {
              current += '"';
              i++;
            } else {
              inQuotes = !inQuotes;
            }
          } else if (char === delimiter && !inQuotes) {
            result.push(current.trim());
            current = "";
          } else {
            current += char;
          }
        }
        result.push(current.trim());
        return result;
      };

      const headers = parseLine(lines[0]).map((h) => h.toLowerCase().replace(/[^a-z0-9]/g, ""));

      const getColIndex = (aliases: string[]): number => {
        return headers.findIndex((h) => aliases.some((a) => h.includes(a)));
      };

      const titleIdx = getColIndex(["title", "name", "product", "item"]);
      const priceIdx = getColIndex(["price", "listedprice", "mrp", "retail", "cost", "amount"]);
      const minPriceIdx = getColIndex(["minprice", "floorprice", "floor", "min", "bottomprice"]);
      const inventoryIdx = getColIndex(["inventory", "stock", "qty", "quantity", "available"]);
      const skuIdx = getColIndex(["sku", "code", "barcode", "itemcode"]);
      const categoryIdx = getColIndex(["category", "type", "department", "collection"]);
      const descIdx = getColIndex(["desc", "description", "details", "body"]);
      const imageIdx = getColIndex(["image", "img", "photo", "picture", "url"]);

      if (titleIdx === -1) {
        setParseError("Could not find a 'Title' or 'Product Name' column in your CSV header.");
        return;
      }

      const rows: ParsedRow[] = [];

      for (let i = 1; i < lines.length; i++) {
        const cols = parseLine(lines[i]);
        if (cols.length === 0 || cols.every((c) => !c)) continue;

        const title = cols[titleIdx] || "";
        const rawPrice = priceIdx !== -1 ? cols[priceIdx]?.replace(/[^0-9.]/g, "") : "";
        const price = parseFloat(rawPrice || "0");

        const rawMinPrice = minPriceIdx !== -1 ? cols[minPriceIdx]?.replace(/[^0-9.]/g, "") : "";
        const minPrice = rawMinPrice && !isNaN(parseFloat(rawMinPrice))
          ? parseFloat(rawMinPrice)
          : Math.round(price * 0.85);

        const rawInv = inventoryIdx !== -1 ? cols[inventoryIdx]?.replace(/[^0-9]/g, "") : "";
        const inventory = rawInv ? parseInt(rawInv, 10) : 10;

        const sku = (skuIdx !== -1 && cols[skuIdx]) ? cols[skuIdx] : `SKU-${Date.now().toString().slice(-4)}${i}`;
        const category = (categoryIdx !== -1 && cols[categoryIdx]) ? cols[categoryIdx] : "General";
        const description = (descIdx !== -1 && cols[descIdx]) ? cols[descIdx] : "";
        const imageUrl = (imageIdx !== -1 && cols[imageIdx]) ? cols[imageIdx] : undefined;

        let isValid = true;
        let error: string | undefined;

        if (!title.trim()) {
          isValid = false;
          error = "Missing title";
        } else if (isNaN(price) || price <= 0) {
          isValid = false;
          error = "Invalid price";
        }

        rows.push({
          title: title.trim(),
          price: isNaN(price) ? 0 : price,
          minPrice: isNaN(minPrice) ? 0 : minPrice,
          inventory: isNaN(inventory) ? 10 : inventory,
          sku: sku.trim(),
          category: category.trim(),
          description: description.trim(),
          imageUrl: imageUrl?.trim(),
          isValid,
          error,
        });
      }

      if (rows.length === 0) {
        setParseError("No product rows found in the CSV.");
        return;
      }

      setParsedRows(rows);
    } catch (err: any) {
      console.error("CSV parse error:", err);
      setParseError(`Failed to parse CSV: ${err.message}`);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      parseCSVContent(text);
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      parseCSVContent(text);
    };
    reader.readAsText(file);
  };

  const handleDownloadSample = () => {
    const sampleCSV = `title,price,min_price,inventory,sku,category,description,image_url
"Nike Air Zoom Pegasus 40",4299,3600,15,"NIKE-PEG40-BLK","Running Shoes","Responsive workhorse with Air Zoom cushioning.","https://images.unsplash.com/photo-1542291026-7eec264c27ff"
"Marathon Stainless Hydro Flask (750ml)",999,850,30,"HYDR-750-SLV","Accessories","Double-wall vacuum insulated water bottle.",""
"Dri-FIT Breathable Training Singlet",1499,1200,20,"APRL-SGLT-NVY","Apparel","Moisture-wicking athletic running vest.",""
"Garmin Forerunner 265 GPS Watch",28990,26500,8,"TECH-GRMN-265","Electronics","Advanced GPS running smartwatch with AMOLED display.",""`;

    const blob = new Blob([sampleCSV], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "zapai_products_sample.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleConfirmImport = async () => {
    const validItems = parsedRows.filter((r) => r.isValid);
    if (validItems.length === 0) return;

    setImporting(true);
    try {
      const payload: Partial<Product>[] = validItems.map((r) => ({
        title: r.title,
        price: r.price,
        minPrice: r.minPrice,
        inventory: r.inventory,
        sku: r.sku,
        category: r.category,
        description: r.description,
        imageUrl: r.imageUrl,
        aiSellingEnabled: true,
        maxDiscountPercent: r.price > 0 ? Math.round(((r.price - r.minPrice) / r.price) * 100) : 15,
        provider: "ZAPAI",
      }));

      onImportComplete(payload);
      onOpenChange(false);
      resetState();
    } catch (err) {
      console.error("Import failed:", err);
    } finally {
      setImporting(false);
    }
  };

  const validCount = parsedRows.filter((r) => r.isValid).length;
  const invalidCount = parsedRows.length - validCount;
  const totalStock = parsedRows.reduce((acc, r) => acc + (r.isValid ? r.inventory : 0), 0);

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) resetState();
        onOpenChange(v);
      }}
    >
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col p-0 gap-0 rounded-2xl border-zinc-200 shadow-xl bg-white">
        {/* Header */}
        <div className="p-5 pb-4 border-b border-zinc-100 flex items-start justify-between">
          <div>
            <DialogTitle className="text-base font-bold text-zinc-900 flex items-center gap-2">
              <TableIcon className="w-4 h-4 text-brand-600" />
              <span>Import Products from CSV</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-zinc-500 mt-0.5">
              Upload your catalog spreadsheet to bulk-index products with price floors and live inventory.
            </DialogDescription>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleDownloadSample}
            className="text-xs h-7 gap-1.5 text-zinc-600 border-zinc-200 hover:bg-zinc-50"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Sample CSV</span>
          </Button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4">
          {parsedRows.length === 0 ? (
            <div className="space-y-4">
              {/* Tabs: Upload / Paste */}
              <div className="flex items-center gap-2 border-b border-zinc-100 pb-2">
                <button
                  type="button"
                  onClick={() => setInputMode("file")}
                  className={`text-xs font-semibold pb-1 border-b-2 transition-colors ${
                    inputMode === "file"
                      ? "border-brand-600 text-brand-600"
                      : "border-transparent text-zinc-400 hover:text-zinc-700"
                  }`}
                >
                  Upload CSV File
                </button>
                <button
                  type="button"
                  onClick={() => setInputMode("paste")}
                  className={`text-xs font-semibold pb-1 border-b-2 transition-colors ${
                    inputMode === "paste"
                      ? "border-brand-600 text-brand-600"
                      : "border-transparent text-zinc-400 hover:text-zinc-700"
                  }`}
                >
                  Paste CSV / TSV Text
                </button>
              </div>

              {inputMode === "file" ? (
                /* Drag and Drop Zone */
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragActive(true);
                  }}
                  onDragLeave={() => setDragActive(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-3 ${
                    dragActive
                      ? "border-brand-500 bg-brand-50/50"
                      : "border-zinc-200 hover:border-zinc-300 bg-zinc-50/60"
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,text/csv,text/plain"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <div className="w-12 h-12 rounded-2xl bg-white border border-zinc-200 shadow-2xs flex items-center justify-center text-zinc-600">
                    <Upload className="w-5 h-5 text-brand-600" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-zinc-800">
                      Click to browse or drag & drop CSV file
                    </p>
                    <p className="text-[11px] text-zinc-400 mt-0.5">
                      Supports .csv format with headers: <code className="bg-zinc-200/60 px-1 rounded text-[10px]">title</code>, <code className="bg-zinc-200/60 px-1 rounded text-[10px]">price</code>, <code className="bg-zinc-200/60 px-1 rounded text-[10px]">min_price</code>, <code className="bg-zinc-200/60 px-1 rounded text-[10px]">inventory</code>, <code className="bg-zinc-200/60 px-1 rounded text-[10px]">sku</code>
                    </p>
                  </div>
                </div>
              ) : (
                /* Paste Text Area */
                <div className="space-y-2">
                  <textarea
                    value={rawText}
                    onChange={(e) => {
                      setRawText(e.target.value);
                      parseCSVContent(e.target.value);
                    }}
                    placeholder={`title,price,min_price,inventory,sku,category\n"Running Shoes",3999,3400,20,"SHOE-01","Footwear"\n"Water Bottle",899,750,50,"BTL-02","Accessories"`}
                    rows={7}
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl p-3 text-xs font-mono focus:outline-hidden focus:ring-2 focus:ring-brand-500 text-zinc-800"
                  />
                </div>
              )}

              {/* Parser Error Alert */}
              {parseError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <span>{parseError}</span>
                </div>
              )}
            </div>
          ) : (
            /* Parsed Preview Table */
            <div className="space-y-3">
              {/* Summary Bar */}
              <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-zinc-50 rounded-xl border border-zinc-200 text-xs">
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-zinc-800">
                    {parsedRows.length} Total Rows Found
                  </span>
                  <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[11px] gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    {validCount} Ready to Import
                  </Badge>
                  {invalidCount > 0 && (
                    <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 text-[11px] gap-1">
                      <AlertCircle className="w-3 h-3 text-red-600" />
                      {invalidCount} Skipped (Invalid)
                    </Badge>
                  )}
                </div>

                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={resetState}
                  className="h-7 text-xs text-zinc-500 hover:text-zinc-800"
                >
                  <Trash2 className="w-3.5 h-3.5 mr-1" />
                  Clear & Re-upload
                </Button>
              </div>

              {/* Data Table */}
              <div className="border border-zinc-200 rounded-xl overflow-hidden max-h-[300px] overflow-y-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-zinc-100/80 text-zinc-600 font-semibold sticky top-0 border-b border-zinc-200">
                    <tr>
                      <th className="p-2.5 pl-3">Status</th>
                      <th className="p-2.5">Product Title</th>
                      <th className="p-2.5">SKU</th>
                      <th className="p-2.5">Listed Price</th>
                      <th className="p-2.5">Floor Price</th>
                      <th className="p-2.5">Stock</th>
                      <th className="p-2.5 pr-3">Category</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 bg-white">
                    {parsedRows.map((row, idx) => (
                      <tr
                        key={idx}
                        className={!row.isValid ? "bg-red-50/40 text-zinc-400" : "hover:bg-zinc-50/60"}
                      >
                        <td className="p-2.5 pl-3">
                          {row.isValid ? (
                            <span className="inline-flex items-center text-emerald-600 text-[11px] font-medium">
                              <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Valid
                            </span>
                          ) : (
                            <span className="inline-flex items-center text-red-600 text-[11px] font-medium" title={row.error}>
                              <AlertCircle className="w-3.5 h-3.5 mr-1" /> {row.error || "Error"}
                            </span>
                          )}
                        </td>
                        <td className="p-2.5 font-medium text-zinc-900 max-w-[200px] truncate">
                          {row.title || "—"}
                        </td>
                        <td className="p-2.5 font-mono text-[11px] text-zinc-600">{row.sku}</td>
                        <td className="p-2.5 font-mono font-semibold text-zinc-900">{formatINR(row.price)}</td>
                        <td className="p-2.5 font-mono text-emerald-700">{formatINR(row.minPrice)}</td>
                        <td className="p-2.5 font-mono text-zinc-700">{row.inventory}</td>
                        <td className="p-2.5 pr-3 text-zinc-500">{row.category}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-zinc-50 border-t border-zinc-100 flex items-center justify-between">
          <p className="text-[11px] text-zinc-400 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-zinc-500" />
            <span>AI Selling will automatically be enabled with strict price floors.</span>
          </p>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                resetState();
                onOpenChange(false);
              }}
              className="text-xs h-8 text-zinc-600"
            >
              Cancel
            </Button>
            <Button
              type="button"
              disabled={validCount === 0 || importing}
              onClick={handleConfirmImport}
              className="text-xs h-8 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-xs"
            >
              {importing ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin mr-1.5" />
                  <span>Importing {validCount} Products...</span>
                </>
              ) : (
                <span>Import {validCount} Products</span>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
