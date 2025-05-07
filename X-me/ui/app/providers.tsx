'use client';

import { ReactNode } from 'react';
import { ClerkProvider } from '@clerk/nextjs';   // Utilisation du chemin standard
import { frFR } from '@clerk/localizations';
import ThemeProviderComponent from '@/components/theme/Provider';
import KeepAliveProvider from '@/components/KeepAliveProvider';
import { Toaster } from 'react-hot-toast';
import Layout from '@/components/Layout';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ClerkProvider
      localization={frFR}
      publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || 'pk_live_Y2xlcmsueGFuZG1lLmZyJA'}
      appearance={{
        variables: { colorPrimary: '#c49c48' },
        layout: {
          socialButtonsPlacement: 'bottom',
          socialButtonsVariant: 'iconButton',
        },
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