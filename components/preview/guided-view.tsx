"use client";

import { EditorContext } from "@/hooks/use-editor";
import { useState, useContext } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { generateSchema } from "@/lib/validation";
import { motion, AnimatePresence } from "framer-motion";
import { PreviewBlock } from "./document-view";
import { IntakeSection, IntakeMetadata } from "@/types/editor";
import { useSearchParams } from "next/navigation";
import { replacePlaceholders } from "@/lib/personalization";

export function GuidedView({ 
    sections: propSections,
    metadata: propMetadata
}: { 
    sections?: IntakeSection[];
    metadata?: IntakeMetadata;
}) {
  const context = useContext(EditorContext);
  const sections = propSections || context?.sections || [];
  const metadata = propMetadata || context?.metadata || { title: "Intake", mode: "guided" };

  const [currentStep, setCurrentStep] = useState<number>(-1); // -1 is Welcome Screen
  
  const searchParams = useSearchParams();
  const clientName = searchParams?.get("client");
  const companyName = searchParams?.get("company");
  const projectName = searchParams?.get("project");

  const personalization = { 
      client: clientName, 
      company: companyName, 
      project: projectName 
  };

  const fullSchema = generateSchema(sections);
  
  const {
    register,
    handleSubmit,
    trigger,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(fullSchema),
    mode: "onChange"
  });

  const totalSteps = sections.length;
  const isWelcome = currentStep === -1;
  const isComplete = currentStep === totalSteps;

  const currentSection = sections[currentStep];

  const handleNext = async () => {
    if (isWelcome) {
        setCurrentStep(0);
        return;
    }

    const currentFieldIds = currentSection.blocks.map(b => b.id);
    const isValid = await trigger(currentFieldIds);

    if (isValid) {
        setCurrentStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    setCurrentStep(prev => prev - 1);
  };

  const onSubmit = (data: any) => {
    console.log("Guided Form Data:", data);
    // In real app, this would submit to API
    setCurrentStep(totalSteps);
  };

  if (!sections || sections.length === 0) {
      return <div className="h-full flex items-center justify-center">No sections found.</div>;
  }

  return (
    <div className="h-full flex flex-col items-center justify-center p-6 bg-zinc-50 dark:bg-black overflow-hidden">
      <div className="w-full max-w-2xl">
        <AnimatePresence mode="wait">
            
            {/* WELCOME SCREEN */}
            {isWelcome && (
                <motion.div
                    key="welcome"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="text-center space-y-8"
                >
                    <div className="space-y-4">
                        {(clientName || companyName || projectName) && (
                            <div className="inline-block px-3 py-1 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 text-sm font-medium mb-2">
                                For {clientName || "you"} {companyName && `at ${companyName}`} {projectName && `— ${projectName}`}
                            </div>
                        )}
                        <h1 className="text-4xl font-bold text-zinc-900 dark:text-zinc-100">
                            {replacePlaceholders(metadata.title, personalization) || "Welcome"}
                        </h1>
                        <p className="text-xl text-zinc-600 dark:text-zinc-400 max-w-lg mx-auto whitespace-pre-wrap">
                            {replacePlaceholders(metadata.description, personalization) || "Please complete the following steps to submit your information."}
                        </p>
                    </div>
                    <button
                        onClick={handleNext}
                        className="px-8 py-3 bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 rounded-full font-medium text-lg hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors shadow-lg"
                    >
                        Start Intake
                    </button>
                </motion.div>
            )}

            {/* SECTIONS */}
            {!isWelcome && !isComplete && currentSection && (
                <motion.div
                    key={`step-${currentSection.id}`}
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -50 }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    className="bg-white dark:bg-zinc-900 shadow-xl rounded-2xl p-8 border border-zinc-200 dark:border-zinc-800 w-full"
                >
                    <div className="mb-8">
                         <span className="text-xs font-semibold uppercase tracking-wider text-indigo-500">
                             Step {currentStep + 1} of {totalSteps}
                         </span>
                         <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mt-2">
                             {replacePlaceholders(currentSection.title, personalization)}
                         </h2>
                         {currentSection.description && (
                             <p className="text-zinc-500 mt-2">
                                {replacePlaceholders(currentSection.description, personalization)}
                             </p>
                         )}
                    </div>

                    <div className="space-y-8">
                        {currentSection.blocks.map(block => (
                             <PreviewBlock 
                                key={block.id} 
                                block={block} 
                                register={register} 
                                error={errors[block.id]?.message as string}
                                personalization={personalization} 
                            />
                        ))}
                    </div>

                    <div className="flex justify-between items-center mt-12 pt-6 border-t border-zinc-100 dark:border-zinc-800">
                        <button
                            onClick={handleBack}
                            className="text-sm font-medium text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300 px-4 py-2"
                        >
                            Back
                        </button>
                        <button
                            onClick={currentStep === totalSteps - 1 ? handleSubmit(onSubmit) : handleNext}
                            className="bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 px-6 py-2 rounded-lg font-medium hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors"
                        >
                            {currentStep === totalSteps - 1 ? "Complete" : "Continue"}
                        </button>
                    </div>
                </motion.div>
            )}

            {/* COMPLETION SCREEN */}
            {isComplete && (
                 <motion.div
                    key="complete"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center space-y-6"
                >
                    <div className="h-20 w-20 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center mx-auto text-3xl">
                        ✓
                    </div>
                    <h2 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">All Done!</h2>
                    <p className="text-zinc-600 dark:text-zinc-400 whitespace-pre-wrap max-w-lg mx-auto">
                        {replacePlaceholders(metadata.completionText, personalization) || "Thank you for completing the intake."}
                    </p>
                </motion.div>
            )}

        </AnimatePresence>
      </div>
    </div>
  );
}
