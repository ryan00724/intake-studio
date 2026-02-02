export function replacePlaceholders(text: string | undefined, params: { client?: string | null, company?: string | null, project?: string | null }): string {
  if (!text) return "";
  
  let result = text;
  
  // Client
  const clientVal = params.client || "Client";
  result = result.replace(/{client}/g, clientVal);
  result = result.replace(/{client_name}/g, clientVal);

  // Company
  const companyVal = params.company || "Company";
  result = result.replace(/{company}/g, companyVal);
  result = result.replace(/{company_name}/g, companyVal);

  // Project
  const projectVal = params.project || "Project";
  result = result.replace(/{project}/g, projectVal);
  result = result.replace(/{project_name}/g, projectVal);

  return result;
}
