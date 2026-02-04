"use client";

import { useEditor } from "@/hooks/use-editor";
import { IntakeSection, IntakeBlock } from "@/types/editor";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { generateSchema } from "@/lib/validation";
import { useMemo } from "react";

export function FormPreview() {
  const { sections } = useEditor();
  
  const schema = useMemo(() => generateSchema(sections), [sections]);
  
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
    <div className="min-h-screen bg-zinc-50 dark:bg-black py-12 px-4 sm:px-6 lg:px-8 flex justify-center">
      <div className="w-full max-w-3xl space-y-8">
        <h1 className="text-2xl font-bold text-center text-zinc-900 dark:text-zinc-100">Intake Preview</h1>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          {sections.map((section) => (
            <div key={section.id} className="bg-white dark:bg-zinc-900 shadow rounded-lg p-8 border border-zinc-200 dark:border-zinc-800">
                 <div className="mb-6 border-b border-zinc-100 dark:border-zinc-800 pb-4">
                    <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">{section.title}</h2>
                    {section.description && <p className="text-zinc-500 mt-1">{section.description}</p>}
                 </div>

                 <div className="space-y-6">
                    {section.blocks.map((block) => (
                        <PreviewBlock 
                            key={block.id} 
                            block={block} 
                            register={register} 
                            error={errors[block.id]?.message as string} 
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

function PreviewBlock({ 
    block, 
    register, 
    error 
}: { 
    block: IntakeBlock; 
    register: any; 
    error?: string 
}) {
  if (block.type === "context") {
      return (
          <div className="prose prose-sm dark:prose-invert max-w-none text-zinc-600 dark:text-zinc-400">
              <p>{block.text}</p>
          </div>
      );
  }

  // Non-question blocks (visual tools)
  if (block.type === "image_choice") {
      return (
          <div className="space-y-1">
              <div className="flex justify-between">
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                      {block.label} {block.required && <span className="text-red-500">*</span>}
                  </label>
              </div>

              {block.helperText && <p className="text-xs text-zinc-500 mb-2">{block.helperText}</p>}

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {block.options.map((opt) => (
                      <label key={opt.id} className="cursor-pointer relative group block">
                          <input
                              type={block.multi ? "checkbox" : "radio"}
                              value={opt.id}
                              {...register(block.id)}
                              className="peer sr-only"
                          />
                          <div className="rounded-xl border-2 border-zinc-200 dark:border-zinc-700 overflow-hidden transition-all duration-200 peer-checked:border-indigo-600 peer-checked:ring-2 peer-checked:ring-indigo-600/20 group-hover:border-zinc-300 dark:group-hover:border-zinc-600 bg-white dark:bg-zinc-800 shadow-sm peer-checked:shadow-md">
                              <div className="aspect-square relative bg-zinc-100 dark:bg-zinc-900">
                                  {opt.imageUrl ? (
                                      <img src={opt.imageUrl} className="w-full h-full object-cover" alt={opt.label || "Option"} />
                                  ) : (
                                      <div className="w-full h-full flex items-center justify-center text-zinc-400 text-xs">No Image</div>
                                  )}
                              </div>
                              {opt.label && (
                                  <div className="p-3 text-sm text-center font-medium border-t border-zinc-100 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300">
                                      {opt.label}
                                  </div>
                              )}
                          </div>
                      </label>
                  ))}
              </div>

              {error && <p className="text-sm text-red-600">{error}</p>}
          </div>
      );
  }

  if (block.type === "image_moodboard" || block.type === "this_not_this") {
      return (
          <div className="space-y-1">
              <div className="flex justify-between">
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                      {block.label}
                  </label>
              </div>

              {block.helperText && <p className="text-xs text-zinc-500 mb-2">{block.helperText}</p>}

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {block.items.map((item) => (
                      <div
                          key={item.id}
                          className="rounded-xl border border-zinc-200 dark:border-zinc-700 overflow-hidden bg-white dark:bg-zinc-800 shadow-sm"
                      >
                          <div className="aspect-square relative bg-zinc-100 dark:bg-zinc-900">
                              <img src={item.imageUrl} className="w-full h-full object-cover" alt={item.caption || "Image"} />
                          </div>
                          {item.caption && (
                              <div className="p-2 text-xs text-center border-t border-zinc-100 dark:border-zinc-700 text-zinc-500">
                                  {item.caption}
                              </div>
                          )}
                      </div>
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
            {block.type === "question" ? block.label : ""} {block.type === "question" && block.required && <span className="text-red-500">*</span>}
          </label>
      </div>
      
      {block.type === "question" && block.helperText && <p className="text-xs text-zinc-500 mb-2">{block.helperText}</p>}

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
             return <div className="text-sm text-zinc-500 border p-2 rounded">Multi-select preview not fully implemented (requires Checkbox group logic)</div>;
        default:
             return <input type="text" {...register(block.id)} className={commonClasses} />;
    }
}
