import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import type { Database } from '@/types/database.types'
import { toast } from 'react-hot-toast'

export function useUserPreferences() {
  const supabase = createClientComponentClient<Database>()
  const [preferences, setPreferences] = useState<Partial<Database['public']['Tables']['users']['Row']>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadPreferences = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session?.user) return

        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .single()

        if (error) throw error
        setPreferences(data)
      } catch (error) {
        console.error('Error loading preferences:', error)
        toast.error('Erreur lors du chargement des préférences')
      } finally {
        setLoading(false)
      }
    }

    loadPreferences()
  }, [supabase])

  const updatePreference = async (key: string, value: any) => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) return

      const { error } = await supabase
        .from('users')
        .update({ [key]: value })
        .eq('id', session.user.id)

      if (error) throw error

      setPreferences(prev => ({ ...prev, [key]: value }))
      toast.success('Préférences mises à jour')
    } catch (error) {
      console.error('Error updating preference:', error)
      toast.error('Erreur lors de la mise à jour des préférences')
    }
  }

  return {
    preferences,
    loading,
    updatePreference
  }
} 