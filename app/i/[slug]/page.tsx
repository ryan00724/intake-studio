import type { Metadata } from "next";
import { Suspense } from "react";
import { supabaseAdmin } from "@/src/lib/supabase/server";
import IntakeViewer from "./intake-viewer";

interface PageProps {
  params: Promise<{ slug: string }>;
}

/** Fetch the intake title + description for SEO (server-side only). */
async function getIntakeMeta(slug: string) {
  const { data } = await supabaseAdmin
    .from("intakes")
    .select("title, published_json")
    .eq("slug", slug)
    .eq("is_published", true)
    .single();

  if (!data) return null;

  const meta = data.published_json?.metadata;
  return {
    title: meta?.title || data.title || "Intake",
    description: meta?.description || `Complete the "${data.title}" intake form.`,
  };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const meta = await getIntakeMeta(slug);

  if (!meta) {
    return { title: "Intake Not Found" };
  }

  const title = meta.title;
  const description = meta.description;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      siteName: "Intake Studio",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default function PublishedIntakePage() {
  return (
    <Suspense
      fallback={
        <div className="h-screen flex items-center justify-center bg-zinc-50 dark:bg-black">
          <div className="animate-pulse text-zinc-400">Loading...</div>
        </div>
      }
    >
      <IntakeViewer />
    </Suspense>
  );
}
