'use client';

import { useSignIn } from '@clerk/nextjs';
import { useState, FormEvent } from 'react';
import { useTheme } from 'next-themes';
import Link from 'next/link';

export default function CustomSignIn() {
  const { isLoaded, signIn, setActive } = useSignIn();
  const [emailAddress, setEmailAddress] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isPasswordShown, setIsPasswordShown] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [code, setCode] = useState('');
  const [step, setStep] = useState<'start' | 'password' | 'code' | 'forgot'>('start');
  const { theme } = useTheme();

  // Si Clerk n'est pas encore chargé
  if (!isLoaded || !signIn) {
    return <div className="animate-pulse rounded-md bg-gray-200 dark:bg-gray-700 h-64 w-full max-w-md mx-auto"></div>;
  }

  // Gérer la soumission du formulaire initial
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!emailAddress) {
      setErrorMessage('Veuillez entrer votre adresse email.');
      return;
    }

    try {
      // Commencer le processus de connexion
      const result = await signIn.create({
        identifier: emailAddress
      });

      // Vérifier quelle méthode est disponible
      const supportedFactors = result.supportedFirstFactors || [];
      
      if (supportedFactors.some(factor => factor.strategy === 'password')) {
        setStep('password');
      } else if (supportedFactors.some(factor => factor.strategy === 'email_code')) {
        // Utiliser la vérification par code email
        const emailCodeFactor = supportedFactors.find(
          factor => factor.strategy === 'email_code'
        );
        
        if (emailCodeFactor && 'emailAddressId' in emailCodeFactor) {
          // Envoyer le code
          await signIn.prepareFirstFactor({
            strategy: 'email_code',
            emailAddressId: emailCodeFactor.emailAddressId as string
          });
          setStep('code');
        }
      }
    } catch (err: any) {
      console.error('Erreur de connexion:', err);
      setErrorMessage(err.errors?.[0]?.message || 'Une erreur est survenue lors de la connexion.');
    }
  };

  // Gérer la vérification par mot de passe
  const handlePasswordSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!password) {
      setErrorMessage('Veuillez entrer votre mot de passe.');
      return;
    }

    try {
      const result = await signIn.attemptFirstFactor({
        strategy: 'password',
        password
      });

      if (result.status === 'complete') {
        // La connexion est réussie, mettre à jour la session
        await setActive({ session: result.createdSessionId });
        window.location.href = '/'; // Rediriger vers la page d'accueil
      }
    } catch (err: any) {
      console.error('Erreur de mot de passe:', err);
      setErrorMessage(
        err.errors?.[0]?.longMessage || 
        err.errors?.[0]?.message || 
        'Mot de passe incorrect. Veuillez réessayer.'
      );
    }
  };

  // Gérer la vérification par code
  const handleCodeSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setVerifying(true);

    if (!code) {
      setErrorMessage('Veuillez entrer le code de vérification.');
      setVerifying(false);
      return;
    }

    try {
      const result = await signIn.attemptFirstFactor({
        strategy: 'email_code',
        code
      });

      if (result.status === 'complete') {
        // La connexion est réussie, mettre à jour la session
        await setActive({ session: result.createdSessionId });
        window.location.href = '/'; // Rediriger vers la page d'accueil
      }
    } catch (err: any) {
      console.error('Erreur de code:', err);
      setErrorMessage(
        err.errors?.[0]?.longMessage || 
        err.errors?.[0]?.message || 
        'Code invalide. Veuillez réessayer.'
      );
    } finally {
      setVerifying(false);
    }
  };

  // Renvoyer le code
  const resendCode = async () => {
    try {
      // Récupérer l'ID d'email depuis la vérification actuelle
      const verificationData = signIn.firstFactorVerification || {};
      const emailAddressId = 'emailAddressId' in verificationData 
        ? verificationData.emailAddressId as string 
        : '';
      
      if (!emailAddressId) {
        setErrorMessage('Impossible de renvoyer le code. Veuillez réessayer.');
        return;
      }
      
      await signIn.prepareFirstFactor({
        strategy: 'email_code',
        emailAddressId
      });
      
      setErrorMessage('');
      // Montrer un message de succès temporaire
      const tempMessage = document.createElement('div');
      tempMessage.className = 'text-green-500 text-sm mt-2 transition-opacity duration-300';
      tempMessage.textContent = 'Un nouveau code a été envoyé à votre adresse email.';
      document.getElementById('code-container')?.appendChild(tempMessage);
      
      setTimeout(() => {
        tempMessage.style.opacity = '0';
        setTimeout(() => tempMessage.remove(), 300);
      }, 3000);
    } catch (err: any) {
      console.error('Erreur lors du renvoi du code:', err);
      setErrorMessage('Erreur lors du renvoi du code. Veuillez réessayer.');
    }
  };

  // Réinitialiser le mot de passe
  const handleForgotPassword = () => {
    setStep('forgot');
  };

  const startForgotPasswordFlow = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!emailAddress) {
      setErrorMessage('Veuillez entrer votre adresse email.');
      return;
    }

    try {
      await signIn.create({ identifier: emailAddress });
      
      const supportedFactors = signIn.supportedFirstFactors || [];
      const supportedResetPasswordFactors = supportedFactors.filter(factor => 
        factor.strategy === 'reset_password_email_code' || 
        factor.strategy === 'reset_password_phone_code'
      );

      if (supportedResetPasswordFactors.length > 0) {
        const factor = supportedResetPasswordFactors[0];
        
        if (factor.strategy === 'reset_password_email_code' && 'emailAddressId' in factor) {
          await signIn.prepareFirstFactor({
            strategy: 'reset_password_email_code',
            emailAddressId: factor.emailAddressId as string
          });
          
          setErrorMessage('');
          setStep('code');
        }
      } else {
        setErrorMessage('Aucune méthode de réinitialisation de mot de passe disponible pour ce compte.');
      }
    } catch (error: any) {
      console.error('Erreur de réinitialisation de mot de passe:', error);
      setErrorMessage(
        error.errors?.[0]?.longMessage || 
        error.errors?.[0]?.message || 
        'Une erreur est survenue lors de la réinitialisation de mot de passe.'
      );
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-white dark:bg-[#1E293B] shadow-lg rounded-lg p-6 w-full">
        {/* Titre */}
        {step === 'start' && (
          <div className="mb-6 text-center">
            <h2 className="text-2xl font-bold text-black dark:text-white">
              Connexion à X-me
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Entrez votre adresse email pour vous connecter
            </p>
          </div>
        )}
        
        {step === 'password' && (
          <div className="mb-6 text-center">
            <h2 className="text-2xl font-bold text-black dark:text-white">
              Entrez votre mot de passe
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Mot de passe pour {emailAddress}
            </p>
          </div>
        )}
        
        {step === 'code' && (
          <div className="mb-6 text-center">
            <h2 className="text-2xl font-bold text-black dark:text-white">
              Vérification par code
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Entrez le code envoyé à {emailAddress}
            </p>
          </div>
        )}
        
        {step === 'forgot' && (
          <div className="mb-6 text-center">
            <h2 className="text-2xl font-bold text-black dark:text-white">
              Réinitialiser votre mot de passe
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Nous vous enverrons un lien pour réinitialiser votre mot de passe
            </p>
          </div>
        )}
        
        {/* Message d'erreur */}
        {errorMessage && (
          <div className="bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 p-3 rounded-md text-sm mb-4">
            {errorMessage}
          </div>
        )}
        
        {/* Formulaire de démarrage */}
        {step === 'start' && (
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Adresse email
              </label>
              <input
                id="email"
                type="email"
                value={emailAddress}
                onChange={(e) => setEmailAddress(e.target.value)}
                className="bg-gray-50 dark:bg-[#374151] border border-gray-300 dark:border-gray-600 text-black dark:text-white rounded-md w-full p-2.5"
                placeholder="nom@exemple.com"
              />
            </div>
            
            <button 
              type="submit" 
              className="bg-amber-600 hover:bg-amber-700 text-white rounded-md text-sm font-medium transition-colors w-full py-2.5"
            >
              Continuer
            </button>
            
            <div className="mt-4 text-center text-sm">
              <span className="text-gray-600 dark:text-gray-400">Pas encore de compte ? </span>
              <Link href="/sign-up" className="text-blue-500 hover:text-blue-400">
                S&apos;inscrire
              </Link>
            </div>
          </form>
        )}
        
        {/* Formulaire de mot de passe */}
        {step === 'password' && (
          <form onSubmit={handlePasswordSubmit}>
            <div className="mb-4">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Mot de passe
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={isPasswordShown ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-gray-50 dark:bg-[#374151] border border-gray-300 dark:border-gray-600 text-black dark:text-white rounded-md w-full p-2.5"
                />
                <button
                  type="button"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500"
                  onClick={() => setIsPasswordShown(!isPasswordShown)}
                >
                  {isPasswordShown ? 'Masquer' : 'Afficher'}
                </button>
              </div>
            </div>
            
            <button 
              type="submit" 
              className="bg-amber-600 hover:bg-amber-700 text-white rounded-md text-sm font-medium transition-colors w-full py-2.5"
            >
              Se connecter
            </button>
            
            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={handleForgotPassword}
                className="text-blue-500 hover:text-blue-400 text-sm"
              >
                Mot de passe oublié ?
              </button>
            </div>
            
            <div className="mt-2 text-center">
              <button
                type="button"
                onClick={() => setStep('start')}
                className="text-gray-500 hover:text-gray-400 text-sm"
              >
                Retour
              </button>
            </div>
          </form>
        )}
        
        {/* Formulaire de code */}
        {step === 'code' && (
          <form onSubmit={handleCodeSubmit} id="code-container">
            <div className="mb-4">
              <label htmlFor="code" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Code de vérification
              </label>
              <input
                id="code"
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="bg-gray-50 dark:bg-[#374151] border border-gray-300 dark:border-gray-600 text-black dark:text-white rounded-md w-full p-2.5"
                placeholder="Code à 6 chiffres"
              />
            </div>
            
            <button 
              type="submit" 
              className="bg-amber-600 hover:bg-amber-700 text-white rounded-md text-sm font-medium transition-colors w-full py-2.5"
              disabled={verifying}
            >
              {verifying ? 'Vérification...' : 'Vérifier'}
            </button>
            
            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={resendCode}
                className="text-blue-500 hover:text-blue-400 text-sm"
              >
                Renvoyer le code
              </button>
            </div>
            
            <div className="mt-2 text-center">
              <button
                type="button"
                onClick={() => setStep('start')}
                className="text-gray-500 hover:text-gray-400 text-sm"
              >
                Retour
              </button>
            </div>
          </form>
        )}
        
        {/* Formulaire de réinitialisation de mot de passe */}
        {step === 'forgot' && (
          <form onSubmit={startForgotPasswordFlow}>
            <div className="mb-4">
              <label htmlFor="forgot-email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Adresse email
              </label>
              <input
                id="forgot-email"
                type="email"
                value={emailAddress}
                onChange={(e) => setEmailAddress(e.target.value)}
                className="bg-gray-50 dark:bg-[#374151] border border-gray-300 dark:border-gray-600 text-black dark:text-white rounded-md w-full p-2.5"
                placeholder="nom@exemple.com"
              />
            </div>
            
            <button 
              type="submit" 
              className="bg-amber-600 hover:bg-amber-700 text-white rounded-md text-sm font-medium transition-colors w-full py-2.5"
            >
              Envoyer les instructions
            </button>
            
            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={() => setStep('start')}
                className="text-gray-500 hover:text-gray-400 text-sm"
              >
                Retour à la connexion
              </button>
            </div>
          </form>
        )}
      </div>
      
      <div className="mt-6 text-center text-xs text-gray-500 dark:text-gray-400">
        En vous inscrivant ou en vous connectant, vous acceptez les{' '}
        <Link href="/terms" className="text-blue-500 hover:text-blue-400" target="_blank" rel="noopener noreferrer">
          Conditions d&apos;Utilisation
        </Link>{' '}
        et la{' '}
        <Link href="/privacy" className="text-blue-500 hover:text-blue-400" target="_blank" rel="noopener noreferrer">
          Politique de Confidentialité
        </Link>{' '}
        de X-me.
      </div>
    </div>
  );
} 