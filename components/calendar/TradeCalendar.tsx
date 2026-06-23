"use client";

import { useMemo } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import type { DateClickArg } from "@fullcalendar/interaction";
import type { DayCellContentArg } from "@fullcalendar/core";
import { formatCurrency, localDateKey } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { TradeWithRelations } from "@/types/trade";

export function TradeCalendar({ trades, onDateClick }: {
  trades: TradeWithRelations[];
  onDateClick: (dateKey: string) => void;
}) {
  const tradesByDate = useMemo(() => {
    const map = new Map<string, TradeWithRelations[]>();
    for (const trade of trades) {
      const key = localDateKey(trade.date);
      const list = map.get(key) ?? [];
      list.push(trade);
      map.set(key, list);
    }
    return map;
  }, [trades]);

  return (
    <FullCalendar
      plugins={[dayGridPlugin, interactionPlugin]}
      initialView="dayGridMonth"
      /* No "today" button — removed per spec */
      headerToolbar={{ left: "prev,next", center: "title", right: "" }}
      height="auto"
      fixedWeekCount={false}
      dateClick={(arg: DateClickArg) => {
        const key = localDateKey(arg.date);
        const dayTrades = tradesByDate.get(key);
        if (dayTrades && dayTrades.length > 0) onDateClick(key);
      }}
      dayCellClassNames={(arg) => {
        const key = localDateKey(arg.date);
        const dayTrades = tradesByDate.get(key);
        if (!dayTrades?.length) return [];
        const total = dayTrades.reduce((sum, t) => sum + t.pnl, 0);
        return [total >= 0 ? "fc-day-profit" : "fc-day-loss", "fc-day-has-trades"];
      }}
      dayCellContent={(arg: DayCellContentArg) => {
        const key = localDateKey(arg.date);
        const dayTrades = tradesByDate.get(key);
        const total = dayTrades?.reduce((sum, t) => sum + t.pnl, 0) ?? 0;

        return (
          <div className="flex h-full flex-col gap-1 p-1">
            <span className={cn(
              "self-end text-xs font-medium",
              dayTrades?.length ? "text-neutral-700 dark:text-neutral-200" : "text-neutral-400"
            )}>
              {arg.date.getDate()}
            </span>
            {dayTrades && dayTrades.length > 0 && (
              <span className={cn(
                "self-start rounded-full px-1.5 py-0.5 text-[10px] font-semibold leading-none",
                total >= 0
                  ? "bg-profit/15 text-profit-dark"
                  : "bg-loss/15 text-loss-dark"
              )}>
                {formatCurrency(total, { sign: true })}
              </span>
            )}
          </div>
        );
      }}
    />
  );
}
