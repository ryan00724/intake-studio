"use client";

import * as React from "react";

interface CheckboxProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  label?: string;
  className?: string;
  disabled?: boolean;
}

export function Checkbox({ checked, onCheckedChange, label, className, disabled }: CheckboxProps) {
  return (
    <label className={`flex items-center gap-3 cursor-pointer select-none group ${className || ""} ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}>
      <div className="relative">
        <input
          type="checkbox"
          className="peer sr-only"
          checked={checked}
          onChange={(e) => onCheckedChange(e.target.checked)}
          disabled={disabled}
        />
        <div
          className={`
            h-5 w-5 rounded-md border transition-all duration-200 ease-in-out
            flex items-center justify-center
            ${checked 
              ? "bg-blue-600 border-blue-600 text-white" 
              : "bg-white border-zinc-300 dark:bg-zinc-800 dark:border-zinc-700 hover:border-zinc-400 dark:hover:border-zinc-600"
            }
            peer-focus-visible:ring-2 peer-focus-visible:ring-blue-500/30 peer-focus-visible:ring-offset-1 dark:peer-focus-visible:ring-offset-zinc-900
          `}
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="3" 
            strokeLinecap="round" 
            strokeLinejoin="round"
            className={`w-3.5 h-3.5 transition-all duration-200 ${checked ? "scale-100 opacity-100" : "scale-50 opacity-0"}`}
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
      </div>
      {label && (
        <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300 group-hover:text-zinc-900 dark:group-hover:text-zinc-200 transition-colors">
          {label}
        </span>
      )}
    </label>
  );
}
