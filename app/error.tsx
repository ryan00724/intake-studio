"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log to your error reporting service here (e.g. Sentry)
    console.error("Unhandled error:", error);
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-50 dark:bg-zinc-950 px-6 text-center">
      <div className="w-14 h-14 mb-6 rounded-full bg-red-50 dark:bg-red-500/10 flex items-center justify-center">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-red-500"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      </div>
      <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
        Something went wrong
      </h1>
      <p className="text-sm text-zinc-500 max-w-sm mb-8">
        An unexpected error occurred. Please try again, or contact support if the problem persists.
      </p>
      <div className="flex items-center gap-3">
        <button
          onClick={reset}
          className="px-5 py-2 rounded-lg text-sm font-medium bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors"
        >
          Try again
        </button>
        <a
          href="/dashboard"
          className="px-5 py-2 rounded-lg text-sm font-medium text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200 transition-colors"
        >
          Back to dashboard
        </a>
      </div>
    </div>
  );
}
