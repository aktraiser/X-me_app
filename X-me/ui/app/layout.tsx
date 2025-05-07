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

// Personnalisation minimale avec traduction des erreurs
const customLocalization = {
  ...frFR,
  signIn: {
    ...(frFR.signIn || {}),
    start: {
      ...(frFR.signIn?.start || {}),
      title: "Connexion à Xandme",
      subtitle: "Tous les champs sont obligatoires",
    },
    emailCode: {
      ...(frFR.signIn?.emailCode || {}),
      title: "Vérifiez votre email",
      subtitle: "Un code de vérification a été envoyé à {identifier}",
    },
    password: {
      ...(frFR.signIn?.password || {}),
      title: "Entrez votre mot de passe",
      subtitle: "Pour vous connecter avec {identifier}",
    },
  },
  signUp: {
    ...(frFR.signUp || {}),
    start: {
      ...(frFR.signUp?.start || {}),
      title: "Créer un compte Xandme",
      subtitle: "Tous les champs sont obligatoires",
    },
    emailCode: {
      ...(frFR.signUp?.emailCode || {}),
      title: "Vérifiez votre email",
      subtitle: "Un code de vérification a été envoyé à {identifier}",
    },
    phoneCode: {
      ...(frFR.signUp?.phoneCode || {}),
      title: "Vérifiez votre téléphone",
      subtitle: "Un code de vérification a été envoyé au {identifier}",
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
        {/* Intégration du composant Termly CMP avec auto-blocage activé */}
        <TermlyCMP 
          websiteUUID={TERMLY_WEBSITE_UUID} 
          autoBlock={true}
        />
        
        <ClerkProvider 
          // Plus de clé codée en dur - Clerk utilisera NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
          publishableKey={publishableKey}
          localization={customLocalization}
          dynamic
          appearance={{
            elements: {
              formFieldErrorText: 'text-red-500 text-sm mt-1 font-medium',
              formFieldError: 'border-red-500 focus:ring-red-500',
              formFieldInput: 'bg-gray-50 dark:bg-[#374151] border border-gray-300 dark:border-gray-600 text-black dark:text-white rounded-md p-2.5',
              formFieldLabel: 'block text-black dark:text-white font-medium mb-1.5',
              card: 'bg-white dark:bg-[#1E293B] shadow-lg',
              formFieldInputShowPasswordButton: 'text-gray-600 hover:text-gray-800',
              identityPreview: 'bg-gray-100 dark:bg-gray-800',
              alert: 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 p-3 rounded-md text-sm mb-4',
              logoImage: 'w-32 h-32',
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
      </body>
    </html>
  );
}
