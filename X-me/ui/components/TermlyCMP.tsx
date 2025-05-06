'use client'

import { useEffect, useMemo, useRef } from 'react'
import dynamic from 'next/dynamic'

const SCRIPT_SRC_BASE = 'https://app.termly.io'

interface TermlyCMPProps {
  autoBlock?: boolean;
  masterConsentsOrigin?: string;
  websiteUUID: string;
}

// Nous créons un composant wrapper pour la partie qui utilise usePathname et useSearchParams
// et nous l'importons dynamiquement avec { ssr: false } pour éviter les erreurs de prérendu
const TermlyInitializer = dynamic(
  () => import('./TermlyInitializer').then((mod) => mod.default),
  { ssr: false }
)

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