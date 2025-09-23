import React from "react";

const sizeStyles = {
  sm: "h-4 w-4 border-2",
  md: "h-6 w-6 border-[3px]",
  lg: "h-8 w-8 border-[3px]",
};

export function LoadingSpinner({ label, size = "md", className = "", labelClassName = "" }) {
  const spinnerClass = sizeStyles[size] || sizeStyles.md;
  return (
    <div
      role="status"
      aria-live="polite"
      className={`inline-flex items-center gap-3 text-slate-600 ${className}`.trim()}
    >
      <span
        className={`inline-block rounded-full border-current border-t-transparent ${spinnerClass} animate-spin`}
      />
      {label ? <span className={`text-sm font-medium ${labelClassName}`}>{label}</span> : null}
    </div>
  );
}

export function LoadingOverlay({ label = "Cargando…", size = "md", className = "", labelClassName = "" }) {
  return (
    <div
      className={`absolute inset-0 z-30 flex items-center justify-center rounded-2xl bg-white/80 backdrop-blur-sm transition-opacity ${className}`.trim()}
    >
      <LoadingSpinner label={label} size={size} labelClassName={labelClassName} />
    </div>
  );
}

export function BusyButtonContent({ label, busyLabel, busy }) {
  if (!busy) return label;
  return (
    <span className="flex items-center justify-center gap-2">
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      <span>{busyLabel}</span>
    </span>
  );
}

export default LoadingSpinner;
