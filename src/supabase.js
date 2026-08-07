import { createClient } from '@supabase/supabase-js'

// TODO: Substituír polos valores reais do proxecto Supabase
// Encóntranse en: Supabase Dashboard → Project Settings → API
const SUPABASE_URL = 'https://ofupwqrzbtzykvnyocue.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9mdXB3cXJ6YnR6eWt2bnlvY3VlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYwNzIxNjUsImV4cCI6MjEwMTY0ODE2NX0.6xoNzNE1THIBMeEempQGKIyuqaU6zsDa7F_a4glb_bg'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
