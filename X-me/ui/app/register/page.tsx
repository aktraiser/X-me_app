'use client';

import { SignUp } from '@clerk/nextjs';
import { dark } from '@clerk/themes';
import { useTheme } from 'next-themes';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';

export default function RegisterPage() {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Éviter les erreurs d'hydratation
  useEffect(() => {
    setMounted(true);
  }, []);

  // Déterminer si le thème sombre est actif
  const isDarkTheme = mounted && theme === 'dark';

  return (
    <>
      <SignUp 
        appearance={{
          baseTheme: isDarkTheme ? dark : undefined,
          elements: {
            formButtonPrimary: 
              'bg-blue-600 hover:bg-blue-700 text-white',
            card: 'bg-white dark:bg-[#1E293B] shadow-lg w-full',
            headerTitle: 'text-black dark:text-white text-2xl font-bold',
            headerSubtitle: 'text-gray-600 dark:text-gray-400',
            formFieldLabel: 'text-black dark:text-white',
            formFieldInput: 'bg-gray-50 dark:bg-[#374151] border border-gray-300 dark:border-gray-600 text-black dark:text-white',
            footer: 'text-gray-600 dark:text-gray-400',
            footerActionLink: 'text-blue-500 hover:text-blue-400',
          },
        }}
        path="/register"
        routing="path"
        signInUrl="/login"
        redirectUrl="/"
      />
      
      <div className="mt-6 text-center text-xs text-gray-500 dark:text-gray-400">
        En vous inscrivant ou en vous connectant, vous acceptez les{' '}
        <Link href="/terms" className="text-blue-500 hover:text-blue-400">
          Conditions d&apos;Utilisation
        </Link>{' '}
        et la{' '}
        <Link href="/privacy" className="text-blue-500 hover:text-blue-400">
          Politique de Confidentialité
        </Link>{' '}
        de X-me.
      </div>
    </>
  );
} 