"use client";

import { useMemo, useState } from "react";
import { buildPerformanceCurve, type CurveMode, type CurvePeriod } from "@/lib/calculations";
import { cn } from "@/lib/utils";
import { PerformanceChart } from "@/components/dashboard/PerformanceChart";
import type { TradeWithRelations } from "@/types/trade";

const PERIODS: { label: string; value: CurvePeriod }[] = [
  { label: "7D", value: 7 },
  { label: "30D", value: 30 },
  { label: "90D", value: 90 },
  { label: "1Y", value: 365 },
  { label: "All", value: null },
];

const MODES: CurveMode[] = ["$", "%", "R"];

export function AccountBalanceCard({
  trades,
  startingBalance,
  tradeCount,
}: {
  trades: TradeWithRelations[];
  startingBalance: number;
  tradeCount: number;
}) {
  const [period, setPeriod] = useState<CurvePeriod>(30);
  const [mode, setMode] = useState<CurveMode>("$");

  const points = useMemo(
    () => buildPerformanceCurve(trades, startingBalance, mode, period),
    [trades, startingBalance, mode, period]
  );

  return (
    <div className="card card-pad">
      <div className="mb-1 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-neutral-700 dark:text-neutral-200">
          Account Balance
        </h2>

        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-neutral-150 p-0.5 dark:border-neutral-800">
            {MODES.map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                className={cn(
                  "rounded-md px-2.5 py-1 text-xs font-semibold transition-colors",
                  mode === m
                    ? "bg-accent text-white"
                    : "text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
                )}
              >
                {m}
              </button>
            ))}
          </div>

          <div className="flex rounded-lg border border-neutral-150 p-0.5 dark:border-neutral-800">
            {PERIODS.map((p) => (
              <button
                key={p.label}
                type="button"
                onClick={() => setPeriod(p.value)}
                className={cn(
                  "rounded-md px-2.5 py-1 text-xs font-semibold transition-colors",
                  period === p.value
                    ? "bg-accent text-white"
                    : "text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
                )}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </div>
      <p className="mb-2 text-xs text-neutral-400">{tradeCount} trades logged</p>

      <PerformanceChart points={points} mode={mode} />
    </div>
  );
}
