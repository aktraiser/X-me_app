// Script pour forcer la traduction en français de Clerk
(function() {
  console.log('[Clerk Translation Helper] Script chargé');

  // Attendre que Clerk soit complètement chargé
  const checkClerk = setInterval(function() {
    if (window.Clerk && window.Clerk.loaded) {
      clearInterval(checkClerk);
      console.log('[Clerk Translation Helper] Clerk détecté');

      // Définir explicitement la locale
      try {
        // Méthode 1: API publique setLocale
        if (window.Clerk.setLocale) {
          window.Clerk.setLocale('fr-FR');
          console.log('[Clerk Translation Helper] Méthode setLocale appliquée');
        }

        // Méthode 2: Méthode interne __unstable_updateProps
        if (window.Clerk.__unstable_updateProps) {
          const frFR = {
            locale: 'fr-FR',
            // Textes principaux
            signIn: {
              start: {
                title: 'Connexion',
                subtitle: 'pour continuer sur Xandme',
                actionText: 'Vous n\'avez pas de compte ?',
                actionLink: 'S\'inscrire'
              },
              password: {
                title: 'Entrez votre mot de passe',
                subtitle: 'pour continuer sur Xandme',
                actionLink: 'Utiliser une autre méthode'
              }
            },
            signUp: {
              start: {
                title: 'Créer un compte',
                subtitle: 'pour continuer sur Xandme',
                actionText: 'Vous avez déjà un compte ?',
                actionLink: 'Se connecter'
              }
            },
            userButton: {
              action__signOut: 'Déconnexion',
              action__manageAccount: 'Gérer mon compte'
            },
            socialButtonsBlockButton: 'Continuer avec {{provider}}',
            dividerText: 'ou',
            footerActionLink__help: 'Aide',
            footerActionLink__privacy: 'Confidentialité',
            footerActionLink__terms: 'Conditions',
            formButtonPrimary: 'Continuer',
            formButtonReset: 'Annuler',
            formFieldLabel__emailAddress: 'Adresse e-mail',
            formFieldLabel__phoneNumber: 'Numéro de téléphone',
            formFieldLabel__password: 'Mot de passe',
            formFieldLabel__firstName: 'Prénom',
            formFieldLabel__lastName: 'Nom',
            formFieldLabel__username: 'Nom d\'utilisateur',
            formFieldAction__forgotPassword: 'Mot de passe oublié ?'
          };

          window.Clerk.__unstable_updateProps({ localization: frFR });
          console.log('[Clerk Translation Helper] Méthode __unstable_updateProps appliquée');
        }

        // Méthode 3: Tenter de remplacer les traductions directement dans le DOM
        setTimeout(function() {
          // Cibler les textes communs par leur contenu
          const textReplacements = {
            'Sign in': 'Connexion',
            'Sign up': 'S\'inscrire',
            'Continue': 'Continuer',
            'Email address': 'Adresse e-mail',
            'Password': 'Mot de passe',
            'Forgot password?': 'Mot de passe oublié ?',
            'Don\'t have an account?': 'Vous n\'avez pas de compte ?',
            'Already have an account?': 'Vous avez déjà un compte ?',
            'Sign out': 'Déconnexion',
            'Manage account': 'Gérer mon compte',
            'or': 'ou'
          };

          // Remplacer tous les textes dans le DOM
          Object.entries(textReplacements).forEach(([en, fr]) => {
            const elements = document.evaluate(
              `//*[text()='${en}']`,
              document,
              null,
              XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE,
              null
            );

            for (let i = 0; i < elements.snapshotLength; i++) {
              const element = elements.snapshotItem(i);
              if (element.textContent === en) {
                element.textContent = fr;
                console.log(`[Clerk Translation Helper] Remplacé "${en}" par "${fr}"`);
              }
            }
          });
        }, 1000);

      } catch (error) {
        console.error('[Clerk Translation Helper] Erreur:', error);
      }
    }
  }, 500);

  // Arrêter la vérification après 30 secondes pour éviter de boucler indéfiniment
  setTimeout(() => clearInterval(checkClerk), 30000);
})(); 