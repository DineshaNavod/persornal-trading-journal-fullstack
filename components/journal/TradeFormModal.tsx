"use client";

import { useState } from "react";
import { X, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { useTradeData } from "@/lib/hooks/useTradeData";
import { SymbolSelector } from "@/components/journal/SymbolSelector";
import { ImageUploadSlot } from "@/components/journal/ImageUploadSlot";
import { ChecklistGate } from "@/components/journal/ChecklistGate";
import { IMAGE_SLOTS } from "@/lib/constants";
import { uploadTradeImage } from "@/lib/store";
import { cn, formatCurrency } from "@/lib/utils";
import { EMPTY_CHECKLIST, type Direction, type TradeChecklist } from "@/types/trade";

type ImageKey = (typeof IMAGE_SLOTS)[number]["key"];

export function TradeFormModal({ onClose }: { onClose: () => void }) {
  const { account, activeStrategy, addTrade } = useTradeData();

  const [symbolId,    setSymbolId]    = useState("");
  const [direction,   setDirection]   = useState<Direction>("buy");
  const [entry,       setEntry]       = useState("");
  const [stopLoss,    setStopLoss]    = useState("");
  const [takeProfit,  setTakeProfit]  = useState("");
  const [riskDollar,  setRiskDollar]  = useState("");  // manually entered $ risked
  const [profitDollar, setProfitDollar] = useState(""); // manually entered $ earned
  const [notes,       setNotes]       = useState("");
  const [checklist,   setChecklist]   = useState<TradeChecklist>(EMPTY_CHECKLIST);
  const [images, setImages] = useState<Record<ImageKey, string | null>>({
    htf_image_url: null, mtf_image_url: null, ltf_image_url: null,
  });
  const [uploadingKey, setUploadingKey] = useState<ImageKey | null>(null);
  const [submitting,   setSubmitting]   = useState(false);
  const [formError,    setFormError]    = useState<string | null>(null);

  // Derived preview
  const rNum = Number(riskDollar);
  const pNum = Number(profitDollar);
  const rMultiple = rNum > 0 && profitDollar !== "" ? (pNum / rNum) : null;
  const isWin = pNum > 0;

  const allImagesUploaded = IMAGE_SLOTS.every((s) => images[s.key]);
  const allChecked = Object.values(checklist).every(Boolean);
  const canSubmit =
    symbolId && entry && stopLoss && takeProfit &&
    riskDollar && Number(riskDollar) > 0 &&
    profitDollar !== "" &&
    allImagesUploaded && allChecked && !submitting;

  async function handleImageSelected(key: ImageKey, file: File) {
    setUploadingKey(key);
    setFormError(null);
    try {
      const url = await uploadTradeImage(file);
      setImages((prev) => ({ ...prev, [key]: url }));
    } catch {
      setFormError("Image upload failed. Please try again.");
    } finally {
      setUploadingKey(null);
    }
  }

  async function handleSubmit() {
    if (!canSubmit || !account) return;
    setSubmitting(true);
    setFormError(null);
    try {
      await addTrade({
        account_id:        account.id,
        symbol_id:         symbolId,
        strategy_id:       activeStrategy?.id ?? null,
        date:              new Date().toISOString(),
        direction,
        entry_price:       Number(entry),
        stop_loss_price:   Number(stopLoss),
        take_profit_price: Number(takeProfit),
        risk_dollar:       Number(riskDollar),
        profit:            Number(profitDollar),
        notes:             notes.trim() || null,
        checklist,
        htf_image_url: images.htf_image_url as string,
        mtf_image_url: images.mtf_image_url as string,
        ltf_image_url: images.ltf_image_url as string,
      });
      onClose();
    } catch {
      setFormError("Couldn't save this trade. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex animate-fade-in flex-col bg-neutral-50 dark:bg-neutral-950">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-neutral-150 bg-white px-4 py-3.5 dark:border-neutral-800 dark:bg-neutral-900 sm:px-6">
        <div>
          <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-50">Log a trade</h2>
          <p className="text-xs text-neutral-400">
            Main Account · {formatCurrency(account?.starting_balance ?? 6000)} · {new Date().toLocaleDateString()}
          </p>
        </div>
        <button type="button" onClick={onClose} className="btn-ghost"><X size={19} /></button>
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto px-4 py-5 sm:px-6 lg:px-10 lg:py-8">
        <div className="mx-auto max-w-2xl space-y-4">

          {/* 1. Symbol + Direction */}
          <div className="card card-pad grid gap-4 sm:grid-cols-2">
            <SymbolSelector value={symbolId} onChange={setSymbolId} />

            <div>
              <label className="field-label">Direction</label>
              <div className="grid grid-cols-2 gap-2">
                {(["buy", "sell"] as Direction[]).map((d) => (
                  <button key={d} type="button" onClick={() => setDirection(d)}
                    className={cn(
                      "flex items-center justify-center gap-1.5 rounded-xl border-2 py-2.5 text-sm font-semibold transition-all",
                      direction === d && d === "buy"  ? "border-profit bg-profit-soft text-profit-dark" :
                      direction === d && d === "sell" ? "border-loss bg-loss-soft text-loss-dark" :
                      "border-neutral-150 text-neutral-400 hover:border-neutral-300 dark:border-neutral-800"
                    )}>
                    {d === "buy" ? <ArrowUpRight size={16}/> : <ArrowDownRight size={16}/>}
                    {d === "buy" ? "Buy" : "Sell"}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 2. Prices */}
          <div className="card card-pad grid gap-4 sm:grid-cols-3">
            <div>
              <label className="field-label">Entry price</label>
              <input className="input" type="number" step="any"
                value={entry} onChange={(e) => setEntry(e.target.value)} placeholder="0.00000"/>
            </div>
            <div>
              <label className="field-label">Stop loss</label>
              <input className="input" type="number" step="any"
                value={stopLoss} onChange={(e) => setStopLoss(e.target.value)} placeholder="0.00000"/>
            </div>
            <div>
              <label className="field-label">Take profit</label>
              <input className="input" type="number" step="any"
                value={takeProfit} onChange={(e) => setTakeProfit(e.target.value)} placeholder="0.00000"/>
            </div>
          </div>

          {/* 3. Risk $ + Profit $ */}
          <div className="card card-pad grid gap-4 sm:grid-cols-2">
            {/* Risk $ */}
            <div>
              <label className="field-label">
                Risk $
                <span className="ml-1.5 text-[11px] font-normal text-neutral-400">how much you risked</span>
              </label>
              <div className="flex overflow-hidden rounded-xl border border-loss/40 bg-white focus-within:border-loss focus-within:ring-4 focus-within:ring-loss/10 dark:bg-neutral-900 dark:border-loss/30">
                <span className="flex items-center pl-3 pr-1 text-sm font-bold text-loss select-none">$</span>
                <input
                  className="min-w-0 flex-1 border-0 bg-transparent py-2.5 pr-3 text-sm text-neutral-900 placeholder:text-neutral-300 outline-none dark:text-neutral-100"
                  type="number" min="0" step="0.01"
                  value={riskDollar}
                  onChange={(e) => setRiskDollar(e.target.value)}
                  placeholder="0.00"
                />
              </div>
              {riskDollar && Number(riskDollar) > 0 && (
                <p className="mt-1 text-xs font-medium text-loss-dark">
                  − {formatCurrency(Number(riskDollar))} at risk
                </p>
              )}
            </div>

            {/* Profit / Loss $ */}
            <div>
              <label className="field-label">
                Profit / Loss $
                <span className="ml-1.5 text-[11px] font-normal text-neutral-400">negative = loss</span>
              </label>
              <div className={cn(
                "flex overflow-hidden rounded-xl border bg-white focus-within:ring-4 dark:bg-neutral-900",
                profitDollar === ""
                  ? "border-neutral-200 focus-within:border-accent focus-within:ring-accent/10 dark:border-neutral-700"
                  : isWin
                  ? "border-profit/40 focus-within:border-profit focus-within:ring-profit/10"
                  : "border-loss/40 focus-within:border-loss focus-within:ring-loss/10"
              )}>
                <span className={cn(
                  "flex items-center pl-3 pr-1 text-sm font-bold select-none",
                  profitDollar === "" ? "text-neutral-300" : isWin ? "text-profit" : "text-loss"
                )}>$</span>
                <input
                  className="min-w-0 flex-1 border-0 bg-transparent py-2.5 pr-3 text-sm text-neutral-900 placeholder:text-neutral-300 outline-none dark:text-neutral-100"
                  type="number" step="0.01"
                  value={profitDollar}
                  onChange={(e) => setProfitDollar(e.target.value)}
                  placeholder="0.00"
                />
              </div>
              {profitDollar !== "" && (
                <p className={cn("mt-1 text-xs font-medium", isWin ? "text-profit-dark" : "text-loss-dark")}>
                  {isWin ? "+" : ""}{formatCurrency(pNum)}
                  {rMultiple !== null && ` · ${rMultiple >= 0 ? "+" : ""}${rMultiple.toFixed(2)}R`}
                  {isWin ? " ✓ Win" : " Loss"}
                </p>
              )}
            </div>
          </div>

          {/* 4. Strategy */}
          <div className="card card-pad">
            <label className="field-label">Strategy</label>
            <div className="rounded-xl border border-neutral-150 bg-neutral-50 px-3.5 py-2.5 text-sm text-neutral-500 dark:border-neutral-800 dark:bg-neutral-900">
              {activeStrategy?.name ?? "No strategy defined yet"}
            </div>
          </div>

          {/* 5. Notes */}
          <div className="card card-pad">
            <label className="field-label">Notes</label>
            <textarea className="input min-h-[88px] resize-y" value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="What happened? What would you do differently?" />
          </div>

          {/* 6. Required screenshots */}
          <div className="card card-pad">
            <div className="mb-3">
              <label className="field-label">Required screenshots</label>
              <p className="text-[11px] text-neutral-400">All three timeframes must be uploaded before saving.</p>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {IMAGE_SLOTS.map((slot) => (
                <ImageUploadSlot key={slot.key}
                  label={slot.label} description={slot.description}
                  imageUrl={images[slot.key]} uploading={uploadingKey === slot.key}
                  onFileSelected={(f) => handleImageSelected(slot.key, f)}
                  onClear={() => setImages((p) => ({ ...p, [slot.key]: null }))} />
              ))}
            </div>
          </div>

          {/* 7. Checklist */}
          <ChecklistGate checklist={checklist} onChange={setChecklist} />

          {formError && <p className="text-sm font-medium text-loss-dark">{formError}</p>}
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-neutral-150 bg-white px-4 py-3.5 dark:border-neutral-800 dark:bg-neutral-900 sm:px-6">
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-3">
          <p className="text-xs text-neutral-400">
            {!canSubmit && "Fill all fields, upload 3 screenshots, and complete the checklist."}
          </p>
          <button type="button" onClick={handleSubmit} disabled={!canSubmit} className="btn-accent">
            {submitting ? "Saving…" : "Save trade"}
          </button>
        </div>
      </div>
    </div>
  );
}
