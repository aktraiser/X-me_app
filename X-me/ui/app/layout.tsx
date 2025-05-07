// Pas de 'use client' ici car nous voulons que la metadata soit côté serveur
import type { Metadata } from 'next';
import { Montserrat } from 'next/font/google';
import ThemeProviderComponent from '@/components/theme/Provider';
import { Toaster } from 'react-hot-toast';
import Layout from '@/components/Layout';
import './globals.css';
import { ClerkProvider } from '@clerk/nextjs';
// Importation de la localisation française
import { frFR } from '@clerk/localizations';
import KeepAliveProvider from '../components/KeepAliveProvider';
import TermlyCMP from '@/components/TermlyCMP';

const montserrat = Montserrat({
  weight: ['300', '400', '500', '700'],
  subsets: ['latin'],
  display: 'swap',
  fallback: ['Arial', 'sans-serif'],
});

// UUID de votre site Termly
const TERMLY_WEBSITE_UUID = '2b659cf0-9192-417e-8ee3-8ba5e67271c7';

export const metadata: Metadata = {
  title: 'Xandme - Ici c\'est vous le patron ',
  description: 'Xand&me est une plateforme de mise en relation avec des experts.',
};

// Utilisation des variables d'environnement au lieu d'une clé codée en dur
// Clerk gère automatiquement l'utilisation de la bonne clé via NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || 'pk_live_Y2xlcmsueGFuZG1lLmZyJA';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={montserrat.className + " min-h-screen"}>
        {/* Intégration du composant Termly CMP avec auto-blocage activé */}
        <TermlyCMP 
          websiteUUID={TERMLY_WEBSITE_UUID} 
          autoBlock={true}
        />
        
        {/* Clerk en français */}
        <ClerkProvider 
          localization={frFR}
          publishableKey={publishableKey}
        >
          <ThemeProviderComponent>
            <KeepAliveProvider>
              <Layout>{children}</Layout>
              <Toaster position="top-right" />
            </KeepAliveProvider>
          </ThemeProviderComponent>
        </ClerkProvider>
      </body>
    </html>
  );
}