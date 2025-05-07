'use client';

import Link from 'next/link';

// Composant pour afficher les liens d'authentification
export function AuthLinks() {
  return (
    <div className="flex gap-3">
      <Link 
        href="https://accounts.xandme.fr/sign-in?locale=fr-FR"
        className="text-sm font-medium text-black dark:text-white hover:underline"
      >
        Se connecter
      </Link>
      <Link 
        href="https://accounts.xandme.fr/sign-up?locale=fr-FR" 
        className="text-sm font-medium bg-[#c49c48] text-white px-3 py-1 rounded-md hover:bg-[#c49c48]/90 transition-colors"
      >
        S'inscrire
      </Link>
    </div>
  );
}

export default AuthLinks; 