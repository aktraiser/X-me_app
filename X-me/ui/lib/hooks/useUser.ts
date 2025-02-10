import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './useAuth';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  phone: string | null;
  created_at: string;
}

export function useUser() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    let mounted = true;

    async function fetchProfile() {
      try {
        setLoading(true);
        setError(null);

        if (!user?.id) {
          if (mounted) {
            setProfile(null);
            setLoading(false);
          }
          return;
        }

        // Récupérer les données de l'utilisateur authentifié
        const { data: authUser, error: authError } = await supabase.auth.getUser();
        if (authError) throw authError;

        // Récupérer le profil complet
        const { data, error: profileError } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .single();

        if (profileError) throw profileError;

        if (mounted && data) {
          setProfile({
            ...data,
            email: authUser.user?.email || data.email || '',
          });
        }
      } catch (err) {
        console.error('Error fetching user profile:', err);
        if (mounted) {
          setError(err instanceof Error ? err : new Error('Failed to fetch user profile'));
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    fetchProfile();

    // Écouter les changements d'authentification
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        fetchProfile();
      } else {
        setProfile(null);
      }
    });

    return () => {
      mounted = false;
      authListener?.subscription.unsubscribe();
    };
  }, [user]);

  const updateProfile = async (updates: Partial<UserProfile>) => {
    try {
      setLoading(true);
      setError(null);

      if (!user?.id) throw new Error('No user ID available');

      const { error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', user.id);

      if (error) throw error;

      // Recharger le profil pour obtenir les données mises à jour
      const { data, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      if (fetchError) throw fetchError;

      setProfile(prev => ({ ...prev!, ...data }));
      return { data, error: null };
    } catch (err) {
      console.error('Error updating profile:', err);
      setError(err instanceof Error ? err : new Error('Failed to update profile'));
      return { data: null, error: err };
    } finally {
      setLoading(false);
    }
  };

  return {
    profile,
    loading,
    error,
    updateProfile,
  };
} 