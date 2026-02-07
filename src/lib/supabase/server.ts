import { createClient } from '@supabase/supabase-js'

// Server-side Supabase client with Service Role (Admin)
// ONLY use this in API routes or Server Actions. NEVER expose to client.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.warn("Supabase server env vars missing.")
}

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})
