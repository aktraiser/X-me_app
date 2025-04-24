import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { useAuth, useSession } from '@clerk/nextjs';

// Client Supabase singleton pour éviter les instances multiples
let supabaseInstance: any = null;

// Créer un client Supabase sans authentification
export const createClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

  if (!supabaseInstance) {
    supabaseInstance = createSupabaseClient(supabaseUrl, supabaseAnonKey);
  }
  return supabaseInstance;
};

// Créer un client Supabase authentifié avec le token JWT de Clerk
// Pour utilisation dans les composants côté client avec useAuth
export const createAuthenticatedClient = () => {
  const { getToken } = useAuth();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

  if (!supabaseInstance) {
    supabaseInstance = createSupabaseClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: 'Bearer ' + getToken(),
        },
      },
    });
  }
  return supabaseInstance;
};

// Fonction hook pour utiliser dans les composants React avec useSession
export function useClerkSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

  // Pendant la phase de développement/migration, on utilise simplement le client anonyme
  // pour éviter les problèmes d'authentification avec Clerk
  if (!supabaseInstance) {
    supabaseInstance = createSupabaseClient(supabaseUrl, supabaseAnonKey);
  }
  return supabaseInstance;
} 