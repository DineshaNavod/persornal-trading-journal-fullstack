"use client";

import { useEffect, useRef, useState } from "react";
import {
  ImagePlus, Loader2, Check, X, ZoomIn, ZoomOut,
  Maximize2, Minimize2, ChevronLeft, ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { uploadStrategyImage, getStrategyImageUrl, saveStrategyImageUrl, deleteStrategyImageUrl } from "@/lib/store";

// ---------------------------------------------------------------------------
// STRATEGY PAGE — CA+ SETUP
// Fixed content. No edit. No admin toggle. Images uploadable + persistent.
// ---------------------------------------------------------------------------

// ── Image storage keys ──────────────────────────────────────────────────────
const SCENARIOS = [
  { key: "buy_premium",  label: "Buy Trend → Premium",  color: "text-profit-dark", bg: "bg-profit-soft" },
  { key: "buy_discount", label: "Buy Trend → Discount",  color: "text-profit-dark", bg: "bg-profit/10" },
  { key: "sell_premium", label: "Sell Trend → Premium",  color: "text-loss-dark",   bg: "bg-loss-soft" },
  { key: "sell_discount",label: "Sell Trend → Discount", color: "text-loss-dark",   bg: "bg-loss/10" },
] as const;

const ENTRY_MODEL_SLOTS = ["Setup Screenshot", "Entry Example"];

function lsKey(scenario: string, idx: number) {
  return `tj_strat_${scenario}_${idx}`;
}

// ── Fullscreen image viewer ──────────────────────────────────────────────────
function ImageModal({ url, label, onClose }: { url: string; label: string; onClose: () => void }) {
  const [zoom, setZoom] = useState(1);
  const [isFs, setIsFs] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "+" || e.key === "=") setZoom(z => Math.min(4, +(z + 0.25).toFixed(2)));
      if (e.key === "-") setZoom(z => Math.max(1, +(z - 0.25).toFixed(2)));
    };
    window.addEventListener("keydown", onKey);
    const onFs = () => setIsFs(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onFs);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
      document.removeEventListener("fullscreenchange", onFs);
    };
  }, [onClose]);

  async function toggleFs() {
    if (!ref.current) return;
    if (!document.fullscreenElement) await ref.current.requestFullscreen().catch(() => {});
    else await document.exitFullscreen().catch(() => {});
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div ref={ref} className={cn("relative flex flex-col bg-neutral-950 rounded-2xl overflow-hidden", isFs ? "w-screen h-screen rounded-none" : "w-[90vw] h-[85vh] max-w-5xl")}>
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-2.5">
          <span className="text-sm font-medium text-white/80">{label}</span>
          <div className="flex items-center gap-1">
            <CtrlBtn onClick={() => setZoom(z => Math.max(1, +(z - 0.25).toFixed(2)))}><ZoomOut size={15}/></CtrlBtn>
            <span className="min-w-[3rem] text-center text-xs text-white/60 tabular-nums">{Math.round(zoom * 100)}%</span>
            <CtrlBtn onClick={() => setZoom(z => Math.min(4, +(z + 0.25).toFixed(2)))}><ZoomIn size={15}/></CtrlBtn>
            <div className="mx-1 h-4 w-px bg-white/20"/>
            <CtrlBtn onClick={toggleFs}>{isFs ? <Minimize2 size={15}/> : <Maximize2 size={15}/>}</CtrlBtn>
            <CtrlBtn onClick={onClose}><X size={15}/></CtrlBtn>
          </div>
        </div>
        {/* Image */}
        <div className="flex flex-1 items-center justify-center overflow-auto p-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={url} alt={label} draggable={false}
            className="max-h-full max-w-full select-none object-contain"
            style={{
              transform: `scale(${zoom})`,
              willChange: zoom !== 1 ? "transform" : "auto",
              transition: "transform 0.15s cubic-bezier(0.25,0.46,0.45,0.94)",
              cursor: zoom > 1 ? "zoom-out" : "zoom-in",
            }}
            onClick={() => setZoom(z => z === 1 ? 2 : 1)}
          />
        </div>
      </div>
    </div>
  );
}

function CtrlBtn({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick}
      className="rounded-lg p-1.5 text-white/60 hover:bg-white/10 hover:text-white transition-colors">
      {children}
    </button>
  );
}

