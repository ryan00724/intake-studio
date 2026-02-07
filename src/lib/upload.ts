/**
 * Upload a file to Supabase Storage via the /api/upload endpoint.
 * Returns the public URL of the uploaded file.
 */
export async function uploadFile(
  file: File,
  folder?: string
): Promise<{ url: string; name: string; size: number; type: string }> {
  const form = new FormData();
  form.append("file", file);
  if (folder) form.append("folder", folder);

  const res = await fetch("/api/upload", { method: "POST", body: form });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Upload failed" }));
    throw new Error(err.error || "Upload failed");
  }

  return res.json();
}
