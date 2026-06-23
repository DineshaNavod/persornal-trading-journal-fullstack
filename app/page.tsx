"use client";

import { useState } from "react";
import { Wallet, TrendingUp, Target, Gauge, Scale } from "lucide-react";
import { useTradeData } from "@/lib/hooks/useTradeData";
import { formatCurrency, formatPercent, formatR } from "@/lib/utils";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { AccountBalanceCard } from "@/components/dashboard/AccountBalanceCard";
import { TradeTable } from "@/components/journal/TradeTable";
import { TradeReviewModal } from "@/components/review/TradeReviewModal";
import Link from "next/link";
import type { TradeWithRelations } from "@/types/trade";

export default function DashboardPage() {
  const { loading, trades, metrics, account, removeTrade } = useTradeData();
  const [selected, setSelected] = useState<TradeWithRelations | null>(null);

  if (loading) return (
    <div className="flex items-center justify-center py-32 text-sm text-neutral-400">
      Loading your journal…
    </div>
  );

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <KpiCard icon={Wallet} label="Account balance" value={formatCurrency(metrics.accountBalance)} />
        <KpiCard icon={TrendingUp} label="Total PnL"
          value={formatCurrency(metrics.totalPnl, { sign: true })}
          valueClassName={metrics.totalPnl >= 0 ? "text-profit-dark" : "text-loss-dark"} />
        <KpiCard icon={Target} label="Win rate" value={formatPercent(metrics.winRate)} />
        <KpiCard icon={Gauge} label="Avg R / trade"
          value={formatR(metrics.avgR)}
          valueClassName={metrics.avgR >= 0 ? "text-profit-dark" : "text-loss-dark"} />
        <KpiCard icon={Scale} label="Profit factor"
          value={metrics.profitFactor === Infinity ? "∞" : metrics.profitFactor.toFixed(2)} />
      </div>

      <AccountBalanceCard
        trades={trades}
        startingBalance={account?.starting_balance ?? 6000}
        tradeCount={trades.length}
      />

      <div className="card card-pad">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-neutral-700 dark:text-neutral-200">Recent trades</h2>
          <Link href="/journal" className="text-xs font-medium text-accent hover:underline">View all</Link>
        </div>
        <TradeTable trades={trades.slice(0, 6)} onSelect={setSelected} />
      </div>

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
