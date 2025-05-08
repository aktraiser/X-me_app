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
        fallbackRedirectUrl="/"
      />
    </div>
  );
} 