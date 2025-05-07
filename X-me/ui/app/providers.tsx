'use client';

import { ReactNode } from 'react';
import { ClerkProvider } from '@clerk/nextjs';
import { frFR } from '@clerk/localizations';
import ThemeProviderComponent from '@/components/theme/Provider';
import KeepAliveProvider from '@/components/KeepAliveProvider';
import { Toaster } from 'react-hot-toast';
import Layout from '@/components/Layout';

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <ClerkProvider localization={frFR}>
      <ThemeProviderComponent>
        <KeepAliveProvider>
          <Layout>{children}</Layout>
          <Toaster position="top-right" />
        </KeepAliveProvider>
      </ThemeProviderComponent>
    </ClerkProvider>
  );
}