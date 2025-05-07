'use client';

import { SignUp } from '@clerk/nextjs';
import Link from 'next/link';

export default function SignUpPage() {
  return (
    <div className="w-full max-w-md mx-auto px-4 py-8">
      
      <SignUp 
        path="/sign-up"
        routing="path"
        signInUrl="/sign-in"
        redirectUrl="/"
        afterSignUpUrl="/"
      />
      
      <div className="mt-4 text-center">
        <span className="text-gray-600 dark:text-gray-400">Déjà un compte ? </span>
        <Link href="/sign-in" className="text-amber-600 hover:text-amber-500 font-medium">
          Se connecter
        </Link>
      </div>
      
      <div className="mt-6 text-center text-xs text-gray-500 dark:text-gray-400">
        En vous inscrivant ou en vous connectant, vous acceptez les{' '}
        <Link href="/conditions-utilisation" className="text-amber-600 hover:text-amber-500">
          Conditions d&apos;Utilisation
        </Link>{' '}
        et la{' '}
        <Link href="/politique-confidentialite" className="text-amber-600 hover:text-amber-500">
          Politique de Confidentialité
        </Link>{' '}
        de X-me.
      </div>
    </div>
  );
} 