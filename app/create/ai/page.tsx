"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/src/components/ui/Button";
import { Textarea } from "@/src/components/ui/Textarea";
import { Select } from "@/src/components/ui/Select";
import { Card } from "@/src/components/ui/Card";
import { motion } from "framer-motion";
import Link from "next/link";

export default function AICreationPage() {
  const router = useRouter();
  const [description, setDescription] = useState("");
  const [type, setType] = useState("Discovery");
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!description.trim()) return;

    setIsGenerating(true);
    setError(null);

    try {
      // 1. Generate intake content via AI
      const genRes = await fetch("/api/generate-intake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description, type }),
      });

      if (!genRes.ok) {
        const errorData = await genRes.json();
        throw new Error(errorData.error || "Failed to generate intake");
      }

      const data = await genRes.json();

      // 2. Get or create a workspace via server API
      let workspaceId: string | null = null;
      const wsRes = await fetch("/api/workspaces");
      const wsData = wsRes.ok ? await wsRes.json() : null;

      if (wsData?.id) {
        workspaceId = wsData.id;
      } else {
        const createWsRes = await fetch("/api/workspaces", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: "My Workspace" }),
        });
        if (!createWsRes.ok) throw new Error("Could not create workspace");
        const newWs = await createWsRes.json();
        workspaceId = newWs.id;
      }

      // 3. Create intake in DB
      const title = data.metadata?.title || "AI Generated Intake";
      const createRes = await fetch("/api/intakes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          workspace_id: workspaceId,
        }),
      });

      if (!createRes.ok) throw new Error("Failed to create intake");
      const newIntake = await createRes.json();

      // 4. Save generated content as draft
      await fetch(`/api/intakes/${newIntake.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          draft_json: {
            sections: data.sections,
            metadata: data.metadata,
            edges: [],
          },
          title,
        }),
      });

      // 5. Redirect to editor
      router.push(`/e/${newIntake.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred");
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl"
      >
        <div className="mb-8 text-center space-y-2">
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">
            Generate Intake with AI
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400">
            Describe your needs and let AI build a starting template for you.
          </p>
        </div>

        <Card className="p-8 space-y-8 bg-white dark:bg-zinc-900 shadow-xl border-zinc-200/50 dark:border-zinc-800/50">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-900 dark:text-zinc-200">
                Describe your business & goals
              </label>
              <Textarea
                placeholder="E.g. I run a digital marketing agency. I need to onboard new clients, understand their budget, current social media presence, and design preferences..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="min-h-[150px] text-base resize-none"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-900 dark:text-zinc-200">
                Intake Type (Optional)
              </label>
              <Select
                value={type}
                onChange={setType}
                options={[
                  { value: "Discovery", label: "Discovery Call" },
                  { value: "Onboarding", label: "Client Onboarding" },
                  { value: "Project Brief", label: "Project Brief" },
                  { value: "Feedback", label: "Feedback Survey" },
                ]}
              />
            </div>
          </div>

          {error && (
            <div className="space-y-3">
                <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-lg border border-red-200 dark:border-red-900/50">
                    <p className="font-medium">Generation Failed</p>
                    <p className="opacity-90">{error}</p>
                </div>
            </div>
          )}

          <div className="flex items-center gap-4">
            <Button
              className="w-full h-12 text-base"
              onClick={handleGenerate}
              disabled={isGenerating || !description.trim()}
            >
              {isGenerating ? (
                <div className="flex items-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Generating...
                </div>
              ) : (
                error ? "Try Again" : "Generate Intake"
              )}
            </Button>
          </div>
        </Card>
        
        <div className="mt-6 text-center">
            <Link 
                href="/dashboard"
                className="text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300 transition-colors"
            >
                Back to Dashboard
            </Link>
        </div>
      </motion.div>
    </div>
  );
}
