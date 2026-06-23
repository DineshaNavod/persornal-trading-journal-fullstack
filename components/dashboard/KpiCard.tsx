import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function KpiCard({
  icon: Icon,
  label,
  value,
  valueClassName,
  hint,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  valueClassName?: string;
  hint?: string;
}) {
  return (
    <div className="card card-pad">
      <div className="flex items-center justify-between">
        <span className="label-eyebrow">{label}</span>
        <Icon size={15} className="text-neutral-300 dark:text-neutral-600" />
      </div>
      <div className={cn("mt-2 text-[22px] font-semibold tracking-tight", valueClassName)}>
        {value}
      </div>
      {hint && <div className="mt-1 text-xs text-neutral-400">{hint}</div>}
    </div>
  );
}
