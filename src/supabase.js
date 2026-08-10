import { createClient } from '@supabase/supabase-js'

// As credenciais viven en variables de contorno (.env.local en local,
// Environment Variables en Vercel). Así este ficheiro NUNCA se sobrescribe
// ao substituír código — as credenciais quedan sempre a salvo dos cambios.
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error(
    '[supabase] Faltan as variables de contorno VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY. ' +
    'Crea un ficheiro .env.local (mira .env.example) e configúraas tamén en Vercel → Settings → Environment Variables.'
  )
}

export const supabase = createClient(
  SUPABASE_URL || 'https://placeholder.supabase.co',
  SUPABASE_ANON_KEY || 'placeholder',
  {
    realtime: {
      params: { eventsPerSecond: 10 },
    },
  }
)

export const supabaseConfigured = !!(SUPABASE_URL && SUPABASE_ANON_KEY)
