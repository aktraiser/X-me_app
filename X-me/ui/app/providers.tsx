'use client';

import { ReactNode } from 'react';
import { ClerkProvider } from '@clerk/nextjs';
import { frFR } from '@clerk/localizations';
import ThemeProviderComponent from '@/components/theme/Provider';
import KeepAliveProvider from '@/components/KeepAliveProvider';
import { Toaster } from 'react-hot-toast';
import Layout from '@/components/Layout';

// Clé publique de l'environnement ou valeur par défaut
const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || 'pk_live_Y2xlcmsueGFuZG1lLmZyJA';

// Personnalisation des traductions selon la documentation
const customFrenchLocalizations = {
  ...frFR,
  signIn: {
    ...frFR.signIn,
    start: {
      ...frFR.signIn?.start,
      title: "Connexion",
      subtitle: "Bienvenue ! Veuillez vous connecter pour continuer",
      actionText: "Pas encore de compte ?",
      actionLink: "S'inscrire",
    }
  },
  signUp: {
    ...frFR.signUp,
    start: {
      ...frFR.signUp?.start,
      title: "Créer un compte",
      subtitle: "Inscrivez-vous pour accéder à X-me",
      actionText: "Déjà un compte ?",
      actionLink: "Se connecter",
    }
  },
  // Ajouter ici les autres clés problématiques
  formFieldLabel__emailAddress: "Adresse email",
  formFieldLabel__password: "Mot de passe",
};

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <ClerkProvider
      localization={customFrenchLocalizations}
      publishableKey={publishableKey}
      appearance={{
        variables: {
          colorPrimary: '#d97706',
          colorTextOnPrimaryBackground: '#ffffff',
        },
        elements: {
          formButtonPrimary: {
            backgroundColor: '#d97706',
            '&:hover': {
              backgroundColor: '#b45309'
            }
          }
        }
      }}
    >
      <ThemeProviderComponent>
        <KeepAliveProvider>
          <Layout>{children}</Layout>
          <Toaster position="top-right" />
        </KeepAliveProvider>
      </ThemeProviderComponent>
    </ClerkProvider>
  );
}