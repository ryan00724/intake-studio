import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Create a Supabase client for server-side auth verification.
 * Reads the user session from cookies set by @supabase/ssr on the client.
 */
export async function createSupabaseAuthClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // In read-only contexts (e.g. Server Components), setting cookies
            // will throw. This is expected — the middleware handles token refresh.
          }
        },
      },
    }
  );
}

/**
 * Get the authenticated user from the request cookies.
 * Returns null if not authenticated.
 */
export async function getUser() {
  const supabase = await createSupabaseAuthClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

/**
 * Get the authenticated user or throw a 401.
 * Use this in API routes for a quick guard.
 */
export async function requireUser() {
  const user = await getUser();
  if (!user) {
    throw new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }
  return user;
}
