import React from "react";
import { motion } from "framer-motion";
import { personalizeText, PersonalizationParams } from "@/src/lib/experience/personalize";

interface SectionIntroProps {
  title: string;
  description?: string;
  onContinue: () => void;
  personalization?: PersonalizationParams;
}

export function SectionIntro({
  title,
  description,
  onContinue,
  personalization,
}: SectionIntroProps) {
  const personalizedTitle = personalizeText(title, personalization);
  const personalizedDesc = personalizeText(description, personalization);

  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] text-center p-8 space-y-8 max-w-2xl mx-auto w-full">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 1.05 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="space-y-4 w-full"
      >
        <span className="text-xs font-semibold uppercase tracking-widest opacity-50">Section Intro</span>
        <h2 className="text-3xl font-semibold tracking-tight">
          {personalizedTitle}
        </h2>
        {description && (
            <p className="text-lg opacity-70 whitespace-pre-wrap leading-relaxed max-w-lg mx-auto">
            {personalizedDesc}
            </p>
        )}
      </motion.div>

      <motion.button
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.4 }}
        onClick={onContinue}
        className="preserve-color px-8 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200 rounded-full font-medium transition-all duration-200 ease-in-out shadow-sm hover:shadow-md hover:scale-105 active:scale-95"
      >
        Continue
      </motion.button>
    </div>
  );
}
