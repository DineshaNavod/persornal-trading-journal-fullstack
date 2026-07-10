"use client";

import { useMemo, useState } from "react";
import { useTradeData } from "@/lib/hooks/useTradeData";
import { TradeCalendar } from "@/components/calendar/TradeCalendar";
import { DayTradesModal } from "@/components/calendar/DayTradesModal";
import { TradeReviewModal } from "@/components/review/TradeReviewModal";
import { localDateKey } from "@/lib/utils";
import type { TradeWithRelations } from "@/types/trade";

export default function CalendarPage() {
  const { loading, trades, removeTrade } = useTradeData();
  const [activeDate, setActiveDate] = useState<string | null>(null);
  const [selected, setSelected] = useState<TradeWithRelations | null>(null);

  // FIX: computed once here and passed down — calendar component uses same map
  const tradesByDate = useMemo(() => {
    const map = new Map<string, TradeWithRelations[]>();
    for (const trade of trades) {
      // Use trade_date (the exact calendar date the user entered in UTC-4)
      // NOT trade.date which is a UTC timestamp that shifts to wrong day in SL timezone
      const key = trade.trade_date ?? localDateKey(trade.date);
      const list = map.get(key) ?? [];
      list.push(trade);
      map.set(key, list);
    }
    return map;
  }, [trades]);

  const activeTrades = activeDate ? (tradesByDate.get(activeDate) ?? []) : [];

  return (
    <div className="space-y-5">
      <div className="card card-pad">
        <div className="mb-4 flex flex-wrap items-center gap-3 text-xs text-neutral-500">
          <Legend color="bg-profit"                              label="Profitable day" />
          <Legend color="bg-loss"                               label="Losing day" />
          <Legend color="bg-neutral-200 dark:bg-neutral-700"   label="No trades" />
        </div>
        {loading ? (
          <div className="py-12 text-center text-sm text-neutral-400">Loading…</div>
        ) : (
          <TradeCalendar
            tradesByDate={tradesByDate}
            onDateClick={setActiveDate}
          />
        )}
      </div>

      {/* FIX: DayTradesModal only closes itself via setActiveDate(null),
              onSelectTrade does NOT call onClose to avoid double setState */}
      {activeDate && activeTrades.length > 0 && (
        <DayTradesModal
          date={activeDate}
          trades={activeTrades}
          onClose={() => setActiveDate(null)}
          onSelectTrade={(t) => {
            setActiveDate(null);
            setSelected(t);
          }}
        />
      )}

      {selected && (
        <TradeReviewModal
          trade={selected}
          onClose={() => setSelected(null)}
          onDelete={(id) => { removeTrade(id); setSelected(null); }}
        />
      )}
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={`h-2.5 w-2.5 rounded-full ${color}`} />
      {label}
    </span>
  );
}
