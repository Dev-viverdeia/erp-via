import * as React from "react";
import { cn } from "@/lib/utils";

type StatusType = "success" | "error" | "warning" | "info" | "neutral";
type StatusVariant = "default" | "light" | "lighter";

interface StatusBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  status: StatusType;
  variant?: StatusVariant;
}

const styles: Record<StatusType, Record<StatusVariant, string>> = {
  success: {
    default: "bg-status-success text-white border-status-success",
    light: "bg-status-success-light/20 text-status-success-dark border-status-success-light/30",
    lighter: "bg-status-success-lighter text-status-success-dark border-status-success-light/20",
  },
  error: {
    default: "bg-status-error text-white border-status-error",
    light: "bg-status-error-light/20 text-status-error-dark border-status-error-light/30",
    lighter: "bg-status-error-lighter text-status-error-dark border-status-error-light/20",
  },
  warning: {
    default: "bg-status-warning text-white border-status-warning",
    light: "bg-status-warning-light/20 text-status-warning-dark border-status-warning-light/30",
    lighter: "bg-status-warning-lighter text-status-warning-dark border-status-warning-light/20",
  },
  info: {
    default: "bg-status-info text-white border-status-info",
    light: "bg-status-info-light/20 text-status-info-dark border-status-info-light/30",
    lighter: "bg-status-info-lighter text-status-info-dark border-status-info-light/20",
  },
  neutral: {
    default: "bg-status-neutral text-white border-status-neutral",
    light: "bg-status-neutral-light/20 text-status-neutral-dark border-status-neutral-light/30",
    lighter: "bg-status-neutral-lighter text-status-neutral-dark border-status-neutral-light/20",
  },
};

export function StatusBadge({ status, variant = "default", className, children, ...props }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-smooth",
        styles[status][variant],
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
}
