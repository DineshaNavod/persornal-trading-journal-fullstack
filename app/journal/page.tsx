"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { useTradeData } from "@/lib/hooks/useTradeData";
import { TradeTable } from "@/components/journal/TradeTable";
import { TradeFormModal } from "@/components/journal/TradeFormModal";
import { TradeReviewModal } from "@/components/review/TradeReviewModal";
import type { TradeWithRelations } from "@/types/trade";

export default function JournalPage() {
  const { loading, trades, account, removeTrade } = useTradeData();
  const [showForm, setShowForm] = useState(false);
  const [selected, setSelected] = useState<TradeWithRelations | null>(null);

  return (
    <div className="space-y-5">
      <div className="card card-pad">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-neutral-700 dark:text-neutral-200">
              All trades
            </h2>
            <p className="text-xs text-neutral-400">
              {trades.length} logged · all metrics computed from this data
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowForm(true)}
            disabled={!account}
            className="btn-accent"
          >
            <Plus size={16} /> New trade
          </button>
        </div>

        {loading ? (
          <div className="py-10 text-center text-sm text-neutral-400">Loading…</div>
        ) : (
          <TradeTable trades={trades} onSelect={setSelected} />
        )}
      </div>

      {showForm && <TradeFormModal onClose={() => setShowForm(false)} />}

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
