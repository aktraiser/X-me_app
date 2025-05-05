'use client';

import { SignUp } from '@clerk/nextjs';
import { dark } from '@clerk/themes';
import { useTheme } from 'next-themes';
import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function SignUpPage() {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Éviter les erreurs d'hydratation
  useEffect(() => {
    setMounted(true);
  }, []);

  // Déterminer si le thème sombre est actif
  const isDarkTheme = mounted && theme === 'dark';

  return (
    <div className="w-full max-w-md mx-auto px-4 py-8">
      
      <SignUp 
        appearance={{
          baseTheme: isDarkTheme ? dark : undefined,
          elements: {
            formButtonPrimary: 
              'bg-amber-600 hover:bg-amber-700 text-white font-medium text-sm py-2.5 rounded-md',
            card: 'bg-white dark:bg-[#1E293B] shadow-lg w-full',
            headerTitle: 'text-black dark:text-white text-2xl font-bold',
            headerSubtitle: 'text-gray-600 dark:text-gray-400',
            formFieldLabel: 'text-black dark:text-white',
            formFieldInput: 'bg-gray-50 dark:bg-[#374151] border border-gray-300 dark:border-gray-600 text-black dark:text-white',
            footer: 'text-gray-600 dark:text-gray-400',
            footerActionLink: 'text-blue-500 hover:text-blue-400',
            footerAction: 'hidden',
            developmentModeTag: 'hidden',
            powerButton: 'hidden',
            formFieldError: 'text-red-500 text-sm mt-1 font-medium',
            alert: 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 p-3 rounded-md text-sm',
          },
          variables: {
            colorPrimary: '#d97706',
            colorText: isDarkTheme ? '#ffffff' : '#000000',
            colorTextSecondary: isDarkTheme ? '#cbd5e1' : '#64748b',
            colorBackground: isDarkTheme ? '#1e293b' : '#ffffff',
            colorInputText: isDarkTheme ? '#ffffff' : '#000000',
            colorInputBackground: isDarkTheme ? '#374151' : '#f9fafb',
          }
        }}
        path="/sign-up"
        routing="path"
        signInUrl="/sign-in"
        redirectUrl="/"
        afterSignUpUrl="/"
      />
      
      <div className="mt-4 text-center">
        <span className="text-gray-600 dark:text-gray-400">Déjà un compte ? </span>
        <Link href="/sign-in" className="text-blue-500 hover:text-blue-400 font-medium">
          Se connecter
        </Link>
      </div>
      
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
    </div>
  );
} 