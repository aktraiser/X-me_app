'use client';

import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import Link from 'next/link';
import { useAuth } from '@/lib/hooks/useAuth'

export default function LoginForm() {
  const { signIn, loading } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast.error('Veuillez remplir tous les champs');
      return;
    }

    await signIn(email, password);
  };

  return (
    <div className="w-full space-y-8">
      {/* Logo */}
      <div className="flex flex-col items-center space-y-6">
        <div className="w-16 h-16 bg-[#1E293B] rounded-2xl flex items-center justify-center">
          <span className="text-2xl font-bold">
            <span className="text-yellow-500">X</span>
            <span className="text-white">M</span>
          </span>
        </div>
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold text-white">
            Bienvenue sur la sphère de l&apos;entrepreneuriat
          </h1>
          <p className="text-gray-400">
            Connectez-vous ou inscrivez-vous pour continuer
          </p>
        </div>
      </div>

      {/* Login form */}
      <form onSubmit={handleSubmit} className="mt-8 space-y-6">
        {/* Email input */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
            Votre email
          </label>
          <input
            id="email"
            type="email"
            placeholder="Entrez votre email"
            className="w-full px-4 py-3 rounded-lg bg-[#1E293B] text-white border-none focus:ring-2 focus:ring-blue-500"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
            required
          />
        </div>

        {/* Password input */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <label htmlFor="password" className="block text-sm font-medium text-gray-300">
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
              className="w-full px-4 py-3 rounded-lg bg-[#1E293B] text-white border-none focus:ring-2 focus:ring-blue-500"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              required
              minLength={6}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300"
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

        {/* Sign up link */}
        <div className="text-center">
          <Link
            href="/signup"
            className="text-blue-500 hover:text-blue-400"
          >
            Je n&apos;ai pas de compte
          </Link>
        </div>
      </form>
    </div>
  );
} 