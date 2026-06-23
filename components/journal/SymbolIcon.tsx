import { getSymbolFlags } from "@/lib/currency-flags";

export function SymbolIcon({ symbolName }: { symbolName: string }) {
  const [a, b] = getSymbolFlags(symbolName);

  return (
    <span className="relative inline-flex h-6 w-9 shrink-0 items-center">
      <span className="absolute left-0 flex h-5 w-5 items-center justify-center rounded-full bg-white text-[11px] shadow-sm ring-1 ring-neutral-150 dark:bg-neutral-800 dark:ring-neutral-700">
        {a}
      </span>
      <span className="absolute left-3.5 flex h-5 w-5 items-center justify-center rounded-full bg-white text-[11px] shadow-sm ring-1 ring-neutral-150 dark:bg-neutral-800 dark:ring-neutral-700">
        {b}
      </span>
    </span>
  );
}
