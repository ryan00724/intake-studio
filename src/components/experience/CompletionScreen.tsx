import React from "react";
import { motion } from "framer-motion";
import { personalizeText, PersonalizationParams } from "@/src/lib/experience/personalize";

interface CompletionScreenProps {
  closingMessage?: string;
  nextSteps?: string;
  buttonLabel?: string;
  buttonUrl?: string;
  personalization?: PersonalizationParams;
}

export function CompletionScreen({
  closingMessage = "Thank you for completing this intake.",
  nextSteps = "We will review your submission and get back to you within 24 hours.",
  buttonLabel,
  buttonUrl,
  personalization,
}: CompletionScreenProps) {
  const personalizedMessage = personalizeText(closingMessage, personalization);
  const personalizedNextSteps = personalizeText(nextSteps, personalization);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8 space-y-6 max-w-2xl mx-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col items-center gap-6"
      >
        <div className="preserve-color w-16 h-16 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center text-3xl shadow-sm">
          ✓
        </div>
        
        <div className="space-y-4">
          <div className="space-y-2">
             <h2 className="text-3xl font-bold">All Set!</h2>
             <p className="text-lg opacity-70 whitespace-pre-wrap leading-relaxed">
               {personalizedMessage}
             </p>
          </div>

          <div className="pt-4 border-t border-current/10 space-y-2">
             <h3 className="text-sm font-semibold uppercase tracking-wider opacity-60">What happens next</h3>
             <p className="opacity-70 max-w-md mx-auto">
                {personalizedNextSteps}
             </p>
          </div>

          {buttonLabel && buttonUrl && (
             <div className="pt-4">
                <a 
                   href={buttonUrl}
                   target="_blank"
                   rel="noopener noreferrer"
                   className="preserve-color inline-flex items-center gap-2 px-6 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200 rounded-full font-medium transition-all duration-200 ease-in-out transform-gpu will-change-transform shadow-sm hover:shadow-md hover:scale-105 active:scale-95"
                >
                   {buttonLabel}
                   <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                </a>
             </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