// ── Image slot ───────────────────────────────────────────────────────────────
function ImageSlot({ storageKey, label }: { storageKey: string; label: string }) {
  const [url, setUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [viewing, setViewing] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load: Supabase table first, fallback to localStorage (local mode)
  useEffect(() => {
    let cancelled = false;
    getStrategyImageUrl(storageKey).then((u) => {
      if (!cancelled) setUrl(u);
    }).catch(() => {});
    return () => { cancelled = true; };
  }, [storageKey]);

  async function clear() {
    await deleteStrategyImageUrl(storageKey).catch(() => {});
    setUrl(null);
    setUploadError(null);
  }

  async function onFile(file: File) {
    setUploading(true);
    setUploadError(null);
    try {
      const uploadedUrl = await uploadStrategyImage(file);
      await saveStrategyImageUrl(storageKey, uploadedUrl);
      setUrl(uploadedUrl);
    } catch (e) {
      setUploadError(e instanceof Error ? e.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <>
      <div className="flex flex-col gap-1.5">
        <div
          onClick={() => url ? setViewing(true) : inputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files?.[0]; if (f) onFile(f); }}
          className={cn(
            "group relative flex h-28 cursor-pointer items-center justify-center overflow-hidden rounded-xl border-2 border-dashed transition-all",
            url
              ? "border-accent/40 bg-neutral-900"
              : "border-neutral-200 bg-neutral-50 hover:border-accent/50 hover:bg-accent-light/30 dark:border-neutral-800 dark:bg-neutral-900"
          )}
        >
          <input ref={inputRef} type="file" accept="image/*" className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); e.target.value = ""; }} />

          {uploading ? (
            <Loader2 size={18} className="animate-spin text-accent"/>
          ) : url ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt={label} className="h-full w-full object-cover"/>
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/10">
                <ZoomIn size={20} className="text-white drop-shadow"/>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center gap-1 text-center">
              <ImagePlus size={17} className="text-neutral-300"/>
              <span className="text-[10px] text-neutral-400">Click or drop</span>
            </div>
          )}
        </div>
      </div>

      {uploadError && (
        <p className="mt-1 text-[10px] font-medium text-loss-dark">{uploadError}</p>
      )}
      {viewing && url && <ImageModal url={url} label={label} onClose={() => setViewing(false)}/>}
    </>
  );
}

