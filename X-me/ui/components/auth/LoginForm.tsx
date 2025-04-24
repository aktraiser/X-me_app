'use client';

import { useState, useEffect } from 'react';
import { Eye, EyeOff, Sun, Moon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import Link from 'next/link';
import Image from 'next/image';
import { createClient } from '@/utils/supabase/client';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';

interface LoginFormProps {
  onToggleMode: () => void;
}

export default function LoginForm({ onToggleMode }: LoginFormProps) {
  const supabase = createClient();
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();

  // Éviter les erreurs d'hydratation
  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password.trim(),
      });

      if (error) throw error;

      if (data?.session) {
        toast.success('Connexion réussie !');
        router.refresh();
        router.push('/');
      }
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('Invalid login credentials')) {
          toast.error('Email ou mot de passe incorrect');
        } else {
          toast.error(error.message);
        }
      }
    } finally {
      setLoading(false);
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
    <div className="min-h-screen flex flex-col items-center justify-center  p-4">
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
              Bienvenue sur la sphère de l&apos;entrepreneuriat
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Connectez-vous ou inscrivez-vous pour continuer
            </p>
          </div>
        </div>
        
        {/* Card du formulaire */}
        <div className="bg-white dark:bg-[#1E293B] rounded-xl shadow-lg overflow-hidden">
          <div className="p-6">
            <form onSubmit={handleSignIn} className="space-y-5">
              {/* Email input */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Votre email
                </label>
                <input
                  id="email"
                  type="email"
                  placeholder="Entrez votre email"
                  className="w-full px-4 py-3 rounded-lg bg-gray-50 dark:bg-[#374151] text-black dark:text-white border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  required
                />
              </div>

              {/* Password input */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Mot de passe
                  </label>
                  <Link href="/forgot-password" className="text-sm text-blue-500 hover:text-blue-400">
                    J&apos;ai oublié mon mot de passe
                  </Link>
                </div>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Entrez votre mot de passe"
                    className="w-full px-4 py-3 rounded-lg bg-gray-50 dark:bg-[#374151] text-black dark:text-white border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                    disabled={loading}
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              {/* Login button */}
              <button
                type="submit"
                className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={loading}
              >
                {loading ? 'Connexion en cours...' : 'Se connecter'}
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
          
          {/* Footer du card avec lien d'inscription */}
          <div className="bg-gray-50 dark:bg-[#2D3748] p-4 text-center border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={onToggleMode}
              className="text-blue-500 hover:text-blue-400"
            >
              Je n&apos;ai pas de compte
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 