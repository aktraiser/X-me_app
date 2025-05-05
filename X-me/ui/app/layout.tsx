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

// Personnalisation minimale avec traduction des erreurs
const customLocalization = {
  ...frFR,
  signIn: {
    ...(frFR.signIn || {}),
    start: {
      ...(frFR.signIn?.start || {}),
      title: "Connexion à X-me",
      subtitle: "Tous les champs sont obligatoires",
    },
  },
  signUp: {
    ...(frFR.signUp || {}),
    start: {
      ...(frFR.signUp?.start || {}),
      title: "Créer un compte X-me",
      subtitle: "Tous les champs sont obligatoires",
    },
  },
  unstable__errors: {
    ...(frFR.unstable__errors || {}),
    // Erreurs de connexion
    session_exists: "Vous êtes déjà connecté à un compte. Vous ne pouvez être connecté qu'à un seul compte à la fois.",
    identifier_already_signed_in: "Vous êtes déjà connecté avec cet identifiant.",
    form_identifier_not_found: "Aucun compte trouvé avec ces identifiants.",
    form_password_incorrect: "Le mot de passe est incorrect.",
    
    // Erreurs d'inscription
    form_identifier_exists__email_address: "Cette adresse email est déjà utilisée par un autre compte.",
    form_identifier_exists__username: "Ce nom d'utilisateur est déjà pris.",
    form_identifier_exists__phone_number: "Ce numéro de téléphone est déjà associé à un compte.",
    form_password_length_too_short: "Le mot de passe doit contenir au moins 8 caractères.",
    form_password_no_match: "Les mots de passe ne correspondent pas.",
    
    // Erreurs générales
    form_param_format_invalid__phone_number: "Le numéro de téléphone doit être au format international valide.",
    form_param_invalid: "Certaines informations saisies ne sont pas valides.",
    form_param_missing: "Tous les champs sont obligatoires. Veuillez les remplir tous.",
    network_error: "Erreur de connexion réseau. Veuillez vérifier votre connexion internet.",
    form_code_incorrect: "Le code est incorrect.",
    form_expired_code: "Le code a expiré, veuillez en demander un nouveau.",
    form_password_validation_failed: "Le mot de passe doit contenir au moins 8 caractères, incluant une majuscule, une minuscule et un chiffre.",
    form_email_invalid: "L'adresse email n'est pas valide. Veuillez vérifier et réessayer."
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
