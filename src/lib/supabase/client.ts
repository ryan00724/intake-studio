import { createClient } from '@supabase/supabase-js'

// Client-side Supabase client (Singleton)
// Safe to use in components and client-side logic
// Fallback to placeholder values during build/prerender to avoid crashing
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  if (typeof window !== 'undefined') {
    console.warn("Supabase env vars missing. Client will not function correctly.")
  }
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
