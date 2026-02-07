import { createClient } from '@supabase/supabase-js'

// Server-side Supabase client with Service Role (Admin)
// ONLY use this in API routes or Server Actions. NEVER expose to client.
// Fallback to placeholder values during build/prerender to avoid crashing
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder-key'

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})
