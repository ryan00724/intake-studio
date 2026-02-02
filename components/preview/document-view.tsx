"use client";

import { EditorContext } from "@/hooks/use-editor";
import { IntakeSection, IntakeBlock, IntakeMetadata } from "@/types/editor";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { generateSchema } from "@/lib/validation";
import { useMemo, useEffect, useContext } from "react";
import { useSearchParams } from "next/navigation";
import { replacePlaceholders } from "@/lib/personalization";

export function DocumentView({ 
    sections: propSections, 
    metadata: propMetadata,
    readOnly = false 
}: { 
    sections?: IntakeSection[];
    metadata?: IntakeMetadata;
    readOnly?: boolean;
}) {
  // If no props provided, fallback to context (Editor Preview mode)
  const context = useContext(EditorContext);
  const activeSections = propSections || context?.sections || [];
  const metadata = propMetadata || context?.metadata || { title: "Intake", mode: "document" };

  const searchParams = useSearchParams();
  const clientName = searchParams?.get("client");
  const companyName = searchParams?.get("company");
  const projectName = searchParams?.get("project");

  const personalization = { 
      client: clientName, 
      company: companyName, 
      project: projectName 
  };
  
  const schema = useMemo(() => generateSchema(activeSections), [activeSections]);
  
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
  });

  const onSubmit = (data: any) => {
    console.log("Form Data:", data);
    alert(JSON.stringify(data, null, 2));
  };

  return (
    <div className="h-full overflow-y-auto py-12 px-4 sm:px-6 lg:px-8 flex justify-center">
      <div className="w-full max-w-3xl space-y-8 pb-32">
        {(clientName || companyName || projectName) && (
            <div className="text-center mb-8 p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg text-indigo-700 dark:text-indigo-300">
                Prepared for {clientName ? <strong>{clientName}</strong> : "you"} 
                {companyName && <> at <strong>{companyName}</strong></>}
                {projectName && <> — <strong>{projectName}</strong></>}
            </div>
        )}

        <div className="text-center space-y-2">
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                {replacePlaceholders(metadata.title, personalization) || "Intake"}
            </h1>
            {metadata.description && (
                <p className="text-zinc-500 max-w-xl mx-auto whitespace-pre-wrap">
                    {replacePlaceholders(metadata.description, personalization)}
                </p>
            )}
        </div>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          {activeSections.map((section) => (
            <div key={section.id} className="bg-white dark:bg-zinc-900 shadow rounded-lg p-8 border border-zinc-200 dark:border-zinc-800">
                 <div className="mb-6 border-b border-zinc-100 dark:border-zinc-800 pb-4">
                    <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
                        {replacePlaceholders(section.title, personalization)}
                    </h2>
                    {section.description && (
                        <p className="text-zinc-500 mt-1">
                            {replacePlaceholders(section.description, personalization)}
                        </p>
                    )}
                 </div>

                 <div className="space-y-6">
                    {section.blocks.map((block) => (
                        <PreviewBlock 
                            key={block.id} 
                            block={block} 
                            register={register} 
                            error={errors[block.id]?.message as string} 
                            personalization={personalization}
                        />
                    ))}
                    {section.blocks.length === 0 && (
                        <p className="text-sm text-zinc-400 italic">No questions in this section.</p>
                    )}
                 </div>
            </div>
          ))}
          
          <div className="pt-4">
            <button
              type="submit"
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Submit Intake
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Re-usable block renderer for preview
export function PreviewBlock({ 
    block, 
    register, 
    error,
    personalization = {}
}: { 
    block: IntakeBlock; 
    register: any; 
    error?: string;
    personalization?: { client?: string | null, company?: string | null, project?: string | null }
}) {
  if (block.type === "context") {
      return (
          <div className="prose prose-sm dark:prose-invert max-w-none text-zinc-600 dark:text-zinc-400 break-words">
              <p>{replacePlaceholders(block.text, personalization)}</p>
          </div>
      );
  }

  if (block.type === "image_choice") {
      return (
        <div className="space-y-3">
            <div className="flex justify-between">
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    {replacePlaceholders(block.label, personalization)} {block.required && <span className="text-red-500">*</span>}
                </label>
            </div>
            
            {block.helperText && (
                <p className="text-xs text-zinc-500 mb-2">
                    {replacePlaceholders(block.helperText, personalization)}
                </p>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                 {block.options.map(opt => (
                     <label key={opt.id} className="cursor-pointer relative group block">
                        <input 
                            type={block.multi ? "checkbox" : "radio"} 
                            value={opt.id} 
                            {...register(block.id)} 
                            className="peer sr-only" 
                        />
                        <div className="rounded-xl border-2 border-zinc-200 dark:border-zinc-700 overflow-hidden transition-all duration-200 peer-checked:border-indigo-600 peer-checked:ring-2 peer-checked:ring-indigo-600/20 group-hover:border-zinc-300 dark:group-hover:border-zinc-600 group-hover:shadow-lg group-hover:-translate-y-1 bg-white dark:bg-zinc-800 shadow-sm peer-checked:shadow-md peer-checked:-translate-y-1">
                             <div className="aspect-square relative bg-zinc-100 dark:bg-zinc-900">
                                {opt.imageUrl ? (
                                    <img src={opt.imageUrl} className="w-full h-full object-cover" alt={opt.label} />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-zinc-400 text-xs">No Image</div>
                                )}
                             </div>
                             {opt.label && <div className="p-3 text-sm text-center font-medium border-t border-zinc-100 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300">{opt.label}</div>}
                        </div>
                        <div className="absolute top-2 right-2 opacity-0 peer-checked:opacity-100 transition-opacity">
                            <div className="w-6 h-6 bg-indigo-600 rounded-full flex items-center justify-center text-white shadow-md">
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                            </div>
                        </div>
                     </label>
                 ))}
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
        </div>
      );
  }

  // Question Block
  return (
    <div className="space-y-1">
      <div className="flex justify-between">
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            {replacePlaceholders(block.label, personalization)} {block.required && <span className="text-red-500">*</span>}
          </label>
      </div>
      
      {block.helperText && (
        <p className="text-xs text-zinc-500 mb-2">
            {replacePlaceholders(block.helperText, personalization)}
        </p>
      )}

      {renderInput(block, register)}
      
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}

function renderInput(block: IntakeBlock, register: any) {
    if (block.type !== "question") return null;

    const commonClasses = "block w-full rounded-md border-0 py-1.5 text-zinc-900 shadow-sm ring-1 ring-inset ring-zinc-300 placeholder:text-zinc-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 dark:bg-zinc-800 dark:ring-zinc-700 dark:text-white";

    switch (block.inputType) {
        case "short":
            return <input type="text" {...register(block.id)} className={commonClasses} />;
        case "long":
             return <textarea rows={4} {...register(block.id)} className={commonClasses} />;
        case "select":
             return (
                 <select {...register(block.id)} className={commonClasses}>
                     <option value="">Select...</option>
                     <option value="option1">Option 1</option>
                     <option value="option2">Option 2</option>
                 </select>
             );
        case "date":
             return <input type="date" {...register(block.id)} className={commonClasses} />;
        case "file":
             return <input type="file" {...register(block.id)} className={commonClasses} />;
        case "multi":
             return <div className="text-sm text-zinc-500 border p-2 rounded">Multi-select preview not fully implemented</div>;
        default:
             return <input type="text" {...register(block.id)} className={commonClasses} />;
    }
}
