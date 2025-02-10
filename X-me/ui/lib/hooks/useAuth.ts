import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'
import { toast } from 'react-hot-toast'
import type { Database } from '@/types/database.types'
import type { User } from '@supabase/auth-helpers-nextjs'

export function useAuth() {
  const supabase = createClientComponentClient<Database>()
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const getUser = async () => {
      const { data: { session }, error } = await supabase.auth.getSession()
      if (error) {
        console.error('Error fetching session:', error.message)
        return
      }
      setUser(session?.user ?? null)
      setLoading(false)
    }

    getUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      router.refresh()
    })

    return () => subscription.unsubscribe()
  }, [supabase, router])

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true)
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password.trim(),
      })

      if (error) throw error

      if (data?.session) {
        toast.success('Connexion réussie !')
        router.refresh()
        router.push('/')
      }
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('Invalid login credentials')) {
          toast.error('Email ou mot de passe incorrect')
        } else {
          toast.error(error.message)
        }
      }
      throw error
    } finally {
      setLoading(false)
    }
  }

  const signOut = async () => {
    try {
      setLoading(true)
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      
      toast.success('Déconnexion réussie')
      router.refresh()
      router.push('/login')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erreur lors de la déconnexion')
      throw error
    } finally {
      setLoading(false)
    }
  }

  const deleteAccount = async () => {
    try {
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', user?.id)
      
      if (error) throw error
      
      toast.success('Compte supprimé avec succès')
      await signOut()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erreur lors de la suppression du compte')
      throw error
    }
  }

  return {
    user,
    loading,
    signIn,
    signOut,
    deleteAccount,
    supabase
  }
} 