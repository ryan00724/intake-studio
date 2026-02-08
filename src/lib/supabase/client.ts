import { createBrowserClient } from '@supabase/ssr'

// Client-side Supabase client (Singleton)
// Uses @supabase/ssr to store session in cookies (accessible server-side)

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (typeof window !== 'undefined' && (!supabaseUrl || !supabaseAnonKey)) {
  console.error(
    '[Supabase] NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY is missing.\n' +
    'These must be set as environment variables BEFORE building.\n' +
    'If deploying to Vercel, add them in Settings → Environment Variables, then redeploy.'
  )
}

export const supabase = createBrowserClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key'
)
