'use client';

import { ReactNode, useEffect } from 'react';
import { ClerkProvider } from '@clerk/nextjs';
import { frFR } from '@clerk/localizations';
import ThemeProviderComponent from '@/components/theme/Provider';
import KeepAliveProvider from '@/components/KeepAliveProvider';
import { Toaster } from 'react-hot-toast';

// Clé publique de l'environnement ou valeur par défaut
const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || 'pk_live_Y2xlcmsueGFuZG1lLmZyJA';

// Personnalisation des traductions en français selon la documentation
const customFrenchLocalizations = {
  ...frFR,
  signIn: {
    ...frFR.signIn,
    start: {
      ...frFR.signIn?.start,
      title: "Connexion à X-me",
      subtitle: "Bienvenue ! Veuillez vous connecter pour continuer",
      actionText: "Pas encore de compte ?",
      actionLink: "S'inscrire",
    },
    password: {
      ...frFR.signIn?.password,
      subtitle: "Entrez le mot de passe associé à votre compte",
    },
    forgotPasswordAlternativeMethods: {
      ...frFR.signIn?.forgotPasswordAlternativeMethods,
      label__alternativeMethods: "Ou, se connecter avec une autre méthode",
    },
    resetPassword: {
      ...frFR.signIn?.resetPassword,
      title: "Définir un nouveau mot de passe",
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
    },
    continue: {
      ...frFR.signUp?.continue,
      subtitle: "Veuillez remplir les informations restantes pour continuer.",
      actionText: "Déjà un compte ?",
    },
  },
  userProfile: {
    ...frFR.userProfile,
    start: {
      ...frFR.userProfile?.start,
      headerTitle__account: "Profil",
    }
  },
  formFieldLabel__emailAddress: "Adresse email",
  formFieldLabel__password: "Mot de passe",
  formButtonPrimary__verify: "Vérifier",
  formButtonPrimary: "Continuer",
};

export default function Providers({ children }: { children: ReactNode }) {
  // Effet pour gérer le CSP et permettre eval() côté client en développement
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      const meta = document.createElement('meta');
      meta.httpEquiv = 'Content-Security-Policy';
      meta.content = "script-src 'self' 'unsafe-eval' clerk.xandme.fr *.clerk.accounts.dev;";
      document.head.appendChild(meta);
      
      return () => {
        document.head.removeChild(meta);
      };
    }
  }, []);

  return (
    <ClerkProvider
      localization={customFrenchLocalizations}
      publishableKey={publishableKey}
      appearance={{
        variables: {
          colorPrimary: '#d97706',
          colorTextOnPrimaryBackground: '#ffffff',
          colorBackground: '#F5F5EC',
          colorText: '#1E293B',
          colorDanger: '#EF4444',
          colorSuccess: '#10B981',
          fontFamily: 'inherit',
          borderRadius: '0.5rem',
        },
        elements: {
          formButtonPrimary: {
            backgroundColor: '#d97706',
            color: 'white',
            fontWeight: 600,
            borderRadius: '0.5rem',
            '&:hover': {
              backgroundColor: '#b45309'
            }
          },
          card: {
            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)',
            borderRadius: '0.75rem',
          },
          formFieldInput: {
            borderRadius: '0.5rem',
          },
          footer: {
            '& a': {
              color: '#d97706',
            }
          },
          headerSubtitle: {
            color: '#4B5563',
          }
        }
      }}
    >
      <ThemeProviderComponent>
        <KeepAliveProvider>
          {children}
          <Toaster position="top-right" />
        </KeepAliveProvider>
      </ThemeProviderComponent>
    </ClerkProvider>
  );
}