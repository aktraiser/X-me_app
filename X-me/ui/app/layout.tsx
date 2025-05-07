// Pas de 'use client' ici car nous voulons que la metadata soit côté serveur
import type { Metadata } from 'next';
import { Montserrat } from 'next/font/google';
import './globals.css';
import ThemeProviderComponent from '@/components/theme/Provider';
import { Toaster } from 'react-hot-toast';
import Layout from '@/components/Layout';
import { ClerkProvider } from '@clerk/nextjs';
// Importation de la localisation française
import { frFR } from '@clerk/localizations';
import KeepAliveProvider from '@/components/KeepAliveProvider';
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

// Clé publique de Clerk
const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || 'pk_live_Y2xlcmsueGFuZG1lLmZyJA';

// Personnalisation des traductions en français
const customFrenchLocalizations = {
  ...frFR,
  signIn: {
    ...frFR.signIn,
    start: {
      ...frFR.signIn?.start,
      title: "Connexion à X-me",
      subtitle: "Bienvenue ! Veuillez vous connecter pour continuer",
      actionText: "Pas encore de compte ?",
      actionLink: "S'inscrire",
    },
    password: {
      ...frFR.signIn?.password,
      subtitle: "Entrez le mot de passe associé à votre compte",
    },
    forgotPasswordAlternativeMethods: {
      ...frFR.signIn?.forgotPasswordAlternativeMethods,
      label__alternativeMethods: "Ou, se connecter avec une autre méthode",
    },
    resetPassword: {
      ...frFR.signIn?.resetPassword,
      title: "Définir un nouveau mot de passe",
    },
    termsAndPrivacyNotice: {
      title: 'En vous inscrivant ou en vous connectant, vous acceptez les Conditions d\'utilisation et la Politique de confidentialité de X-me.',
    },
  },
  signUp: {
    ...frFR.signUp,
    start: {
      ...frFR.signUp?.start,
      title: "Créer un compte",
      subtitle: "Inscrivez-vous pour accéder à X-me",
      actionText: "Déjà un compte ?",
      actionLink: "Se connecter",
    },
    continue: {
      ...frFR.signUp?.continue,
      subtitle: "Veuillez remplir les informations restantes pour continuer.",
      actionText: "Déjà un compte ?",
    },
    termsAndPrivacyNotice: {
      title: 'En vous inscrivant ou en vous connectant, vous acceptez les Conditions d\'utilisation et la Politique de confidentialité de X-me.',
    },
  },
  userProfile: {
    ...frFR.userProfile,
    start: {
      ...frFR.userProfile?.start,
      headerTitle__account: "Profil",
    }
  },
  formFieldLabel__emailAddress: "Adresse email",
  formFieldLabel__password: "Mot de passe",
  formButtonPrimary__verify: "Vérifier",
  formButtonPrimary: "Continuer",
  // Messages d'erreur personnalisés
  unstable__errors: {
    ...frFR.unstable__errors,
    form_identifier_exists__email_address: "Cette adresse email est déjà utilisée par un autre compte.",
    form_identifier_exists__username: "Ce nom d'utilisateur est déjà pris.",
    form_identifier_exists__phone_number: "Ce numéro de téléphone est déjà associé à un compte.",
    form_param_format_invalid__phone_number: "Le numéro de téléphone doit être au format international valide.",
    form_password_length_too_short: "Le mot de passe doit contenir au moins 8 caractères.",
    form_password_no_match: "Les mots de passe ne correspondent pas.",
    form_param_invalid: "Certaines informations saisies ne sont pas valides.",
    form_param_missing: "Veuillez remplir tous les champs obligatoires.",
    network_error: "Erreur de connexion réseau. Veuillez vérifier votre connexion internet.",
    form_identifier_not_found: "Aucun compte trouvé avec ces identifiants.",
    form_password_incorrect: "Le mot de passe est incorrect.",
    form_code_incorrect: "Le code est incorrect.",
    form_expired_code: "Le code a expiré, veuillez en demander un nouveau.",
    form_password_validation_failed: "Votre mot de passe doit contenir au moins 8 caractères, un chiffre et une lettre majuscule.",
    not_allowed_access: "Accès non autorisé. Veuillez vous connecter avec un compte valide.",
    session_exists: "Vous êtes déjà connecté. Veuillez vous déconnecter avant de créer un nouveau compte.",
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
          publishableKey={publishableKey}
          localization={customFrenchLocalizations}
          appearance={{
            variables: {
              colorPrimary: '#d97706',
              colorTextOnPrimaryBackground: '#ffffff',
              colorBackground: '#F5F5EC',
              colorText: '#1E293B',
              colorDanger: '#EF4444',
              colorSuccess: '#10B981',
              fontFamily: 'inherit',
              borderRadius: '0.5rem',
            },
            elements: {
              formButtonPrimary: {
                backgroundColor: '#d97706',
                color: 'white',
                fontWeight: 600,
                borderRadius: '0.5rem',
                '&:hover': {
                  backgroundColor: '#b45309'
                }
              },
              card: {
                boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)',
                borderRadius: '0.75rem',
              },
              formFieldInput: {
                borderRadius: '0.5rem',
              },
              footer: {
                '& a': {
                  color: '#d97706',
                }
              },
              headerSubtitle: {
                color: '#4B5563',
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
      </body>
    </html>
  );
}