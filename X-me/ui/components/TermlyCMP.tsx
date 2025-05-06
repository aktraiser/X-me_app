'use client'

import { useEffect, useMemo, useRef } from 'react'
import { Suspense } from 'react'

const SCRIPT_SRC_BASE = 'https://app.termly.io'

// Augmenter l'interface Window pour inclure Termly
declare global {
  interface Window {
    Termly?: {
      initialize: () => void;
    };
  }
}

interface TermlyCMPProps {
  autoBlock?: boolean;
  masterConsentsOrigin?: string;
  websiteUUID: string;
}

// Composant interne qui utilise useSearchParams
function TermlyContent({ autoBlock, masterConsentsOrigin, websiteUUID }: TermlyCMPProps) {
  // Utilisation de usePathname et useSearchParams enveloppés dans un Suspense
  const { usePathname, useSearchParams } = require('next/navigation')
  const pathname = usePathname()
  const searchParams = useSearchParams()
  
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

  useEffect(() => {
    if (isScriptAdded.current) return
    const script = document.createElement('script')
    script.src = scriptSrc
    script.id = "termly-resource-blocker"
    // Ajouter en premier pour s'assurer qu'il est au début du head
    const firstChild = document.head.firstChild
    document.head.insertBefore(script, firstChild)
    isScriptAdded.current = true
  }, [scriptSrc])

  useEffect(() => {
    // Initialiser Termly quand la page change
    if (typeof window !== 'undefined' && window.Termly) {
      window.Termly.initialize()
    }
  }, [pathname, searchParams])

  return null
}

// Composant principal qui enveloppe TermlyContent dans un Suspense
export default function TermlyCMP(props: TermlyCMPProps) {
  return (
    <Suspense>
      <TermlyContent {...props} />
    </Suspense>
  )
} 