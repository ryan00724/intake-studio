import React from "react";

interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  active?: boolean;
  variant?: "ghost" | "solid";
}

export function IconButton({ children, className, active, variant = "ghost", ...props }: IconButtonProps) {
  const baseStyles = "p-2 rounded-lg transition-all duration-200 ease-in-out hover:scale-105 active:scale-95 flex items-center justify-center cursor-pointer";
  
  const ghostStyles = active
    ? "bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-50"
    : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50 dark:text-zinc-400 dark:hover:text-zinc-200 dark:hover:bg-zinc-800/50";

  const solidStyles = "bg-white border border-zinc-200 shadow-sm hover:bg-zinc-50 text-zinc-700 dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-800";

  return (
    <button
      className={`${baseStyles} ${variant === "solid" ? solidStyles : ghostStyles} ${className || ""}`}
      {...props}
    >
      {children}
    </button>
  );
}
