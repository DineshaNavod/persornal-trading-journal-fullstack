"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { CurveMode, CurvePoint } from "@/lib/calculations";

function formatValue(value: number, mode: CurveMode) {
  if (mode === "$") return formatCurrency(value);
  if (mode === "%") return `${value >= 0 ? "+" : ""}${value.toFixed(1)}%`;
  return `${value >= 0 ? "+" : ""}${value.toFixed(2)}R`;
}

export function PerformanceChart({ points, mode }: { points: CurvePoint[]; mode: CurveMode }) {
  if (points.length <= 1) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-neutral-400">
        Log your first trade to see your performance curve.
      </div>
    );
  }

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={points} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id="performanceFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#7C5CFC" stopOpacity={0.28} />
              <stop offset="100%" stopColor="#7C5CFC" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid
            vertical={false}
            stroke="currentColor"
            className="text-neutral-150 dark:text-neutral-800"
          />
          <XAxis
            dataKey="date"
            tickFormatter={(v) => (v === "Start" ? "Start" : formatDate(v, { year: undefined }))}
            tick={{ fontSize: 11, fill: "#A6A6BC" }}
            axisLine={false}
            tickLine={false}
            minTickGap={28}
          />
          <YAxis
            tickFormatter={(v) =>
              mode === "$" ? `$${Math.round(v / 1000)}k` : `${v}${mode === "%" ? "%" : "R"}`
            }
            tick={{ fontSize: 11, fill: "#A6A6BC" }}
            axisLine={false}
            tickLine={false}
            width={44}
          />
          <Tooltip
            formatter={(value: number) => [formatValue(value, mode), "Value"]}
            labelFormatter={(label) => (label === "Start" ? "Starting point" : formatDate(label))}
            contentStyle={{
              borderRadius: 12,
              border: "1px solid #ECECF3",
              fontSize: 12,
              boxShadow: "0 8px 24px -8px rgba(22,22,31,0.15)",
            }}
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke="#7C5CFC"
            strokeWidth={2.25}
            fill="url(#performanceFill)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
