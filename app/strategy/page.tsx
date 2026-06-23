"use client";

import { useEffect, useState } from "react";
import { Lock, Pencil, Check, X, Plus, Trash2 } from "lucide-react";
import { useTradeData } from "@/lib/hooks/useTradeData";
import { cn } from "@/lib/utils";

export default function StrategyPage() {
  const { loading, activeStrategy, updateStrategy } = useTradeData();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState("");
  const [rules, setRules] = useState("");
  const [entryConditions, setEntryConditions] = useState("");
  const [exitConditions, setExitConditions] = useState("");
  const [riskRules, setRiskRules] = useState("");
  const [checklist, setChecklist] = useState<string[]>([]);

  useEffect(() => {
    if (!activeStrategy) return;
    setName(activeStrategy.name);
    setRules(activeStrategy.rules);
    setEntryConditions(activeStrategy.entry_conditions);
    setExitConditions(activeStrategy.exit_conditions);
    setRiskRules(activeStrategy.risk_rules);
    setChecklist(activeStrategy.discipline_checklist);
  }, [activeStrategy]);

  if (loading) {
    return <div className="py-20 text-center text-sm text-neutral-400">Loading strategy…</div>;
  }

  if (!activeStrategy) {
    return (
      <div className="card card-pad py-12 text-center text-sm text-neutral-400">
        No strategy has been defined yet.
      </div>
    );
  }

  async function handleSave() {
    if (!activeStrategy) return;
    setSaving(true);
    try {
      await updateStrategy(activeStrategy.id, {
        name,
        rules,
        entry_conditions: entryConditions,
        exit_conditions: exitConditions,
        risk_rules: riskRules,
        discipline_checklist: checklist.filter((c) => c.trim()),
      });
      setEditing(false);
    } finally {
      setSaving(false);
    }
  }

  function handleCancel() {
    if (!activeStrategy) return;
    setName(activeStrategy.name);
    setRules(activeStrategy.rules);
    setEntryConditions(activeStrategy.entry_conditions);
    setExitConditions(activeStrategy.exit_conditions);
    setRiskRules(activeStrategy.risk_rules);
    setChecklist(activeStrategy.discipline_checklist);
    setEditing(false);
  }

  return (
    <div className="space-y-5">
      <div className="card card-pad flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent-light text-accent dark:bg-accent/15">
            <Lock size={16} />
          </span>
          <div>
            <p className="text-sm font-semibold text-neutral-800 dark:text-neutral-100">
              This plan is locked
            </p>
            <p className="text-xs text-neutral-400">
              Read-only for trading. Only the admin edit toggle can change it.
            </p>
          </div>
        </div>

        {editing ? (
          <div className="flex gap-2">
            <button type="button" onClick={handleCancel} className="btn-outline">
              <X size={15} /> Cancel
            </button>
            <button type="button" onClick={handleSave} disabled={saving} className="btn-accent">
              <Check size={15} /> {saving ? "Saving…" : "Save"}
            </button>
          </div>
        ) : (
          <button type="button" onClick={() => setEditing(true)} className="btn-outline">
            <Pencil size={14} /> Admin edit
          </button>
        )}
      </div>

      {editing ? (
        <input
          className="input text-lg font-semibold"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      ) : (
        <h2 className="px-1 text-lg font-semibold text-neutral-900 dark:text-neutral-50">
          {activeStrategy.name}
        </h2>
      )}

      <div className="grid gap-5 lg:grid-cols-2">
        <StrategySection
          title="Trading rules"
          value={rules}
          editing={editing}
          onChange={setRules}
        />
        <StrategySection
          title="Entry conditions"
          value={entryConditions}
          editing={editing}
          onChange={setEntryConditions}
        />
        <StrategySection
          title="Exit conditions"
          value={exitConditions}
          editing={editing}
          onChange={setExitConditions}
        />
        <StrategySection
          title="Risk rules"
          value={riskRules}
          editing={editing}
          onChange={setRiskRules}
        />
      </div>

      <div className="card card-pad">
        <h3 className="mb-1 text-sm font-semibold text-neutral-700 dark:text-neutral-200">
          Allowed risk levels
        </h3>
        <p className="mb-3 text-xs text-neutral-400">
          Fixed by design — the Journal can only ever offer these.
        </p>
        <div className="flex gap-2">
          {activeStrategy.allowed_risk_levels.map((level) => (
            <span key={level} className="pill-accent">
              {level}%
            </span>
          ))}
        </div>
      </div>

      <div className="card card-pad">
        <h3 className="mb-3 text-sm font-semibold text-neutral-700 dark:text-neutral-200">
          Discipline checklist
        </h3>
        <ul className="space-y-2">
          {checklist.map((item, i) => (
            <li key={i} className="flex items-center gap-2.5">
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
              {editing ? (
                <div className="flex flex-1 items-center gap-2">
                  <input
                    className="input"
                    value={item}
                    onChange={(e) =>
                      setChecklist((prev) => prev.map((c, idx) => (idx === i ? e.target.value : c)))
                    }
                  />
                  <button
                    type="button"
                    onClick={() => setChecklist((prev) => prev.filter((_, idx) => idx !== i))}
                    className="btn-ghost !px-2"
                    aria-label="Remove item"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ) : (
                <span className="text-sm text-neutral-600 dark:text-neutral-300">{item}</span>
              )}
            </li>
          ))}
        </ul>
        {editing && (
          <button
            type="button"
            onClick={() => setChecklist((prev) => [...prev, ""])}
            className="btn-ghost mt-2 !px-2 text-xs"
          >
            <Plus size={13} /> Add item
          </button>
        )}
      </div>
    </div>
  );
}

function StrategySection({
  title,
  value,
  editing,
  onChange,
}: {
  title: string;
  value: string;
  editing: boolean;
  onChange: (v: string) => void;
}) {
  return (
    <div className="card card-pad">
      <h3 className="mb-2 text-sm font-semibold text-neutral-700 dark:text-neutral-200">{title}</h3>
      {editing ? (
        <textarea
          className={cn("input min-h-[110px] resize-y")}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : (
        <p className="text-[13px] leading-relaxed text-neutral-600 dark:text-neutral-300">
          {value || "—"}
        </p>
      )}
    </div>
  );
}
