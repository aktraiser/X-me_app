'use client';

import { ReactNode } from 'react';
import { ClerkProvider } from '@clerk/nextjs';
import customFrenchTranslations from '@/lib/clerk-translations';
import ThemeProviderComponent from '@/components/theme/Provider';
import KeepAliveProvider from '@/components/KeepAliveProvider';
import { Toaster } from 'react-hot-toast';
import Layout from '@/components/Layout';

// Clé publique de l'environnement ou valeur par défaut
const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || 'pk_live_Y2xlcmsueGFuZG1lLmZyJA';

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <ClerkProvider
      localization={customFrenchTranslations}
      publishableKey={publishableKey}
      clerkJSVersion="6.17.0"
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