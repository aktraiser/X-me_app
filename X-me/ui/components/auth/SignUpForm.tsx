'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Eye, EyeOff, Sun, Moon, Check, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/components';
import { toast } from 'react-hot-toast';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';

interface SignUpFormProps {
  onToggleMode: () => void;
}

export default function SignUpForm({ onToggleMode }: SignUpFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [credentials, setCredentials] = useState({
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();
  
  // État pour les validations du mot de passe
  const [passwordValidation, setPasswordValidation] = useState({
    minLength: false,
    hasLowercase: false,
    hasUppercase: false,
    hasNumber: false,
    hasSpecialChar: false
  });

  const supabase = createClient();

  // Éviter les erreurs d'hydratation
  useEffect(() => {
    setMounted(true);
  }, []);

  // Vérifier si l'utilisateur est déjà connecté
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        router.replace('/');
      }
    };
    checkSession();
  }, [router, supabase.auth]);

  // Vérifier la force du mot de passe
  useEffect(() => {
    const password = credentials.password;
    setPasswordValidation({
      minLength: password.length >= 6,
      hasLowercase: /[a-z]/.test(password),
      hasUppercase: /[A-Z]/.test(password),
      hasNumber: /[0-9]/.test(password),
      hasSpecialChar: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)
    });
  }, [credentials.password]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!credentials.email || !credentials.phone || !credentials.password || !credentials.confirmPassword) {
      toast.error('Veuillez remplir tous les champs');
      return;
    }

    if (credentials.password !== credentials.confirmPassword) {
      toast.error('Les mots de passe ne correspondent pas');
      return;
    }

    if (credentials.password.length < 6) {
      toast.error('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    // Validation du numéro de téléphone avec regex
    const phoneRegex = /^(\+\d{1,3}\s?)?\(?\d{1,4}\)?[\s.-]?\d{1,4}[\s.-]?\d{1,9}$/;
    if (!phoneRegex.test(credentials.phone)) {
      toast.error('Veuillez entrer un numéro de téléphone valide');
      return;
    }

    setIsLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email: credentials.email.trim(),
        password: credentials.password.trim(),
        options: {
          data: {
            phone: credentials.phone.trim()
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      });

      if (error) throw error;

      if (data?.user) {
        toast.success('Compte créé avec succès! Veuillez vérifier votre e-mail pour confirmer votre compte.');
        router.replace('/auth/verify-email');
      }
    } catch (error) {
      console.error('Erreur d\'inscription:', error);
      if (error instanceof Error) {
        if (error.message.includes('User already registered')) {
          toast.error('Un compte avec cet e-mail existe déjà');
        } else {
          toast.error(error.message);
        }
      } else {
        toast.error('Une erreur s\'est produite lors de l\'inscription');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      });

      if (error) throw error;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Échec de l\'inscription avec Google');
    }
  };

  const ThemeSwitcher = () => {
    if (!mounted) return null;
    
    return (
      <button
        onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        className="p-2 rounded-full bg-light-secondary dark:bg-dark-secondary text-black dark:text-white hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
        aria-label={theme === 'dark' ? 'Passer au mode clair' : 'Passer au mode sombre'}
      >
        {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
      </button>
    );
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="absolute top-4 right-4">
        <ThemeSwitcher />
      </div>
      
      <div className="w-full max-w-md space-y-6">
        {/* Logo et titre */}
        <div className="flex flex-col items-center space-y-4">
          <div className="w-28 h-28 flex items-center justify-center">
            <Image 
              src="/images/logo.svg" 
              alt="X-ME Logo" 
              width={100} 
              height={100}
              className="w-full h-auto"
              priority
            />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-bold text-black dark:text-white">
              Créez votre compte
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Rejoignez la sphère de l&apos;entrepreneuriat
            </p>
          </div>
        </div>
        
        {/* Card du formulaire */}
        <div className="bg-white dark:bg-[#1E293B] rounded-xl shadow-lg overflow-hidden">
          <div className="p-6">
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email input */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Adresse e-mail
                </label>
                <input
                  id="email"
                  type="email"
                  placeholder="Entrez votre adresse e-mail"
                  className="w-full px-4 py-3 rounded-lg bg-gray-50 dark:bg-[#374151] text-black dark:text-white border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={credentials.email}
                  onChange={(e) => setCredentials({ ...credentials, email: e.target.value })}
                  disabled={isLoading}
                  required
                />
              </div>

              {/* Phone input */}
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Numéro de téléphone
                </label>
                <input
                  id="phone"
                  type="tel"
                  placeholder="Entrez votre numéro de téléphone"
                  className="w-full px-4 py-3 rounded-lg bg-gray-50 dark:bg-[#374151] text-black dark:text-white border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={credentials.phone}
                  onChange={(e) => setCredentials({ ...credentials, phone: e.target.value })}
                  disabled={isLoading}
                  required
                />
              </div>

              {/* Password input */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Mot de passe
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Créez un mot de passe"
                    className="w-full px-4 py-3 rounded-lg bg-gray-50 dark:bg-[#374151] text-black dark:text-white border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={credentials.password}
                    onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                    disabled={isLoading}
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                    disabled={isLoading}
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Votre mot de passe doit respecter les critères suivants:
                </p>
                <ul className="mt-2 space-y-1">
                  <li className="flex items-center text-xs text-gray-700 dark:text-gray-300">
                    <span className={cn("mr-2", passwordValidation.minLength ? "text-green-500" : "text-gray-400")}>
                      {passwordValidation.minLength ? <Check size={14} strokeWidth={3} /> : <X size={14} />}
                    </span>
                    Au moins 6 caractères
                  </li>
                  <li className="flex items-center text-xs text-gray-700 dark:text-gray-300">
                    <span className={cn("mr-2", passwordValidation.hasLowercase ? "text-green-500" : "text-gray-400")}>
                      {passwordValidation.hasLowercase ? <Check size={14} strokeWidth={3} /> : <X size={14} />}
                    </span>
                    Au moins une lettre minuscule
                  </li>
                  <li className="flex items-center text-xs text-gray-700 dark:text-gray-300">
                    <span className={cn("mr-2", passwordValidation.hasUppercase ? "text-green-500" : "text-gray-400")}>
                      {passwordValidation.hasUppercase ? <Check size={14} strokeWidth={3} /> : <X size={14} />}
                    </span>
                    Au moins une lettre majuscule
                  </li>
                  <li className="flex items-center text-xs text-gray-700 dark:text-gray-300">
                    <span className={cn("mr-2", passwordValidation.hasNumber ? "text-green-500" : "text-gray-400")}>
                      {passwordValidation.hasNumber ? <Check size={14} strokeWidth={3} /> : <X size={14} />}
                    </span>
                    Au moins un chiffre
                  </li>
                  <li className="flex items-center text-xs text-gray-700 dark:text-gray-300">
                    <span className={cn("mr-2", passwordValidation.hasSpecialChar ? "text-green-500" : "text-gray-400")}>
                      {passwordValidation.hasSpecialChar ? <Check size={14} strokeWidth={3} /> : <X size={14} />}
                    </span>
                    Au moins un caractère spécial
                  </li>
                </ul>
              </div>

              {/* Confirm Password input */}
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Confirmation du mot de passe
                </label>
                <input
                  id="confirmPassword"
                  type={showPassword ? "text" : "password"}
                  placeholder="Confirmez votre mot de passe"
                  className="w-full px-4 py-3 rounded-lg bg-gray-50 dark:bg-[#374151] text-black dark:text-white border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={credentials.confirmPassword}
                  onChange={(e) => setCredentials({ ...credentials, confirmPassword: e.target.value })}
                  disabled={isLoading}
                  required
                  minLength={6}
                />
              </div>

              {/* Signup button */}
              <button
                type="submit"
                className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isLoading}
              >
                {isLoading ? 'Création du compte...' : 'Créer un compte'}
              </button>

              {/* Terms and Privacy */}
              <div className="mt-4 text-xs text-center text-gray-600 dark:text-gray-400">
                En vous inscrivant ou en vous connectant, vous acceptez les{' '}
                <Link href="/conditions-utilisation" className="text-blue-500 hover:underline">
                  Conditions d&apos;utilisation
                </Link>{' '}
                et la{' '}
                <Link href="/politique-confidentialite" className="text-blue-500 hover:underline">
                  Politique de confidentialité
                </Link>{' '}
                de X-ME.
              </div>
            </form>
          </div>
          
          {/* Footer du card avec lien de connexion */}
          <div className="bg-gray-50 dark:bg-[#2D3748] p-4 text-center border-t border-gray-200 dark:border-gray-700">
            <button 
              type="button"
              onClick={onToggleMode}
              className="text-blue-500 hover:text-blue-400"
            >
              Vous avez déjà un compte? Connectez-vous
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 