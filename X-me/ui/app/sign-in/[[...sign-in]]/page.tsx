'use client';

import { SignIn } from '@clerk/nextjs';
import Link from 'next/link';

export default function SignInPage() {
  return (
    <div className="w-full max-w-md mx-auto px-4 py-8">
      <SignIn 
        path="/sign-in"
        routing="path"
        signUpUrl="/sign-up"
        redirectUrl="/"
        afterSignInUrl="/"
      />
      
      <div className="mt-4 text-center">
        <span className="text-gray-600 dark:text-gray-400">Pas encore de compte ? </span>
        <Link href="/sign-up" className="text-amber-600 hover:text-amber-500 font-medium">
          S&apos;inscrire
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