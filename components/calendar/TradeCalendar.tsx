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

export function TradeCalendar({
  tradesByDate,
  onDateClick,
}: {
  tradesByDate: Map<string, TradeWithRelations[]>;
  onDateClick: (dateKey: string) => void;
}) {

  return (
    <FullCalendar
      plugins={[dayGridPlugin, interactionPlugin]}
      initialView="dayGridMonth"
      headerToolbar={{ left: "prev,next", center: "title", right: "" }}
      height="auto"
      fixedWeekCount={false}
      dateClick={(arg: DateClickArg) => {
        const key = localDateKey(arg.date);
        if (tradesByDate.has(key)) onDateClick(key);
      }}
      dayCellClassNames={(arg) => {
        const key = localDateKey(arg.date);
        const dayTrades = tradesByDate.get(key);
        if (!dayTrades?.length) return [];
        const total = dayTrades.reduce((s, t) => s + t.pnl, 0);
        return [total > 0 ? "fc-day-profit" : total < 0 ? "fc-day-loss" : "fc-day-neutral", "fc-day-has-trades"];
      }}
      dayCellContent={(arg: DayCellContentArg) => {
        const key = localDateKey(arg.date);
        const dayTrades = tradesByDate.get(key);
        const total = dayTrades?.reduce((s, t) => s + t.pnl, 0) ?? 0;
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
                total > 0 ? "bg-profit/15 text-profit-dark" : total < 0 ? "bg-loss/15 text-loss-dark" : "bg-neutral-100 text-neutral-500 dark:bg-neutral-800"
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
