import { auth } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'

// Créer un client Supabase côté serveur qui utilise le token Clerk
export function createServerSupabaseClient() {
  // Pendant la phase de développement/migration, on utilise simplement le client anonyme
  // pour éviter les problèmes d'authentification avec Clerk
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
} 