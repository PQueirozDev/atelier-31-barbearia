import { createClient } from '@supabase/supabase-js'

const configuredUrl = import.meta.env.VITE_SUPABASE_URL?.trim().replace(/^['"]|['"]$/g, '')
const configuredKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim().replace(/^['"]|['"]$/g, '')
const supabaseUrl = configuredUrl && /^https:\/\/[^\s]+\.supabase\.co\/?$/.test(configuredUrl) ? configuredUrl : ''
const supabaseAnonKey = configuredKey?.startsWith('sb_publishable_') ? configuredKey : ''

const hasValidSupabaseConfig = Boolean(
  supabaseUrl &&
  /^https?:\/\//.test(supabaseUrl) &&
  supabaseAnonKey,
)

export const supabase = hasValidSupabaseConfig
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null
