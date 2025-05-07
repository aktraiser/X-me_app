'use client';

import { ReactNode, useEffect } from 'react';
import { ClerkProvider, useClerk } from '@clerk/nextjs';
import { frFR } from '@clerk/localizations/fr-FR';
import ThemeProviderComponent from '@/components/theme/Provider';
import KeepAliveProvider from '@/components/KeepAliveProvider';
import { Toaster } from 'react-hot-toast';
import Layout from '@/components/Layout';

// Clé publique de l'environnement ou valeur par défaut
const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || 'pk_live_Y2xlcmsueGFuZG1lLmZyJA';

// Composant pour forcer la localisation manuellement après le chargement
function LocalizationDebugger() {
  const { setActive } = useClerk();
  
  useEffect(() => {
    // Afficher des informations de débogage sur frFR
    console.log('[DEBUG] frFR:', {
      available: !!frFR,
      keys: frFR ? Object.keys(frFR) : [],
      signIn: frFR?.signIn ? 'disponible' : 'non disponible',
      signUp: frFR?.signUp ? 'disponible' : 'non disponible',
    });
    
    // Essayer de forcer la localisation avec l'API Clerk
    try {
      if (window.Clerk) {
        window.Clerk.setLocale && window.Clerk.setLocale('fr-FR');
        console.log('[DEBUG] setLocale appelé');
        
        // Essayer également les méthodes internes si disponibles
        if (window.Clerk.__unstable_updateProps) {
          window.Clerk.__unstable_updateProps({ localization: frFR });
          console.log('[DEBUG] __unstable_updateProps appelé');
        }
      } else {
        console.warn('[DEBUG] window.Clerk non disponible');
      }
    } catch (error) {
      console.error('[DEBUG] Erreur:', error);
    }
  }, [setActive]);
  
  return null;
}

// Type global pour window.Clerk
declare global {
  interface Window {
    Clerk?: any;
  }
}

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <ClerkProvider
      localization={frFR}
      publishableKey={publishableKey}
      appearance={{
        baseTheme: undefined,
        variables: {
          colorPrimary: '#c49c48',
          colorText: '#333333',
        },
        elements: {
          formButtonPrimary: "bg-primary hover:bg-primary-darker text-white font-semibold",
          footerActionLink: "text-primary hover:text-primary-darker",
          formFieldInput: "text-base",
          formFieldLabel: "text-sm",
          formFieldHintText: "text-xs",
          formFieldErrorText: "text-xs text-red-500",
          card: "shadow-md rounded-lg",
          navbar: "hidden",
        },
        layout: {
          socialButtonsVariant: 'blockButton',
          socialButtonsPlacement: 'bottom',
          termsPageUrl: '/conditions-utilisation',
          privacyPageUrl: '/politique-confidentialite',
        }
      }}
    >
      <LocalizationDebugger />
      <ThemeProviderComponent>
        <KeepAliveProvider>
          <Layout>{children}</Layout>
          <Toaster position="top-right" />
        </KeepAliveProvider>
      </ThemeProviderComponent>
    </ClerkProvider>
  );
}