'use client'

import { useEffect } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'

export default function TermlyInitializer() {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    // @ts-ignore - Termly est ajouté globalement par le script
    window.Termly?.initialize()
  }, [pathname, searchParams])

  return null
} 