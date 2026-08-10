import { createClient } from '@supabase/supabase-js'

// Substituír polos valores reais do proxecto Supabase
// Encóntranse en: Supabase Dashboard → Project Settings → API
const SUPABASE_URL = 'https://XXXXXXXXXX.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.XXXXXXXXXX'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  realtime: {
    params: { eventsPerSecond: 10 },
  },
})