// ── Section card ─────────────────────────────────────────────────────────────
function Section({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
  return (
    <div className="card card-pad">
      <div className="mb-4 flex items-center gap-2">
        <span className="text-base">{icon}</span>
        <h2 className="text-sm font-bold uppercase tracking-widest text-neutral-500 dark:text-neutral-400">
          {title}
        </h2>
      </div>
      {children}
    </div>
  );
}

// ── Entry criteria interactive checkboxes (session-only, not persisted) ──────
const ENTRY_CRITERIA = [
  "Bias Alignment",
  "High Probability POI",
  "LQ Sweep + Market Shift",
  "During Killzone",
  "Asymmetric Risk to Reward",
];

// ── Main page ────────────────────────────────────────────────────────────────
export default function StrategyPage() {
  const [checked, setChecked] = useState<boolean[]>(new Array(ENTRY_CRITERIA.length).fill(false));

  function toggle(i: number) {
    setChecked(prev => prev.map((v, idx) => idx === i ? !v : v));
  }

  const allChecked = checked.every(Boolean);

  return (
    <div className="space-y-5 pb-10">

      {/* ── Two-column layout ── */}
      <div className="grid gap-5 lg:grid-cols-2">

        {/* ════════ LEFT COLUMN ════════ */}
        <div className="space-y-5">

          {/* Pre-Marketing Routine */}
          <Section title="Pre-Marketing Routine" icon="🌅">
            <ol className="space-y-2.5">
              {[
                "Check Economic calendar",
                "Review Your trading Plan",
                "Analyze the chart",
                "Meditation / Relax",
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent-light text-xs font-bold text-accent dark:bg-accent/15">
                    {i + 1}
                  </span>
                  <span className="pt-0.5 text-sm text-neutral-700 dark:text-neutral-200">{item}</span>
                </li>
              ))}
            </ol>
          </Section>

          {/* Charting Process */}
          <Section title="Charting Process" icon="📈">
            <ol className="space-y-3">
              {[
                "Mark HTF range + premium/discount.",
                "Mark liquidity (PDH/PDL + equal highs/lows + Session H/L)",
                "Decide continuation vs pullback vs reversal",
                "Pick ONE target (opposing zone/structure).",
                `Define invalidation: "My bias is wrong if price breaks + holds beyond X,"`,
              ].map((step, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className={cn(
                    "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                    "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300"
                  )}>{i + 1}</span>
                  <span className="pt-0.5 text-sm text-neutral-700 dark:text-neutral-200">{step}</span>
                </li>
              ))}
            </ol>
          </Section>

          {/* Entry Criteria */}
          <Section title="Entry Criteria" icon="✅">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-xs text-neutral-400">Check each before entering a trade</p>
              <span className={cn(
                "pill text-xs font-bold",
                allChecked ? "pill-accent" : "bg-neutral-100 text-neutral-400 dark:bg-neutral-800"
              )}>
                {checked.filter(Boolean).length}/{ENTRY_CRITERIA.length}
              </span>
            </div>
            <ul className="space-y-2.5">
              {ENTRY_CRITERIA.map((item, i) => (
                <li key={i}
                  className="flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-800/50"
                  onClick={() => toggle(i)}
                >
                  <span className={cn(
                    "flex h-5 w-5 shrink-0 items-center justify-center rounded-[6px] border-2 transition-all",
                    checked[i]
                      ? "border-accent bg-accent text-white"
                      : "border-neutral-300 dark:border-neutral-600"
                  )}>
                    {checked[i] && <Check size={12} strokeWidth={3}/>}
                  </span>
                  <span className={cn(
                    "text-sm font-medium transition-colors",
                    checked[i] ? "text-neutral-500 line-through dark:text-neutral-500" : "text-neutral-700 dark:text-neutral-200"
                  )}>
                    {i + 1}. {item}
                  </span>
                </li>
              ))}
            </ul>
            {allChecked && (
              <div className="mt-3 flex items-center gap-2 rounded-xl bg-profit-soft px-3 py-2 dark:bg-profit/10">
                <Check size={14} className="text-profit-dark"/>
                <span className="text-xs font-semibold text-profit-dark">All criteria met — you may enter</span>
              </div>
            )}
          </Section>

          {/* Trade Management */}
          <Section title="Trade Management Rules" icon="📝">
            <ul className="space-y-3">
              {[
                "Predefine risk before entry (fixed R, no resizing mid-trade)",
                "Set and Forget",
                `If invalidation hits, you're done: exit and reassess, no "one more trade to make it back"`,
              ].map((rule, i) => (
                <li key={i} className="flex items-start gap-2.5">
                  <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent"/>
                  <span className="text-sm text-neutral-700 dark:text-neutral-200">{rule}</span>
                </li>
              ))}
            </ul>
          </Section>

          {/* Exit Criteria */}
          <Section title="Secret of Trading Success" icon="🎯">
            <p className="text-sm text-neutral-700 dark:text-neutral-200">
              No capital = no trade.<strong>Protect survival first,</strong> profits come second.
            </p>
          </Section>

          {/* Common Mistakes */}
          <Section title="Common Mistakes" icon="⚠️">
            <ol className="space-y-4">
              {[
                {
                  title: "Feelings are not a bias / framework",
                  body: `"I feel like buying / I feel like selling" — this feeling is not a strategy.`,
                },
                {
                  title: "Real bias comes from a plan",
                  body: "↳ Requires you to figure out a target.\n↳ Requires you to figure out your invalidation.",
                },
                {
                  title: "Trading in mid range",
                  body: "↳ Not extreme / Not premium / Not discount",
                },
                {
                  title: "Change bias on single candlestick",
                  body: "",
                },
                {
                  title: "It's not trust — it's bias",
                  body: "",
                },
              ].map((m, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-loss-soft text-xs font-bold text-loss-dark dark:bg-loss/15">
                    {i + 1}
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-neutral-700 dark:text-neutral-200">{m.title}</p>
                    {m.body && (
                      <p className="mt-0.5 whitespace-pre-line text-xs text-neutral-500 dark:text-neutral-400">
                        {m.body}
                      </p>
                    )}
                  </div>
                </li>
              ))}
            </ol>
          </Section>

        </div>{/* end left */}

        {/* ════════ RIGHT COLUMN ════════ */}
        <div className="space-y-5">

          {/* Market Conditions — 4 scenarios × 3 images each */}
          <Section title="Market Condition Screenshots" icon="🗺️">
            <p className="mb-4 text-xs text-neutral-400">
              Upload your chart examples for each market condition. Click any image to open fullscreen.
            </p>
            <div className="space-y-6">
              {SCENARIOS.map((scenario) => (
                <div key={scenario.key}>
                  <div className={cn(
                    "mb-2.5 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold",
                    scenario.bg, scenario.color
                  )}>
                    {scenario.label}
                  </div>
                  <div className="grid grid-cols-3 gap-2.5">
                    {[0, 1, 2].map((idx) => (
                      <ImageSlot
                        key={idx}
                        storageKey={lsKey(scenario.key, idx)}
                        label={`${scenario.label} · ${idx + 1}`}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Section>

          {/* Entry Model — 2 images */}
          <Section title="Entry Model" icon="📐">
            <p className="mb-3 text-xs text-neutral-400">
              Your exact entry model chart examples.
            </p>
            <div className="grid grid-cols-2 gap-3">
              {ENTRY_MODEL_SLOTS.map((label, idx) => (
                <ImageSlot
                  key={idx}
                  storageKey={lsKey("entry_model", idx)}
                  label={label}
                />
              ))}
            </div>
          </Section>

          {/* Trading Notes */}
          <Section title="Trading Notes" icon="💡">
            <ul className="space-y-2.5">
              {[
                "Bias is a plan + invalidation, not a prediction.",
                "If you can't say your bias in one sentence, you don't have one.",
                "If invalidation hits, reset. No coping, no revenge trade.",
                `"You don't build trust in your system with affirmations. You build it with data."`,
                "Conviction → confidence → competence → consistency.",
              ].map((note, i) => (
                <li key={i} className="flex items-start gap-2.5">
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-accent"/>
                  <span className="text-sm text-neutral-600 dark:text-neutral-300">{note}</span>
                </li>
              ))}
            </ul>
          </Section>

        </div>{/* end right */}
      </div>
    </div>
  );
}
