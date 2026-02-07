import React from "react";
import { motion } from "framer-motion";
import { personalizeText, PersonalizationParams } from "@/src/lib/experience/personalize";

interface WelcomeScreenProps {
  title?: string;
  intro?: string;
  estimatedTime?: string;
  personalization?: PersonalizationParams;
  onStart: () => void;
}

export function WelcomeScreen({
  title = "Welcome",
  intro = "Please complete the following steps.",
  estimatedTime = "3–5 minutes",
  personalization,
  onStart,
}: WelcomeScreenProps) {
  const personalizedTitle = personalizeText(title, personalization);
  const personalizedIntro = personalizeText(intro, personalization);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8 space-y-8 max-w-2xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="space-y-4"
      >
        <h1 className="text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          {personalizedTitle}
        </h1>
        <p className="text-lg text-zinc-600 dark:text-zinc-400 whitespace-pre-wrap leading-relaxed">
          {personalizedIntro}
        </p>
        
        <div className="flex flex-col items-center gap-2 pt-2">
           <div className="inline-flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800/50 px-3 py-1 rounded-full">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              <span>Takes about {estimatedTime}</span>
           </div>
           <p className="text-xs text-zinc-400 dark:text-zinc-500">
             You can save and come back anytime
           </p>
        </div>
      </motion.div>

      <motion.button
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2, duration: 0.4 }}
        onClick={onStart}
        className="px-8 py-3 bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200 rounded-full font-medium transition-all duration-200 ease-in-out transform-gpu will-change-transform shadow-sm hover:shadow-md hover:scale-105 active:scale-95"
      >
        Start
      </motion.button>
    </div>
  );
}
