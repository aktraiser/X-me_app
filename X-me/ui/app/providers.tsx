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
      appearance={{
        variables: {
          colorPrimary: '#d97706',
          colorText: '#1f2937',
          colorTextOnPrimaryBackground: '#ffffff',
          colorTextSecondary: '#4b5563',
        },
        elements: {
          formButtonPrimary: {
            backgroundColor: '#d97706',
            '&:hover': {
              backgroundColor: '#b45309'
            }
          },
          footerActionLink: {
            color: '#d97706',
          },
          card: {
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
            borderRadius: '0.5rem',
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