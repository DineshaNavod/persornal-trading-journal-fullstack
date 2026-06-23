"use client";

import { useRef, useState, type DragEvent } from "react";
import { ImagePlus, Loader2, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

export function ImageUploadSlot({
  label,
  description,
  imageUrl,
  uploading,
  onFileSelected,
  onClear,
}: {
  label: string;
  description: string;
  imageUrl: string | null;
  uploading: boolean;
  onFileSelected: (file: File) => void;
  onClear: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) onFileSelected(file);
  }

  return (
    <div>
      <div className="mb-1.5 flex items-center gap-1.5">
        <span className="text-[13px] font-medium text-neutral-600 dark:text-neutral-300">
          {label}
        </span>
        <span className="text-loss-dark">*</span>
        <span className="text-[11px] text-neutral-400">{description}</span>
      </div>

      <div
        onClick={() => !imageUrl && inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={cn(
          "relative flex h-32 cursor-pointer flex-col items-center justify-center overflow-hidden rounded-xl border-2 border-dashed text-center transition-colors",
          imageUrl
            ? "border-profit/40 bg-profit-soft/40"
            : dragOver
              ? "border-accent bg-accent-light"
              : "border-neutral-200 bg-neutral-50 hover:border-accent/50 hover:bg-accent-light/40 dark:border-neutral-700 dark:bg-neutral-900"
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onFileSelected(file);
            e.target.value = "";
          }}
        />

        {uploading ? (
          <Loader2 size={20} className="animate-spin text-accent" />
        ) : imageUrl ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={imageUrl} alt={label} className="h-full w-full object-cover" />
            <div className="absolute right-1.5 top-1.5 flex items-center gap-1">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-profit text-white">
                <Check size={12} />
              </span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onClear();
                }}
                aria-label={`Remove ${label} image`}
                className="flex h-5 w-5 items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70"
              >
                <X size={12} />
              </button>
            </div>
          </>
        ) : (
          <>
            <ImagePlus size={18} className="mb-1 text-neutral-300" />
            <span className="text-[11px] text-neutral-400">Click or drop image</span>
          </>
        )}
      </div>
    </div>
  );
}
