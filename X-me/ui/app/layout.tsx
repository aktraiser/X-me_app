// Pas de 'use client' ici car nous voulons que la metadata soit côté serveur
import type { Metadata } from 'next';
import { Montserrat } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';
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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body className={montserrat.className + " min-h-screen"}>
        {/* Intégration du composant Termly CMP avec auto-blocage activé */}
        <TermlyCMP 
          websiteUUID={TERMLY_WEBSITE_UUID} 
          autoBlock={true}
        />
        
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}