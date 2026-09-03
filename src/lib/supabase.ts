import { createClient } from '@supabase/supabase-js'

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL?.trim() || 'https://lqpfhkcjxdgyqxljcrs.supabase.co')
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim()

const hasValidSupabaseConfig = Boolean(
  supabaseUrl &&
  /^https?:\/\//.test(supabaseUrl) &&
  supabaseAnonKey,
)

export const supabase = hasValidSupabaseConfig
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null
