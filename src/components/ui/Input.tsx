import React from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  prefixLabel?: string;
  rightSlot?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, prefixLabel, rightSlot, ...props }, ref) => {
    return (
      <div className="relative flex items-center group">
        {prefixLabel && (
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <span className="text-zinc-500 dark:text-zinc-400 text-sm font-medium">{prefixLabel}</span>
          </div>
        )}
        <input
          ref={ref}
          className={`
            block w-full rounded-xl border border-zinc-200 bg-white py-2 text-sm text-zinc-900 
            placeholder:text-zinc-400 
            focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10 
            disabled:cursor-not-allowed disabled:opacity-50 
            dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:border-blue-500
            transition-all duration-200 ease-in-out
            shadow-sm hover:border-zinc-300 dark:hover:border-zinc-700
            ${prefixLabel ? "pl-8" : "pl-3"}
            ${rightSlot ? "pr-10" : "pr-3"}
            ${className || ""}
          `}
          {...props}
        />
        {rightSlot && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-2">
            {rightSlot}
          </div>
        )}
      </div>
    );
  }
);
Input.displayName = "Input";
