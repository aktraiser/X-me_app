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

const montserrat = Montserrat({
  weight: ['300', '400', '500', '700'],
  subsets: ['latin'],
  display: 'swap',
  fallback: ['Arial', 'sans-serif'],
});

export const metadata: Metadata = {
  title: 'X&me - Discutez avec internet',
  description: 'X&me est un chatbot alimenté par l\'IA connecté à internet.',
};

// Ajouter une clé Clerk publique temporaire pour le développement
const clerkPublishableKey = 'pk_test_bWFpbi1ibHVlYmlyZC02NC5jbGVyay5hY2NvdW50cy5kZXYk';

// Personnalisation de certains éléments
const customLocalization = {
  ...frFR,
  signIn: {
    ...frFR.signIn,
    termsAndPrivacyNotice: {
      title: 'En vous inscrivant ou en vous connectant, vous acceptez les Conditions d\'utilisation et la Politique de confidentialité de DeepSeek.',
    },
  },
  signUp: {
    ...frFR.signUp,
    termsAndPrivacyNotice: {
      title: 'En vous inscrivant ou en vous connectant, vous acceptez les Conditions d\'utilisation et la Politique de confidentialité de DeepSeek.',
    },
  }
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body className={montserrat.className + " min-h-screen"}>
        <ClerkProvider 
          publishableKey={clerkPublishableKey}
          localization={customLocalization}
        >
          <ThemeProviderComponent>
            <Layout>{children}</Layout>
            <Toaster position="top-right" />
          </ThemeProviderComponent>
        </ClerkProvider>
      </body>
    </html>
  );
}
