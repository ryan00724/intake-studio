import { createClient } from '@supabase/supabase-js'

// Client-side Supabase client (Singleton)
// Safe to use in components and client-side logic
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("Supabase env vars missing. Client will not function correctly.")
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
