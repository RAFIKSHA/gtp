import React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?:
    | "default"
    | "purple"
    | "magenta"
    | "orange"
    | "success"
    | "warning"
    | "destructive"
    | "outline";
  size?: "sm" | "md";
}

export function Badge({
  className,
  variant = "default",
  size = "md",
  ...props
}: BadgeProps) {
  const baseStyles =
    "inline-flex items-center font-medium rounded-full transition-colors select-none";

  const sizeStyles = {
    sm: "text-[10px] px-2 py-0.5 gap-1",
    md: "text-xs px-2.5 py-1 gap-1.5",
  };

  const variantStyles = {
    default:
      "bg-[var(--border-subtle)] text-[var(--text-secondary)] border border-[var(--border-strong)]",
    purple:
      "bg-[#8B16F7]/15 text-[#C42BEE] border border-[#8B16F7]/30",
    magenta:
      "bg-[#C42BEE]/15 text-[#C42BEE] border border-[#C42BEE]/30",
    orange:
      "bg-[#FF791E]/15 text-[#FF791E] border border-[#FF791E]/30",
    success:
      "bg-emerald-500/15 text-emerald-500 border border-emerald-500/30",
    warning:
      "bg-amber-500/15 text-amber-500 border border-amber-500/30",
    destructive:
      "bg-rose-500/15 text-rose-500 border border-rose-500/30",
    outline:
      "bg-transparent text-[var(--text-secondary)] border border-[var(--border-strong)]",
  };

  return (
    <span
      className={cn(baseStyles, sizeStyles[size], variantStyles[variant], className)}
      {...props}
    />
  );
}

