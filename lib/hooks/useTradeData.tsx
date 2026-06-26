"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import * as store from "@/lib/store";
import { buildHydratedTrades, computeMetrics, type PortfolioMetrics } from "@/lib/calculations";
import type { Account, Strategy, Symbol as TradeSymbol, Trade, TradeWithRelations } from "@/types/trade";

interface TradeDataContextValue {
  loading: boolean;
  error: string | null;
  account: Account | null;
  symbols: TradeSymbol[];
  strategies: Strategy[];
  activeStrategy: Strategy | null;
  trades: TradeWithRelations[];
  metrics: PortfolioMetrics;
  refresh: () => Promise<void>;
  addSymbol: (name: string) => Promise<TradeSymbol>;
  addTrade: (input: Omit<Trade, "id" | "created_at">) => Promise<Trade>;
  removeTrade: (id: string) => Promise<void>;
  adjustCapital: (delta: number) => Promise<void>;
}

const TradeDataContext = createContext<TradeDataContextValue | null>(null);

export function TradeDataProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [account, setAccount] = useState<Account | null>(null);
  const [symbols, setSymbols] = useState<TradeSymbol[]>([]);
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [rawTrades, setRawTrades] = useState<Trade[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [acc, syms, strats, trades] = await Promise.all([
        store.getMainAccount(),
        store.listSymbols(),
        store.listStrategies(),
        store.listTrades(),
      ]);
      setAccount(acc);
      setSymbols(syms);
      setStrategies(strats);
      setRawTrades(trades);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load journal data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const symbolById = useMemo(() => new Map(symbols.map((s) => [s.id, s])), [symbols]);
  const strategyById = useMemo(() => new Map(strategies.map((s) => [s.id, s])), [strategies]);

  const trades = useMemo<TradeWithRelations[]>(() => {
    if (!account) return [];
    const { hydrated } = buildHydratedTrades(rawTrades, [account]);
    return hydrated
      .map((t) => ({
        ...t,
        symbol: symbolById.get(t.symbol_id) ?? null,
        strategy: t.strategy_id ? strategyById.get(t.strategy_id) ?? null : null,
      }))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [rawTrades, account, symbolById, strategyById]);

  const metrics = useMemo(
    () => computeMetrics(trades, account ? [account] : []),
    [trades, account]
  );

  const addSymbol = useCallback(async (name: string) => {
    const symbol = await store.createSymbol(name);
    setSymbols((prev) => [...prev, symbol]);
    return symbol;
  }, []);

  const addTrade = useCallback(async (input: Omit<Trade, "id" | "created_at">) => {
    const trade = await store.createTrade(input);
    setRawTrades((prev) => [trade, ...prev]);
    return trade;
  }, []);

  const removeTrade = useCallback(async (id: string) => {
    await store.deleteTrade(id);
    setRawTrades((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const adjustCapital = useCallback(async (delta: number) => {
    const updated = await store.adjustCapital(delta);
    setAccount(updated);
  }, []);


  return (
    <TradeDataContext.Provider value={{
      loading, error, account, symbols, strategies,
      activeStrategy: strategies[0] ?? null,
      trades, metrics,
      refresh: load, addSymbol, addTrade, removeTrade, adjustCapital,
    }}>
      {children}
    </TradeDataContext.Provider>
  );
}

export function useTradeData() {
  const ctx = useContext(TradeDataContext);
  if (!ctx) throw new Error("useTradeData must be used within a TradeDataProvider");
  return ctx;
}
