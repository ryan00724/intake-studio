import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Intake Studio — Beautiful client intake forms that convert",
  description:
    "Create guided, multi-step intake experiences your clients will actually enjoy filling out. Drag-and-drop builder, branded themes, AI generation, and instant publishing.",
  openGraph: {
    title: "Intake Studio — Beautiful client intake forms that convert",
    description:
      "Create guided, multi-step intake experiences your clients will actually enjoy filling out.",
    type: "website",
    siteName: "Intake Studio",
  },
  twitter: {
    card: "summary_large_image",
    title: "Intake Studio — Beautiful client intake forms that convert",
    description:
      "Create guided, multi-step intake experiences your clients will actually enjoy filling out.",
  },
};

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
      {/* ── Nav ───────────────────────────────────────────────── */}
      <nav className="border-b border-zinc-100 dark:border-zinc-800/60">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-br from-zinc-800 to-zinc-950 dark:from-white dark:to-zinc-200 rounded-lg shadow-sm">
              <span className="text-white dark:text-zinc-900 font-bold text-base">I</span>
            </div>
            <span className="font-semibold text-zinc-900 dark:text-zinc-100">Intake Studio</span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="px-4 py-2 rounded-lg text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
            >
              Sign in
            </Link>
            <Link
              href="/login?mode=signup"
              className="px-4 py-2 rounded-lg text-sm font-medium bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors"
            >
              Get started
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ──────────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-6 pt-24 pb-20 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-6">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
          Now in beta
        </div>
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight leading-[1.1] mb-6 max-w-3xl mx-auto">
          Beautiful client intake{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-zinc-500 to-zinc-900 dark:from-zinc-400 dark:to-white">
            forms that convert
          </span>
        </h1>
        <p className="text-lg text-zinc-500 dark:text-zinc-400 max-w-xl mx-auto mb-10 leading-relaxed">
          Create guided, multi-step intake experiences your clients will actually enjoy filling out. No code required.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Link
            href="/login?mode=signup"
            className="px-6 py-3 rounded-xl text-sm font-medium bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors shadow-sm"
          >
            Start building — it&apos;s free
          </Link>
          <Link
            href="#features"
            className="px-6 py-3 rounded-xl text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            See how it works
          </Link>
        </div>
      </section>

      {/* ── Features ──────────────────────────────────────────── */}
      <section id="features" className="max-w-6xl mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <h2 className="text-2xl sm:text-3xl font-bold mb-3">Everything you need</h2>
          <p className="text-zinc-500 dark:text-zinc-400 max-w-lg mx-auto">
            From drag-and-drop building to branded experiences, Intake Studio has you covered.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors"
            >
              <div className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-4 text-zinc-500 dark:text-zinc-400">
                {f.icon}
              </div>
              <h3 className="font-semibold mb-1.5">{f.title}</h3>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── How it works ──────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <h2 className="text-2xl sm:text-3xl font-bold mb-3">Three simple steps</h2>
          <p className="text-zinc-500 dark:text-zinc-400 max-w-lg mx-auto">
            Go from idea to live intake form in minutes.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {STEPS.map((s, i) => (
            <div key={s.title} className="text-center">
              <div className="w-10 h-10 rounded-full bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 flex items-center justify-center text-sm font-bold mx-auto mb-4">
                {i + 1}
              </div>
              <h3 className="font-semibold mb-1.5">{s.title}</h3>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <div className="rounded-2xl bg-zinc-900 dark:bg-white p-12 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-white dark:text-zinc-900 mb-3">
            Ready to level up your client intake?
          </h2>
          <p className="text-zinc-400 dark:text-zinc-500 max-w-md mx-auto mb-8">
            Join designers, agencies and freelancers who use Intake Studio to onboard clients effortlessly.
          </p>
          <Link
            href="/login?mode=signup"
            className="inline-flex px-6 py-3 rounded-xl text-sm font-medium bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            Create your first intake
          </Link>
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────────── */}
      <footer className="border-t border-zinc-100 dark:border-zinc-800/60">
        <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm text-zinc-400">
            <div className="w-5 h-5 bg-gradient-to-br from-zinc-800 to-zinc-950 dark:from-white dark:to-zinc-200 rounded flex items-center justify-center">
              <span className="text-white dark:text-zinc-900 font-bold text-[10px]">I</span>
            </div>
            Intake Studio
          </div>
          <p className="text-xs text-zinc-400">
            &copy; {new Date().getFullYear()} Intake Studio. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}

// ── Feature data ────────────────────────────────────────────────

const icon = (d: string) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);

const FEATURES = [
  {
    title: "Drag & drop editor",
    desc: "Build multi-step forms visually with sections, questions, image choices, moodboards, and more.",
    icon: icon("M12 3v18M3 12h18"),
  },
  {
    title: "Guided experiences",
    desc: "Walk clients through one section at a time with smooth transitions and progress indicators.",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 8L22 12L18 16" /><path d="M2 12h20" />
      </svg>
    ),
  },
  {
    title: "Branded themes",
    desc: "Video backgrounds, custom colors, gradients, patterns, and font styling to match your brand.",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="13.5" cy="6.5" r="2.5" /><path d="M17 2H7a5 5 0 0 0-5 5v10a5 5 0 0 0 5 5h10a5 5 0 0 0 5-5V7a5 5 0 0 0-5-5Z" />
      </svg>
    ),
  },
  {
    title: "AI generation",
    desc: "Describe your intake in plain English and let AI create a complete multi-section form for you.",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" />
      </svg>
    ),
  },
  {
    title: "Submissions & export",
    desc: "View responses in list or table view. Export as CSV or JSON. Search and filter submissions.",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" /><polyline points="14 2 14 8 20 8" />
      </svg>
    ),
  },
  {
    title: "Instant publishing",
    desc: "One click to publish. Share a unique link with your clients. Validate before going live.",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" /><path d="m9 12 2 2 4-4" />
      </svg>
    ),
  },
];

const STEPS = [
  {
    title: "Build your form",
    desc: "Use the visual editor to add sections, questions, and presentation blocks. Or let AI generate one for you.",
  },
  {
    title: "Customize the look",
    desc: "Add your brand colors, video backgrounds, and themes. Make it feel like yours.",
  },
  {
    title: "Share & collect",
    desc: "Publish with one click, share the link, and watch submissions roll in.",
  },
];
