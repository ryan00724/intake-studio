import { createClient } from '@supabase/supabase-js'

// Server-side Supabase client with Service Role (Admin)
// ONLY use this in API routes or Server Actions. NEVER expose to client.

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  // Only warn at runtime (not during build/prerender)
  if (typeof globalThis !== 'undefined' && 'process' in globalThis) {
    console.error(
      '[Supabase Server] Missing environment variables:\n' +
      (!supabaseUrl ? '  - NEXT_PUBLIC_SUPABASE_URL\n' : '') +
      (!supabaseServiceKey ? '  - SUPABASE_SERVICE_ROLE_KEY\n' : '') +
      'Add these to your hosting platform and redeploy.'
    )
  }
}

export const supabaseAdmin = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseServiceKey || 'placeholder-key',
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)
