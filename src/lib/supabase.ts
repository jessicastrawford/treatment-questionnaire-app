// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://zuampunippizdtbruosx.supabase.co'
const supabaseAnonKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp1YW1wdW5pcHBpemR0YnJ1b3N4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgxOTg5NzcsImV4cCI6MjA3Mzc3NDk3N30.IOFSd0kwHQE_DIPoufxkMEUHf0rNDlqi6DH8FOljGyw'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
