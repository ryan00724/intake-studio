import React from "react";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  noPadding?: boolean;
  active?: boolean;
}

export function Card({ children, className, noPadding = false, active = false, ...props }: CardProps) {
  return (
    <div
      className={`
        relative bg-white dark:bg-zinc-900 
        border transition-colors duration-150
        ${active 
            ? "border-blue-500 ring-2 ring-blue-500/30 dark:border-blue-500 shadow-sm z-10" 
            : "border-zinc-200 dark:border-zinc-800 hover:border-blue-500 dark:hover:border-blue-500 hover:ring-2 hover:ring-blue-500/30 hover:bg-blue-50/10 dark:hover:bg-blue-500/10 shadow-sm"
        }
        rounded-xl
        ${noPadding ? "" : "p-4"} 
        ${className || ""}
      `}
      {...props}
    >
      {children}
    </div>
  );
}
