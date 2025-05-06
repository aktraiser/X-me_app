'use client'

import { useEffect, useMemo, useRef, useState } from 'react'

const SCRIPT_SRC_BASE = 'https://app.termly.io'

interface TermlyCMPProps {
  autoBlock?: boolean;
  masterConsentsOrigin?: string;
  websiteUUID: string;
}

export default function TermlyCMP({ autoBlock, masterConsentsOrigin, websiteUUID }: TermlyCMPProps) {
  const [mounted, setMounted] = useState(false)
  
  // Calculer l'URL du script Termly
  const scriptSrc = useMemo(() => {
    const src = new URL(SCRIPT_SRC_BASE)
    src.pathname = `/resource-blocker/${websiteUUID}`
    if (autoBlock) {
      src.searchParams.set('autoBlock', 'on')
    }
    if (masterConsentsOrigin) {
      src.searchParams.set('masterConsentsOrigin', masterConsentsOrigin)
    }
    return src.toString()
  }, [autoBlock, masterConsentsOrigin, websiteUUID])

  const isScriptAdded = useRef(false)

  // Charger le script Termly
  useEffect(() => {
    if (isScriptAdded.current) return
    try {
      const script = document.createElement('script')
      script.src = scriptSrc
      document.head.appendChild(script)
      isScriptAdded.current = true
    } catch (error) {
      console.error('Error adding Termly script:', error)
    }
  }, [scriptSrc])

  // Marquer le composant comme monté et garantir que window est disponible
  useEffect(() => {
    setMounted(true)
  }, [])

  // Initialiser Termly quand la page change
  useEffect(() => {
    if (mounted && typeof window !== 'undefined') {
      // Attendre un court instant pour que tout soit chargé
      const timer = setTimeout(() => {
        try {
          // @ts-ignore - Termly est ajouté globalement par le script
          if (window.Termly) window.Termly.initialize()
        } catch (error) {
          console.error('Error initializing Termly:', error)
        }
      }, 100)
      
      return () => clearTimeout(timer)
    }
  }, [mounted])

  return null
} 