"use client";

import { useState } from "react";
import { Plus, X, ChevronDown } from "lucide-react";
import { useTradeData } from "@/lib/hooks/useTradeData";

export function SymbolSelector({ value, onChange }: { value: string; onChange: (id: string) => void }) {
  const { symbols, addSymbol } = useTradeData();
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleAdd() {
    if (!name.trim()) return;
    setSaving(true);
    try {
      const sym = await addSymbol(name.trim());
      onChange(sym.id);
      setName("");
      setAdding(false);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <label className="field-label">Symbol</label>
        <button type="button" onClick={() => setAdding((v) => !v)}
          className="mb-1.5 flex items-center gap-1 text-xs font-medium text-accent hover:underline">
          {adding ? <><X size={12} /> Cancel</> : <><Plus size={12} /> Add</>}
        </button>
      </div>

      {adding ? (
        <div className="flex gap-2">
          <input className="input flex-1" placeholder="e.g. USDCAD"
            value={name} onChange={(e) => setName(e.target.value.toUpperCase())}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()} autoFocus />
          <button type="button" onClick={handleAdd} disabled={saving || !name.trim()}
            className="btn-accent !px-3 text-xs">Add</button>
        </div>
      ) : (
        <div className="relative">
          <select className="input appearance-none pr-10" value={value}
            onChange={(e) => onChange(e.target.value)}>
            <option value="" disabled>Select symbol…</option>
            {symbols.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <ChevronDown size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400" />
        </div>
      )}
    </div>
  );
}
