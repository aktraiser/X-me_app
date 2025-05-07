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
          variables: {
            colorPrimary: '#d97706',
            colorBackground: isDarkTheme ? '#1e293b' : '#ffffff',
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
        En vous inscrivant, vous acceptez les{' '}
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