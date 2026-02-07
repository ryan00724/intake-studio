"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { PublishedIntake } from "@/types/editor";
import { GuidedExperience } from "@/src/components/experience/GuidedExperience";
import { PersonalizationParams } from "@/src/lib/experience/personalize";
import { loadPublishedFromIdb, PublishedPointer } from "@/lib/published-storage";

export default function PublishedIntakePage() {
  const params = useParams();
  const slug = params?.slug as string;
  const searchParams = useSearchParams();

  const [intake, setIntake] = useState<PublishedIntake | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      if (!slug) return;

      // 1. Try fetching from DB API first
      try {
        const res = await fetch(`/api/public/intakes/${slug}`);
        if (res.ok) {
          const data = await res.json();
          if (data.published_json && isMounted) {
            // Normalize DB response into the PublishedIntake shape
            const published: PublishedIntake = {
              slug,
              sections: data.published_json.sections || [],
              edges: data.published_json.edges || [],
              metadata: data.published_json.metadata || { title: data.title },
              publishedAt: Date.now(),
            };
            setIntake(published);
            return; // Found in DB, done
          }
        }
      } catch (err) {
        console.warn("DB fetch failed, falling back to localStorage", err);
      }

      // 2. Fallback to localStorage / IndexedDB
      const key = `intake:published:${slug}`;
      const fallbackKey = `published_intake_${slug}`;
      const localData = localStorage.getItem(key) || localStorage.getItem(fallbackKey);
      if (localData) {
        try {
          const parsed = JSON.parse(localData);
          if (parsed && typeof parsed === "object" && (parsed as PublishedPointer).__storage === "idb") {
            const idbData = await loadPublishedFromIdb((parsed as PublishedPointer).key);
            if (idbData && isMounted) setIntake(idbData);
          } else {
            if (isMounted) setIntake(parsed);
          }
        } catch (e) {
          console.error("Failed to load published intake from localStorage", e);
        }
      }
    };

    load().finally(() => {
      if (isMounted) setLoading(false);
    });

    return () => {
      isMounted = false;
    };
  }, [slug]);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-zinc-50 dark:bg-black">
        <div className="animate-pulse text-zinc-400">Loading...</div>
      </div>
    );
  }

  if (!intake) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-zinc-50 dark:bg-black space-y-4 px-6 text-center">
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">Intake Not Found</h1>
        <p className="text-zinc-500 max-w-md">The intake you are looking for does not exist or has been removed.</p>
      </div>
    );
  }

  const personalization: PersonalizationParams = {
      client: searchParams?.get("client") || undefined,
      company: searchParams?.get("company") || undefined,
      project: searchParams?.get("project") || undefined
  };

  const isDark = intake.metadata.colorMode === "dark";

  return (
    <div className={`min-h-screen font-sans ${isDark ? 'dark bg-black text-zinc-100' : 'bg-zinc-50 text-zinc-900'}`}>
       <GuidedExperience 
          sections={intake.sections}
          edges={(intake as any).edges}
          slug={intake.metadata?.slug || slug}
          title={intake.metadata.title}
          intro={intake.metadata.description}
          estimatedTime={intake.metadata.estimatedTime}
          closingMessage={intake.metadata.completionText}
          completionNextSteps={intake.metadata.completionNextSteps}
          completionButtonLabel={intake.metadata.completionButtonLabel}
          completionButtonUrl={intake.metadata.completionButtonUrl}
          personalization={personalization}
          theme={intake.metadata.theme}
       />
    </div>
  );
}
