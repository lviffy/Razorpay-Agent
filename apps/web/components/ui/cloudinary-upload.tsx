"use client";

import React, { useRef, useState, useCallback } from "react";
import { ImagePlus, X, Loader2, UploadCloud, CheckCircle2 } from "lucide-react";

interface CloudinaryUploadProps {
  onUpload: (url: string) => void;
  existingUrl?: string;
  className?: string;
  label?: string;
}

// Cloudinary free-tier constraints
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

  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

  const uploadFile = useCallback(
    async (file: File) => {
      if (!cloudName || !uploadPreset) {
        // Dev fallback: just show local preview without uploading
        const localUrl = URL.createObjectURL(file);
        setPreview(localUrl);
        setStatus("done");
        onUpload(localUrl);
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

      // Show local preview immediately
      const localUrl = URL.createObjectURL(file);
      setPreview(localUrl);

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
        setErrorMsg(err?.message || "Upload failed. Try again.");
        setStatus("error");
        setPreview(null);
      }
    },
    [cloudName, uploadPreset, onUpload]
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadFile(file);
    // reset so same file can be re-selected
    e.target.value = "";
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) uploadFile(file);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPreview(null);
    setStatus("idle");
    setErrorMsg(null);
    onUpload("");
  };

  return (
    <div className={`space-y-1.5 ${className}`}>
      <label className="text-xs font-semibold text-zinc-700">{label}</label>

      <div
        onClick={() => !preview && inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className={[
          "relative flex items-center justify-center rounded-xl border-2 border-dashed transition-all duration-200 overflow-hidden",
          preview ? "h-36 cursor-default border-zinc-200 bg-zinc-50" : "h-24 cursor-pointer",
          dragging ? "border-blue-400 bg-blue-50 scale-[1.01]" : "",
          !preview && !dragging ? "border-zinc-200 bg-zinc-50/60 hover:border-blue-300 hover:bg-blue-50/40" : "",
          status === "error" ? "border-red-300 bg-red-50" : "",
        ].filter(Boolean).join(" ")}
      >
        {/* Preview image */}
        {preview && (
          <img
            src={preview}
            alt="Product preview"
            className="h-full w-full object-contain p-1"
          />
        )}

        {/* Uploading overlay */}
        {status === "uploading" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm gap-1.5">
            <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
            <span className="text-[11px] font-medium text-zinc-500">Uploading…</span>
          </div>
        )}

        {/* Done badge */}
        {status === "done" && preview && (
          <div className="absolute top-2 left-2 flex items-center gap-1 bg-green-500/90 text-white text-[10px] font-semibold px-2 py-0.5 rounded-full">
            <CheckCircle2 className="w-3 h-3" /> Uploaded
          </div>
        )}

        {/* Clear button */}
        {preview && status !== "uploading" && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute top-2 right-2 bg-white/90 hover:bg-red-50 border border-zinc-200 hover:border-red-300 text-zinc-500 hover:text-red-500 rounded-full p-1 shadow-sm transition-all"
            title="Remove image"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}

        {/* Change button (when image is set) */}
        {preview && status !== "uploading" && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="absolute bottom-2 right-2 bg-white/90 hover:bg-blue-50 border border-zinc-200 hover:border-blue-300 text-zinc-500 hover:text-blue-600 rounded-lg px-2 py-1 text-[10px] font-semibold shadow-sm transition-all flex items-center gap-1"
          >
            <ImagePlus className="w-3 h-3" /> Change
          </button>
        )}

        {/* Empty state */}
        {!preview && status !== "uploading" && (
          <div className="flex flex-col items-center gap-1.5 text-zinc-400 select-none">
            <UploadCloud className={`w-6 h-6 ${dragging ? "text-blue-500 scale-110" : ""} transition-all`} />
            <div className="text-center">
              <p className="text-[11px] font-semibold text-zinc-600">
                {dragging ? "Drop it!" : "Click or drag photo here"}
              </p>
              <p className="text-[10px] text-zinc-400 mt-0.5">{ALLOWED_EXT_LABEL} · max {MAX_SIZE_LABEL}</p>
            </div>
          </div>
        )}

        {/* Error state */}
        {status === "error" && !preview && (
          <div className="flex flex-col items-center gap-1 text-red-500">
            <X className="w-5 h-5" />
            <p className="text-[11px] font-semibold">{errorMsg}</p>
            <button
              type="button"
              onClick={() => { setStatus("idle"); setErrorMsg(null); }}
              className="text-[10px] underline text-red-400 hover:text-red-600"
            >
              Try again
            </button>
          </div>
        )}

        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif,image/bmp"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>

      {errorMsg && preview && (
        <p className="text-[11px] text-red-500 font-medium">{errorMsg}</p>
      )}
    </div>
  );
}
