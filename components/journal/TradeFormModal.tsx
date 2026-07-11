"use client";

import { useState } from "react";
import { X, ArrowUpRight, ArrowDownRight, ChevronDown, Flame, Snowflake, Waves, CircleSlash } from "lucide-react";
import { useTradeData } from "@/lib/hooks/useTradeData";
import { SymbolSelector } from "@/components/journal/SymbolSelector";
import { ImageUploadSlot } from "@/components/journal/ImageUploadSlot";
import { ChecklistGate } from "@/components/journal/ChecklistGate";
import { IMAGE_SLOTS, MARKET_CONDITIONS } from "@/lib/constants";
import { uploadTradeImage } from "@/lib/store";
import { cn, formatCurrency } from "@/lib/utils";
import { EMPTY_CHECKLIST, type Direction, type MarketCondition, type TradeChecklist } from "@/types/trade";

type ImageKey = (typeof IMAGE_SLOTS)[number]["key"];

function todayUtcMinus4(): string {
  // UTC-4 "now", formatted as YYYY-MM-DD for the date input default
  const now = new Date();
  const utcMs = now.getTime() + now.getTimezoneOffset() * 60000;
  const utc4 = new Date(utcMs - 4 * 60 * 60000);
  return utc4.toISOString().slice(0, 10);
}

