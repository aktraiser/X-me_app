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

// Personnalisation de certains éléments
const customLocalization = {
  ...frFR,
  signIn: {
    ...(frFR.signIn || {}),
    phoneCode: {
      ...(frFR.signIn?.phoneCode || {}),
      title: "Vérifiez votre numéro de téléphone (obligatoire)",
      subtitle: "Un code de vérification a été envoyé au {identifier}",
    },
    start: {
      ...(frFR.signIn?.start || {}),
      title: "Connexion à X-me",
      subtitle: "Pour continuer sur X-me",
      actionText: "Pas encore inscrit ?",
      actionLink: "Créer un compte",
    },
    emailCode: {
      ...(frFR.signIn?.emailCode || {}),
      title: "Vérifiez votre email (obligatoire)",
      subtitle: "Un code de vérification a été envoyé à {identifier}",
    },
    password: {
      ...(frFR.signIn?.password || {}),
      title: "Entrez votre mot de passe",
      subtitle: "Pour vous connecter à {identifier}",
      actionText: "Mot de passe oublié ?",
      actionLink: "Réinitialiser",
    },
    alternativeMethods: {
      ...(frFR.signIn?.alternativeMethods || {}),
      title: "Utiliser une autre méthode",
      subtitle: "Choisissez une autre méthode pour vous connecter",
      actionLink: "Retour",
    },
    forgotPassword: {
      ...(frFR.signIn?.forgotPassword || {}),
      title: "Réinitialiser votre mot de passe",
      subtitle: "Nous vous enverrons un lien pour réinitialiser votre mot de passe",
      formTitle: "Code de réinitialisation",
      formSubtitle: "Entrez le code de réinitialisation envoyé à {identifier}",
      resendButton: "Renvoyer le code",
    },
    resetPassword: {
      ...(frFR.signIn?.resetPassword || {}),
      title: "Créez un nouveau mot de passe",
      subtitle: "Pour {identifier}",
      actionText: "",
      actionLink: "",
    },
    termsAndPrivacyNotice: {
      title: 'En vous inscrivant ou en vous connectant, vous acceptez les Conditions d\'utilisation et la Politique de confidentialité de X-me.',
    },
  },
  signUp: {
    ...(frFR.signUp || {}),
    start: {
      ...(frFR.signUp?.start || {}),
      title: "Créer un compte X-me",
      subtitle: "Pour commencer à utiliser X-me",
      actionText: "Vous avez déjà un compte ?",
      actionLink: "Se connecter",
    },
    emailCode: {
      ...(frFR.signUp?.emailCode || {}),
      title: "Vérifiez votre email (obligatoire)",
      subtitle: "Un code de vérification a été envoyé à {identifier}",
    },
    emailLink: {
      ...(frFR.signUp?.emailLink || {}),
      title: "Vérifiez votre email (obligatoire)",
      subtitle: "Un lien de vérification a été envoyé à {identifier}",
    },
    phoneCode: {
      ...(frFR.signUp?.phoneCode || {}),
      title: "Vérifiez votre numéro de téléphone (obligatoire)",
      subtitle: "Un code de vérification a été envoyé au {identifier}",
    },
    continue: {
      ...(frFR.signUp?.continue || {}),
      title: "Complétez votre profil",
      subtitle: "Pour finir la création de votre compte",
    },
    termsAndPrivacyNotice: {
      title: 'En vous inscrivant ou en vous connectant, vous acceptez les Conditions d\'utilisation et la Politique de confidentialité de X-me.',
    },
  },
  unstable__errors: {
    ...(frFR.unstable__errors || {}),
    // Erreurs Sign-In (documentés dans https://clerk.com/docs/errors/sign-in)
    session_exists: "Vous êtes actuellement en mode session unique. Vous ne pouvez être connecté qu'à un seul compte à la fois.",
    identifier_already_signed_in: "Vous êtes déjà connecté. Veuillez d'abord vous déconnecter.",
    account_transfer_invalid: "Transfert de compte non valide. Il n'y a pas de compte à transférer.",
    client_state_invalid: "Action non valide. Nous n'avons pas pu compléter cette action. Veuillez réessayer.",
    strategy_for_user_invalid: "La stratégie de vérification n'est pas valide pour ce compte.",
    identification_claimed: "Un ou plusieurs identifiants de cette inscription ont été connectés à un utilisateur différent. Veuillez vous inscrire à nouveau.",
    resource_forbidden: "Les opérations de mise à jour ne sont pas autorisées sur les connexions plus anciennes.",
    resource_not_found: "Aucune connexion trouvée avec cet identifiant.",
    no_second_factors: "Aucun deuxième facteur trouvé pour cette stratégie.",
    sign_in_no_identification_for_user: "Le jeton fourni n'a pas d'identification associée pour l'utilisateur qui l'a créé.",
    sign_in_identification_or_user_deleted: "L'utilisateur ou l'identification sélectionnée a été supprimé. Veuillez recommencer.",
    
    // Erreurs communes
    form_identifier_exists__email_address: "Cette adresse email est déjà utilisée par un autre compte.",
    form_identifier_exists__username: "Ce nom d'utilisateur est déjà pris.",
    form_identifier_exists__phone_number: "Ce numéro de téléphone est déjà associé à un compte.",
    form_param_format_invalid__phone_number: "Le numéro de téléphone doit être au format international valide.",
    form_password_length_too_short: "Le mot de passe doit contenir au moins 8 caractères.",
    form_password_no_match: "Les mots de passe ne correspondent pas.",
    form_param_invalid: "Certaines informations saisies ne sont pas valides.",
    form_params_invalid: "Les informations saisies contiennent des erreurs. Veuillez vérifier tous les champs obligatoires.",
    form_param_missing: "Veuillez remplir tous les champs obligatoires.",
    network_error: "Erreur de connexion réseau. Veuillez vérifier votre connexion internet.",
    form_identifier_not_found: "Aucun compte trouvé avec ces identifiants.",
    form_password_incorrect: "Le mot de passe est incorrect.",
    form_code_incorrect: "Le code est incorrect.",
    form_expired_code: "Le code a expiré, veuillez en demander un nouveau.",
    form_password_validation_failed: "Votre mot de passe doit contenir au moins 8 caractères, un chiffre et une lettre majuscule.",
    not_allowed_access: "Accès non autorisé. Veuillez vous connecter avec un compte valide.",
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
