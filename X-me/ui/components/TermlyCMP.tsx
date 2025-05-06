'use client'

import { useEffect, useMemo, useRef } from 'react'
import dynamic from 'next/dynamic'

const SCRIPT_SRC_BASE = 'https://app.termly.io'

interface TermlyCMPProps {
  autoBlock?: boolean;
  masterConsentsOrigin?: string;
  websiteUUID: string;
}

// Composant client uniquement qui gère l'initialisation de Termly lors des changements de navigation
const TermlyInitializer = dynamic(() => Promise.resolve(() => {
  // On ne peut utiliser usePathname et useSearchParams que dans un composant client
  // qui ne sera pas rendu côté serveur
  const { usePathname, useSearchParams } = require('next/navigation')
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    // @ts-ignore - Termly est ajouté globalement par le script
    window.Termly?.initialize()
  }, [pathname, searchParams])

  return null
}), { ssr: false })

export default function TermlyCMP({ autoBlock, masterConsentsOrigin, websiteUUID }: TermlyCMPProps) {
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
    document.head.appendChild(script)
    isScriptAdded.current = true
  }, [scriptSrc])

  return <TermlyInitializer />
} 