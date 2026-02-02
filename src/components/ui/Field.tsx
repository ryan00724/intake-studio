import React from "react";

interface FieldProps {
  label?: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
  className?: string;
  rightSlot?: React.ReactNode;
}

export function Field({ label, hint, error, children, className, rightSlot }: FieldProps) {
  return (
    <div className={`space-y-1.5 ${className || ""}`}>
      {(label || rightSlot) && (
        <div className="flex justify-between items-center">
          {label && (
            <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
              {label}
            </label>
          )}
          {rightSlot}
        </div>
      )}
      {children}
      {hint && !error && <p className="text-xs text-zinc-500 dark:text-zinc-400">{hint}</p>}
      {error && <p className="text-xs text-red-500 dark:text-red-400">{error}</p>}
    </div>
  );
}
