'use client';

import { ReactNode } from 'react';
import { ClerkProvider } from '@clerk/nextjs';
import { frFR } from '@clerk/localizations/fr-FR';
import { enUS } from '@clerk/localizations/en-US';
import ThemeProviderComponent from '@/components/theme/Provider';
import KeepAliveProvider from '@/components/KeepAliveProvider';
import { Toaster } from 'react-hot-toast';
import Layout from '@/components/Layout';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

// Clé publique de l'environnement ou valeur par défaut
const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || 'pk_live_Y2xlcmsueGFuZG1lLmZyJA';

// Personnalisation des traductions françaises
const customFrFR = {
  ...frFR,
  signIn: {
    ...frFR.signIn,
    start: {
      ...frFR.signIn?.start,
      title: 'Connexion',
      subtitle: 'pour continuer sur Xandme',
      actionText: 'Vous n\'avez pas de compte ?',
      actionLink: 'S\'inscrire'
    }
  },
  signUp: {
    ...frFR.signUp,
    start: {
      ...frFR.signUp?.start,
      title: 'Créer un compte',
      subtitle: 'pour continuer sur Xandme',
      actionText: 'Vous avez déjà un compte ?',
      actionLink: 'Se connecter'
    }
  },
  userButton: {
    ...frFR.userButton,
    action__signOut: 'Déconnexion'
  }
};

// Personnalisation des traductions anglaises
const customEnUS = {
  ...enUS,
  signIn: {
    ...enUS.signIn,
    start: {
      ...enUS.signIn?.start,
      subtitle: 'to continue to Xandme'
    }
  },
  signUp: {
    ...enUS.signUp,
    start: {
      ...enUS.signUp?.start,
      subtitle: 'to continue to Xandme'
    }
  }
};

// Carte des localisations disponibles
const localizationMap = {
  'fr': customFrFR,
  'en': customEnUS,
};

// Type pour la localisation
type LocalizationType = typeof frFR;

export default function Providers({ children }: { children: ReactNode }) {
  const [currentLocale, setCurrentLocale] = useState('fr'); // Par défaut en français
  const [localization, setLocalization] = useState<LocalizationType>(customFrFR as LocalizationType);
  const router = useRouter();

  // Détecter la langue du navigateur au chargement (client-side)
  useEffect(() => {
    // Récupérer la langue du navigateur ou du localStorage si définie
    const savedLocale = localStorage.getItem('locale');
    const browserLocale = navigator.language.split('-')[0];
    const detectedLocale = savedLocale || 
                        (localizationMap[browserLocale as keyof typeof localizationMap] ? browserLocale : 'fr');
    
    setCurrentLocale(detectedLocale);
    const selectedLocalization = localizationMap[detectedLocale as keyof typeof localizationMap] || customFrFR;
    setLocalization(selectedLocalization as LocalizationType);
    
    // Log pour debug
    console.log('[i18n] Locale détectée:', detectedLocale);
  }, []);

  return (
    <ClerkProvider
      localization={localization}
      publishableKey={publishableKey}
      appearance={{
        elements: {
          formButtonPrimary: "bg-primary hover:bg-primary-darker text-white",
          footerActionLink: "text-primary hover:text-primary-darker",
          card: "shadow-md rounded-lg",
          navbar: "hidden",
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