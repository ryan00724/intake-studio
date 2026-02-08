import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-50 dark:bg-zinc-950 px-6 text-center">
      <div className="w-14 h-14 mb-6 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
        <span className="text-2xl font-bold text-zinc-300 dark:text-zinc-600">?</span>
      </div>
      <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
        Page not found
      </h1>
      <p className="text-sm text-zinc-500 max-w-sm mb-8">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>
      <Link
        href="/dashboard"
        className="px-5 py-2 rounded-lg text-sm font-medium bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors"
      >
        Back to dashboard
      </Link>
    </div>
  );
}
