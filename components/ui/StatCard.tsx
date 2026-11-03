import React from "react";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

export interface StatCardProps {
  label: string;
  value: string | number;
  description?: string;
  icon: React.ReactNode;
  trend?: {
    value: string;
    isPositive?: boolean;
    isNeutral?: boolean;
  };
  emptyStateText?: string;
  className?: string;
}

export function StatCard({
  label,
  value,
  description,
  icon,
  trend,
  emptyStateText,
  className,
}: StatCardProps) {
  const isZeroOrEmpty =
    value === 0 || value === "0" || value === "0%" || value === "--" || !value;

  return (
    <div
      className={cn(
        "p-5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] hover:border-[var(--border-strong)] transition-all shadow-sm space-y-3",
        className
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-[var(--text-secondary)]">
          {label}
        </span>
        <div className="w-9 h-9 rounded-xl bg-[#8B16F7]/12 flex items-center justify-center text-[#C42BEE]">
          {icon}
        </div>
      </div>

      <div>
        <div className="text-2xl md:text-3xl font-bold tracking-tight text-[var(--text-primary)]">
          {value}
        </div>
        {description && (
          <p className="text-xs text-[var(--text-muted)] mt-0.5">
            {description}
          </p>
        )}
      </div>

      {trend && !isZeroOrEmpty && (
        <div className="flex items-center gap-1.5 text-xs pt-1 border-t border-[var(--border-subtle)]">
          {trend.isNeutral ? (
            <Minus className="w-3.5 h-3.5 text-zinc-400" />
          ) : trend.isPositive ? (
            <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
          ) : (
            <TrendingDown className="w-3.5 h-3.5 text-rose-500" />
          )}
          <span
            className={
              trend.isNeutral
                ? "text-zinc-400 font-medium"
                : trend.isPositive
                ? "text-emerald-500 font-medium"
                : "text-rose-500 font-medium"
            }
          >
            {trend.value}
          </span>
          <span className="text-[var(--text-muted)]">vs last week</span>
        </div>
      )}

      {isZeroOrEmpty && emptyStateText && (
        <div className="text-[11px] text-[var(--text-muted)] pt-1 border-t border-[var(--border-subtle)] italic">
          {emptyStateText}
        </div>
      )}
    </div>
  );
}

