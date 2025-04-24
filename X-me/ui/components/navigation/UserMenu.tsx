'use client';

import { UserButton, SignInButton } from '@clerk/nextjs';
import { useUser } from '@clerk/nextjs';
import { dark } from '@clerk/themes';
import { useTheme } from 'next-themes';
import { useState, useEffect } from 'react';

export default function UserMenu() {
  const { isSignedIn } = useUser();
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Éviter les erreurs d'hydratation
  useEffect(() => {
    setMounted(true);
  }, []);

  // Déterminer si le thème sombre est actif
  const isDarkTheme = mounted && theme === 'dark';

  return (
    <div className="flex items-center gap-4">
      {isSignedIn ? (
        <UserButton 
          appearance={{
            baseTheme: isDarkTheme ? dark : undefined,
            elements: {
              avatarBox: 'w-10 h-10',
            }
          }}
        />
      ) : (
        <SignInButton mode="modal">
          <button className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors">
            Connexion
          </button>
        </SignInButton>
      )}
    </div>
  );
} 