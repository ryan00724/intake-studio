import React from "react";

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        className={`
          block w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 
          placeholder:text-zinc-400 
          focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10 
          disabled:cursor-not-allowed disabled:opacity-50 
          dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:border-blue-500
          transition-all duration-200 ease-in-out
          shadow-sm hover:border-zinc-300 dark:hover:border-zinc-700
          min-h-[80px]
          resize-y
          ${className || ""}
        `}
        {...props}
      />
    );
  }
);
Textarea.displayName = "Textarea";
