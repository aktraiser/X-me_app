// Importation directe depuis le package principal comme indiqué dans la documentation
import { frFR } from '@clerk/localizations';

// Traductions personnalisées pour corriger tous les problèmes de texte en anglais
export const customFrenchTranslations = {
  ...frFR,

  // Textes généraux
  signIn: {
    ...frFR.signIn,
    start: {
      ...frFR.signIn?.start,
      title: "Connexion",
      subtitle: "Bienvenue ! Veuillez vous connecter pour continuer",
      actionText: "Pas encore inscrit ?",
      actionLink: "Créer un compte",
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
  },
  
  // Labels des champs de formulaire - les clés spécifiques qui apparaissent en anglais
  formFieldLabel__emailAddress: "Adresse email",
  formFieldLabel__password: "Mot de passe",
  formFieldLabel__firstName: "Prénom",
  formFieldLabel__lastName: "Nom",
  formFieldLabel__phoneNumber: "Numéro de téléphone",
  formFieldLabel__username: "Nom d'utilisateur",
  
  // Textes pour les boutons
  formButtonPrimary: "Continuer", 
  userButton: {
    ...frFR.userButton,
    action__signOut: "Déconnexion",
  },
  
  // Le texte spécifique qui pose problème
  headerSubtitle: "Bienvenue ! Veuillez vous connecter pour continuer",
  
  // Autres textes qui peuvent poser problème
  socialButtonsBlockButton: "Continuer avec {{provider}}",
  footerActionLink: "Continuer",
  backButton: "Retour",
  
  // Messages d'erreur
  formFieldError__notYourEmailAddress: "Ce n'est pas votre adresse email ?",
  formFieldError__invalidEmail: "Adresse email invalide",
  formFieldError__unsupportedEmail: "Cette adresse email n'est pas supportée",
  formFieldError__invalidPassword: "Mot de passe invalide",
};

export default customFrenchTranslations; 