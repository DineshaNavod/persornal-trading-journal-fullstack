"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Maximize2, Minimize2, ZoomIn, ZoomOut } from "lucide-react";
import { cn } from "@/lib/utils";

interface ImageSlot { label: string; description: string; url: string; }

export function ImageViewer({ images }: { images: ImageSlot[] }) {
  const [index, setIndex] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  const active = images[index];

  function goTo(next: number) {
    setZoom(1);
    setIndex((next + images.length) % images.length);
  }

  useEffect(() => {
    function onFs() { setIsFullscreen(Boolean(document.fullscreenElement)); }
    document.addEventListener("fullscreenchange", onFs);
    return () => document.removeEventListener("fullscreenchange", onFs);
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowLeft")  { e.preventDefault(); goTo(index - 1); }
      if (e.key === "ArrowRight") { e.preventDefault(); goTo(index + 1); }
      if (e.key === "=" || e.key === "+") setZoom((z) => Math.min(4, +(z + 0.25).toFixed(2)));
      if (e.key === "-")           setZoom((z) => Math.max(1, +(z - 0.25).toFixed(2)));
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, images.length]);

  async function toggleFullscreen() {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      await containerRef.current.requestFullscreen().catch(() => {});
    } else {
      await document.exitFullscreen().catch(() => {});
    }
  }

  const changeZoom = (delta: number) =>
    setZoom((z) => Math.min(4, Math.max(1, +(z + delta).toFixed(2))));

  return (
    <div className="flex flex-col gap-3">
      <div
        ref={containerRef}
        className={cn(
          "group relative overflow-hidden rounded-2xl border border-neutral-150 bg-neutral-950 dark:border-neutral-800",
          isFullscreen ? "h-screen" : "h-[280px] sm:h-[360px] lg:h-[420px]"
        )}
      >
        {/* Image — GPU-accelerated, no layout reflow */}
        <div className="flex h-full w-full items-center justify-center overflow-auto">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            ref={imgRef}
            key={active.url}   /* remount = instant swap, no transition artefact */
            src={active.url}
            alt={active.label}
            draggable={false}
            onClick={() => changeZoom(zoom === 1 ? 1 : -zoom + 1)}
            className="max-h-full max-w-full select-none object-contain"
            style={{
              transform: `scale(${zoom})`,
              /* Hardware-accelerate the scale so there's zero layout jank */
              willChange: zoom !== 1 ? "transform" : "auto",
              transition: "transform 0.15s cubic-bezier(0.25,0.46,0.45,0.94)",
              cursor: zoom > 1 ? "zoom-out" : "zoom-in",
            }}
          />
        </div>

        {/* Label */}
        <div className="absolute left-2 top-2 rounded-full bg-black/55 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-white/90">
          {active.label}
        </div>

        {/* Arrows — only show when more than 1 image */}
        {images.length > 1 && (
          <>
            <button type="button" onClick={() => goTo(index - 1)} aria-label="Previous"
              className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/45 p-1.5 text-white opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100 hover:bg-black/65">
              <ChevronLeft size={18} />
            </button>
            <button type="button" onClick={() => goTo(index + 1)} aria-label="Next"
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/45 p-1.5 text-white opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100 hover:bg-black/65">
              <ChevronRight size={18} />
            </button>
          </>
        )}

        {/* Controls */}
        <div className="absolute bottom-2 right-2 flex items-center gap-0.5 rounded-full bg-black/55 px-1 py-1 backdrop-blur-sm">
          <CtrlBtn onClick={() => changeZoom(-0.25)} label="Zoom out"><ZoomOut size={14} /></CtrlBtn>
          <span className="min-w-[2.6rem] text-center text-[11px] font-semibold tabular-nums text-white/80">
            {Math.round(zoom * 100)}%
          </span>
          <CtrlBtn onClick={() => changeZoom(0.25)}  label="Zoom in"><ZoomIn size={14} /></CtrlBtn>
          <div className="mx-1 h-3.5 w-px bg-white/20" />
          <CtrlBtn onClick={toggleFullscreen} label="Fullscreen">
            {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
          </CtrlBtn>
        </div>
      </div>

      {/* Thumbnail row */}
      <div className="flex gap-2">
        {images.map((img, i) => (
          <button key={img.label} type="button" onClick={() => goTo(i)}
            className={cn(
              "flex-1 rounded-xl border-2 px-2 py-2 text-left transition-all duration-150",
              i === index
                ? "border-accent bg-accent-light dark:bg-accent/10"
                : "border-neutral-150 hover:border-neutral-300 dark:border-neutral-800"
            )}>
            <div className="text-[11px] font-bold uppercase tracking-wide text-neutral-700 dark:text-neutral-200">{img.label}</div>
            <div className="text-[10px] text-neutral-400">{img.description}</div>
          </button>
        ))}
      </div>
    </div>
  );
}

function CtrlBtn({ onClick, label, children }: { onClick: () => void; label: string; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick} aria-label={label}
      className="rounded-full p-1.5 text-white/80 hover:bg-white/15 hover:text-white transition-colors">
      {children}
    </button>
  );
}
