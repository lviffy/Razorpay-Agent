"use client";

import React, { useRef, useState, useCallback, useEffect } from "react";
import { ImagePlus, X, Loader2, UploadCloud, CheckCircle2, Link as LinkIcon } from "lucide-react";

interface CloudinaryUploadProps {
  onUpload: (url: string) => void;
  existingUrl?: string;
  className?: string;
  label?: string;
}

const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB
const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/bmp"];
const ALLOWED_EXT_LABEL = "JPG, PNG, WEBP, GIF, BMP";
const MAX_SIZE_LABEL = "10 MB";

export function CloudinaryUpload({
  onUpload,
  existingUrl,
  className = "",
  label = "Product Image",
}: CloudinaryUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(existingUrl || null);
  const [status, setStatus] = useState<"idle" | "uploading" | "done" | "error">("idle");
  const [dragging, setDragging] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [directUrl, setDirectUrl] = useState("");
  const [mode, setMode] = useState<"upload" | "url">("upload");

  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

  useEffect(() => {
    if (existingUrl) {
      setPreview(existingUrl);
    }
  }, [existingUrl]);

  const uploadFile = useCallback(
    async (file: File) => {
      if (!cloudName || !uploadPreset) {
        setErrorMsg("Cloudinary not configured in .env.local. Please paste a public image URL below.");
        setStatus("error");
        setMode("url");
        return;
      }

      if (!ALLOWED_MIME_TYPES.includes(file.type)) {
        setErrorMsg(`Unsupported format. Allowed: ${ALLOWED_EXT_LABEL}`);
        setStatus("error");
        return;
      }
      if (file.size > MAX_SIZE_BYTES) {
        const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
        setErrorMsg(`File is ${sizeMB} MB — must be under ${MAX_SIZE_LABEL}.`);
        setStatus("error");
        return;
      }

      setStatus("uploading");
      setErrorMsg(null);

      try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("upload_preset", uploadPreset);
        formData.append("folder", "zapai_products");

        const res = await fetch(
          `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
          { method: "POST", body: formData }
        );

        if (!res.ok) {
          throw new Error(`Upload failed: ${res.status}`);
        }

        const data = await res.json();
        const secureUrl: string = data.secure_url;

        setPreview(secureUrl);
        setStatus("done");
        onUpload(secureUrl);
      } catch (err: any) {
        setErrorMsg(err?.message || "Upload failed. Please try pasting a direct image link.");
        setStatus("error");
        setPreview(null);
      }
    },
    [cloudName, uploadPreset, onUpload]
  );

  const handleApplyDirectUrl = (url: string) => {
    if (!url.trim()) return;
    setPreview(url.trim());
    setStatus("done");
    setErrorMsg(null);
    onUpload(url.trim());
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPreview(null);
    setStatus("idle");
    setErrorMsg(null);
    setDirectUrl("");
    onUpload("");
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-zinc-300">{label}</label>
        <div className="flex items-center gap-1 text-[11px]">
          <button
            type="button"
            onClick={() => setMode("upload")}
            className={`px-2 py-0.5 rounded-md transition-colors ${
              mode === "upload" ? "bg-zinc-800 text-zinc-100 font-medium" : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            Upload
          </button>
          <span className="text-zinc-600">|</span>
          <button
            type="button"
            onClick={() => setMode("url")}
            className={`px-2 py-0.5 rounded-md transition-colors ${
              mode === "url" ? "bg-zinc-800 text-zinc-100 font-medium" : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            Image Link
          </button>
        </div>
      </div>

      {mode === "upload" ? (
        <div
          onClick={() => !preview && inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            const file = e.dataTransfer.files?.[0];
            if (file) uploadFile(file);
          }}
          className={[
            "relative flex items-center justify-center rounded-xl border-2 border-dashed transition-all duration-200 overflow-hidden",
            preview ? "h-32 cursor-default border-zinc-700 bg-zinc-950/40" : "h-24 cursor-pointer",
            dragging ? "border-blue-500 bg-blue-950/30 scale-[1.01]" : "",
            !preview && !dragging ? "border-zinc-700/80 bg-zinc-800/40 hover:border-blue-500/60 hover:bg-zinc-800/80" : "",
            status === "error" ? "border-red-800/80 bg-red-950/20" : "",
          ].filter(Boolean).join(" ")}
        >
          {preview ? (
            <div className="relative h-full w-full flex items-center justify-center p-2">
              <img
                src={preview}
                alt="Product preview"
                className="h-full max-w-full object-contain rounded-lg"
              />
              <button
                type="button"
                onClick={handleClear}
                className="absolute top-2 right-2 p-1 rounded-full bg-zinc-900/80 hover:bg-zinc-800 text-zinc-300 border border-zinc-700 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center gap-1.5 p-3 text-center">
              {status === "uploading" ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin text-blue-400" />
                  <span className="text-xs text-zinc-400">Uploading to Cloudinary...</span>
                </>
              ) : (
                <>
                  <UploadCloud className="w-5 h-5 text-zinc-400" />
                  <p className="text-xs font-medium text-zinc-300">
                    Click to upload or drag image here
                  </p>
                  <p className="text-[10px] text-zinc-500">
                    PNG, JPG, WEBP up to 10MB
                  </p>
                </>
              )}
            </div>
          )}

          <input
            ref={inputRef}
            type="file"
            accept={ALLOWED_MIME_TYPES.join(",")}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) uploadFile(file);
              e.target.value = "";
            }}
            className="hidden"
          />
        </div>
      ) : (
        <div className="space-y-2">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <LinkIcon className="absolute left-3 top-2.5 w-3.5 h-3.5 text-zinc-500" />
              <input
                type="url"
                value={directUrl}
                onChange={(e) => setDirectUrl(e.target.value)}
                placeholder="Paste public image URL (https://...)"
                className="w-full bg-zinc-800/80 border border-zinc-700 rounded-xl pl-8 pr-3 py-2 text-xs text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
            <button
              type="button"
              onClick={() => handleApplyDirectUrl(directUrl)}
              className="bg-blue-600 hover:bg-blue-500 text-white text-xs px-3.5 py-2 rounded-xl font-medium transition-colors"
            >
              Apply
            </button>
          </div>

          {preview && (
            <div className="relative h-28 rounded-xl border border-zinc-700 bg-zinc-950/40 p-2 flex items-center justify-center">
              <img
                src={preview}
                alt="Product preview"
                className="h-full object-contain rounded-lg"
                onError={() => setErrorMsg("Could not load image from this URL. Please check the link.")}
              />
              <button
                type="button"
                onClick={handleClear}
                className="absolute top-2 right-2 p-1 rounded-full bg-zinc-900/80 hover:bg-zinc-800 text-zinc-300 border border-zinc-700"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      )}

      {errorMsg && (
        <p className="text-[11px] text-red-400 leading-tight">{errorMsg}</p>
      )}
    </div>
  );
}
