// Pas de 'use client' ici car nous voulons que la metadata soit côté serveur
import type { Metadata } from 'next';
import { Montserrat } from 'next/font/google';
import ThemeProviderComponent from '@/components/theme/Provider';
import { Toaster } from 'react-hot-toast';
import Layout from '@/components/Layout';
import './globals.css';

const montserrat = Montserrat({
  weight: ['300', '400', '500', '700'],
  subsets: ['latin'],
  display: 'swap',
  fallback: ['Arial', 'sans-serif'],
});

export const metadata: Metadata = {
  title: 'X&me - Chat with the internet',
  description: 'X&me is an AI powered chatbot that is connected to the internet.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body className={montserrat.className + " min-h-screen bg-light-primary dark:bg-dark-primary"}>
        <ThemeProviderComponent>
          <Layout>{children}</Layout>
          <Toaster position="top-right" />
        </ThemeProviderComponent>
      </body>
    </html>
  );
}