export function TradeFormModal({ onClose }: { onClose: () => void }) {
  const { account, activeStrategy, addTrade } = useTradeData();

  const [symbolId,    setSymbolId]    = useState("");
  const [direction,   setDirection]   = useState<Direction>("buy");
  const [tradeDate,   setTradeDate]   = useState(todayUtcMinus4());
  const [entryTime,   setEntryTime]   = useState("");
  const [marketCond,  setMarketCond]  = useState<MarketCondition | "">("");
  const [isFomo,      setIsFomo]      = useState<boolean | null>(null);
  const [lqSweep,     setLqSweep]     = useState<boolean | null>(null);
  const [entry,       setEntry]       = useState("");
  const [stopLoss,    setStopLoss]    = useState("");
  const [takeProfit,  setTakeProfit]  = useState("");
  const [riskDollar,  setRiskDollar]  = useState("");
  const [profitDollar, setProfitDollar] = useState("");
  const [notes,       setNotes]       = useState("");
  const [checklist,   setChecklist]   = useState<TradeChecklist>(EMPTY_CHECKLIST);
  const [images, setImages] = useState<Record<ImageKey, string | null>>({
    htf_image_url: null, mtf_image_url: null, ltf_image_url: null,
  });
  const [uploadingKey, setUploadingKey] = useState<ImageKey | null>(null);
  const [submitting,   setSubmitting]   = useState(false);
  const [formError,    setFormError]    = useState<string | null>(null);

  const rNum = Number(riskDollar);
  const pNum = Number(profitDollar);
  const rMultiple = rNum > 0 && profitDollar !== "" ? (pNum / rNum) : null;
  const isWin = pNum > 0;

  const allImagesUploaded = IMAGE_SLOTS.every((s) => images[s.key]);
  const allChecked = Object.values(checklist).every(Boolean);
  const entryNum  = Number(entry);
  const slNum     = Number(stopLoss);
  const tpNum     = Number(takeProfit);
  const riskNum   = Math.round(Number(riskDollar)   * 100) / 100;
  const profitNum = Math.round(Number(profitDollar) * 100) / 100;

  const canSubmit =
    symbolId &&
    tradeDate && entryTime &&
    marketCond !== "" &&
    isFomo !== null &&
    lqSweep !== null &&
    isFinite(entryNum)  && entry !== "" &&
    isFinite(slNum)     && stopLoss !== "" &&
    isFinite(tpNum)     && takeProfit !== "" &&
    isFinite(riskNum)   && riskNum > 0 &&
    isFinite(profitNum) && profitDollar !== "" &&
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
        // date is the canonical timestamp every other feature (Calendar,
        // Dashboard equity curve, period filters, "Closed at" column) reads —
        // it MUST reflect the real trade execution time, not when this form
        // was submitted. Built directly from the trade_date + entry_time the
        // user enters (UTC-4), so there's a single source of truth.
        date:              `${tradeDate}T${entryTime}:00-04:00`,
        trade_date:        tradeDate,
        entry_time:        entryTime,
        market_condition:  marketCond || null,
        is_fomo:           isFomo,
        lq_sweep:          lqSweep,
        direction,
        entry_price:       entryNum,
        stop_loss_price:   slNum,
        take_profit_price: tpNum,
        risk_dollar:       riskNum,
        profit:            profitNum,
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
        <div className="min-w-0">
          <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-50">Log a trade</h2>
          <p className="truncate text-xs text-neutral-400">
            Main Account · {formatCurrency(account?.starting_balance ?? 6000)}
          </p>
        </div>
        <button type="button" onClick={onClose} className="btn-ghost shrink-0"><X size={19} /></button>
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto px-3 py-4 sm:px-6 sm:py-5 lg:px-10 lg:py-8">
        <div className="mx-auto max-w-2xl space-y-4">

          {/* 1. Trade Date + Entry Time (UTC-4) */}
          <div className="card card-pad">
            <div className="mb-3 flex items-center justify-between">
              <label className="field-label !mb-0">When did you actually enter? (UTC-4)</label>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="field-label text-[11px]">Trade date</label>
                <input className="input" type="date"
                  value={tradeDate} onChange={(e) => setTradeDate(e.target.value)} />
              </div>
              <div>
                <label className="field-label text-[11px]">Entry time</label>
                <input className="input" type="time"
                  value={entryTime} onChange={(e) => setEntryTime(e.target.value)} />
              </div>
            </div>
            <p className="mt-2 text-[11px] text-neutral-400">
              Enter the real execution time, not when you're journaling — this drives killzone &amp; day analytics.
            </p>
          </div>

          {/* 2. Symbol + Direction */}
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

          {/* 3. Market Condition */}
          <div className="card card-pad">
            <label className="field-label">Market Condition</label>
            <div className="relative">
              <select
                className="input appearance-none pr-10"
                value={marketCond}
                onChange={(e) => setMarketCond(e.target.value as MarketCondition)}
              >
                <option value="" disabled>Select market condition…</option>
                {MARKET_CONDITIONS.map((mc) => (
                  <option key={mc.value} value={mc.value}>{mc.label}</option>
                ))}
              </select>
              <ChevronDown size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            </div>
          </div>

          {/* 4. FOMO + LQ Sweep toggles */}
          <div className="card card-pad grid gap-4 sm:grid-cols-2">
            <div>
              <label className="field-label">Entry discipline</label>
              <div className="grid grid-cols-2 gap-2">
                <button type="button" onClick={() => setIsFomo(false)}
                  className={cn(
                    "flex items-center justify-center gap-1.5 rounded-xl border-2 py-2.5 text-xs font-semibold transition-all sm:text-sm",
                    isFomo === false ? "border-profit bg-profit-soft text-profit-dark"
                      : "border-neutral-150 text-neutral-400 hover:border-neutral-300 dark:border-neutral-800"
                  )}>
                  <Snowflake size={15}/> Not FOMO
                </button>
                <button type="button" onClick={() => setIsFomo(true)}
                  className={cn(
                    "flex items-center justify-center gap-1.5 rounded-xl border-2 py-2.5 text-xs font-semibold transition-all sm:text-sm",
                    isFomo === true ? "border-loss bg-loss-soft text-loss-dark"
                      : "border-neutral-150 text-neutral-400 hover:border-neutral-300 dark:border-neutral-800"
                  )}>
                  <Flame size={15}/> FOMO
                </button>
              </div>
            </div>

            <div>
              <label className="field-label">Liquidity sweep</label>
              <div className="grid grid-cols-2 gap-2">
                <button type="button" onClick={() => setLqSweep(true)}
                  className={cn(
                    "flex items-center justify-center gap-1.5 rounded-xl border-2 py-2.5 text-xs font-semibold transition-all sm:text-sm",
                    lqSweep === true ? "border-profit bg-profit-soft text-profit-dark"
                      : "border-neutral-150 text-neutral-400 hover:border-neutral-300 dark:border-neutral-800"
                  )}>
                  <Waves size={15}/> H/L Sweep
                </button>
                <button type="button" onClick={() => setLqSweep(false)}
                  className={cn(
                    "flex items-center justify-center gap-1.5 rounded-xl border-2 py-2.5 text-xs font-semibold transition-all sm:text-sm",
                    lqSweep === false ? "border-loss bg-loss-soft text-loss-dark"
                      : "border-neutral-150 text-neutral-400 hover:border-neutral-300 dark:border-neutral-800"
                  )}>
                  <CircleSlash size={15}/> No Sweep
                </button>
              </div>
            </div>
          </div>

          {/* 5. Prices */}
          <div className="card card-pad grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="field-label">Entry price</label>
              <input className="input" type="number" step="any" inputMode="decimal"
                value={entry} onChange={(e) => setEntry(e.target.value)} placeholder="0.00000"/>
            </div>
            <div>
              <label className="field-label">Stop loss</label>
              <input className="input" type="number" step="any" inputMode="decimal"
                value={stopLoss} onChange={(e) => setStopLoss(e.target.value)} placeholder="0.00000"/>
            </div>
            <div>
              <label className="field-label">Take profit</label>
              <input className="input" type="number" step="any" inputMode="decimal"
                value={takeProfit} onChange={(e) => setTakeProfit(e.target.value)} placeholder="0.00000"/>
            </div>
          </div>

          {/* 6. Risk $ + Profit $ */}
          <div className="card card-pad grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="field-label">
                Risk $
                <span className="ml-1.5 text-[11px] font-normal text-neutral-400">how much you risked</span>
              </label>
              <div className="flex overflow-hidden rounded-xl border border-loss/40 bg-white focus-within:border-loss focus-within:ring-4 focus-within:ring-loss/10 dark:bg-neutral-900 dark:border-loss/30">
                <span className="flex items-center pl-3 pr-1 text-sm font-bold text-loss select-none">$</span>
                <input
                  className="min-w-0 flex-1 border-0 bg-transparent py-2.5 pr-3 text-sm text-neutral-900 placeholder:text-neutral-300 outline-none dark:text-neutral-100"
                  type="text" inputMode="decimal" autoComplete="off"
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
                  type="text" inputMode="decimal" autoComplete="off"
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

          {/* 7. Strategy */}
          <div className="card card-pad">
            <label className="field-label">Strategy</label>
            <div className="rounded-xl border border-neutral-150 bg-neutral-50 px-3.5 py-2.5 text-sm text-neutral-500 dark:border-neutral-800 dark:bg-neutral-900">
              {activeStrategy?.name ?? "No strategy defined yet"}
            </div>
          </div>

          {/* 8. Notes */}
          <div className="card card-pad">
            <label className="field-label">Notes</label>
            <textarea className="input min-h-[88px] resize-y" value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="What happened? What would you do differently?" />
          </div>

          {/* 9. Required screenshots */}
          <div className="card card-pad">
            <div className="mb-3">
              <label className="field-label">Required screenshots</label>
              <p className="text-[11px] text-neutral-400">All three timeframes must be uploaded before saving.</p>
            </div>
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              {IMAGE_SLOTS.map((slot) => (
                <ImageUploadSlot key={slot.key}
                  label={slot.label} description={slot.description}
                  imageUrl={images[slot.key]} uploading={uploadingKey === slot.key}
                  onFileSelected={(f) => handleImageSelected(slot.key, f)}
                  onClear={() => setImages((p) => ({ ...p, [slot.key]: null }))} />
              ))}
            </div>
          </div>

          {/* 10. Checklist */}
          <ChecklistGate checklist={checklist} onChange={setChecklist} />

          {formError && <p className="text-sm font-medium text-loss-dark">{formError}</p>}
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-neutral-150 bg-white px-3 py-3 dark:border-neutral-800 dark:bg-neutral-900 sm:px-6 sm:py-3.5">
        <div className="mx-auto flex max-w-2xl flex-col-reverse items-stretch gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
          <p className="text-center text-[11px] text-neutral-400 sm:text-left sm:text-xs">
            {!canSubmit && "Fill all fields, upload 3 screenshots, and complete the checklist."}
          </p>
          <button type="button" onClick={handleSubmit} disabled={!canSubmit} className="btn-accent w-full sm:w-auto">
            {submitting ? "Saving…" : "Save trade"}
          </button>
        </div>
      </div>
    </div>
  );
}
