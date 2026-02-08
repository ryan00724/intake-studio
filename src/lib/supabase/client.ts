import { createBrowserClient } from '@supabase/ssr'

// Client-side Supabase client (Singleton)
// Uses @supabase/ssr to store session in cookies (accessible server-side)
// Fallback to placeholder values during build/prerender to avoid crashing
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  if (typeof window !== 'undefined') {
    console.warn("Supabase env vars missing. Client will not function correctly.")
  }
}

export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey)
