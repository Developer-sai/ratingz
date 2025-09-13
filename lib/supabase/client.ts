import { createBrowserClient } from "@supabase/ssr"

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Supabase URL and/or API key not configured. Please check your environment variables.')
    // Return a mock client that won't cause crashes
    return {
      from: () => ({
        select: () => ({ data: [], error: null }),
        insert: () => ({ data: null, error: { message: 'Supabase not configured' } }),
        update: () => ({ data: null, error: { message: 'Supabase not configured' } }),
        delete: () => ({ data: null, error: { message: 'Supabase not configured' } }),
        eq: () => ({ data: [], error: null }),
        single: () => ({ data: null, error: { message: 'Supabase not configured' } }),
        order: () => ({ data: [], error: null })
      })
    } as any
  }
  
  return createBrowserClient(supabaseUrl, supabaseAnonKey)
}
