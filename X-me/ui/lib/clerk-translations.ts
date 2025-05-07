import { frFR } from '@clerk/localizations/fr-FR';

// Traductions personnalisées pour corriger les problèmes de traduction
export const customFrenchTranslations = {
  ...frFR,
  formFieldLabel__emailAddress: 'Adresse email',
  formFieldLabel__password: 'Mot de passe',
  formFieldLabel__firstName: 'Prénom',
  formFieldLabel__lastName: 'Nom',
  formFieldLabel__phoneNumber: 'Numéro de téléphone',
  formButtonPrimary: 'Continuer',
  signIn: {
    ...frFR.signIn,
    phoneCode: {
      ...frFR.signIn?.phoneCode,
      formTitle: 'Code de vérification',
      formSubtitle: 'Entrez le code de vérification envoyé à votre téléphone'
    },
    start: {
      ...frFR.signIn?.start,
      title: 'Connexion',
      subtitle: 'pour continuer sur X-me'
    }
  }
};

export default customFrenchTranslations; 