export interface PersonalizationParams {
  client_name?: string;
  company_name?: string;
  project_name?: string;
  // Fallback support for older token names
  client?: string;
  company?: string;
  project?: string;
}

export function personalizeText(
  text: string | undefined,
  params: PersonalizationParams = {}
): string {
  if (!text) return "";

  let result = text;

  // Resolve values with fallbacks
  const client = params.client_name || params.client || "";
  const company = params.company_name || params.company || "";
  const project = params.project_name || params.project || "";

  // Replace tokens
  // We handle both {client_name} and {client} style for compatibility
  result = result.replace(/{client_name}/gi, client);
  result = result.replace(/{client}/gi, client);
  
  result = result.replace(/{company_name}/gi, company);
  result = result.replace(/{company}/gi, company);
  
  result = result.replace(/{project_name}/gi, project);
  result = result.replace(/{project}/gi, project);

  // Clean up double spaces that might result from empty replacements
  // Also trim leading/trailing spaces
  return result.replace(/\s+/g, " ").trim();
}
