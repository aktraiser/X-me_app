'use client';

import { useEffect, useState } from 'react';
import { Session } from '@supabase/supabase-js';
import { createBrowserClient } from '@supabase/ssr';
import { Loader } from 'rsuite';
import LoginForm from '@/components/auth/LoginForm';
import SignUpForm from '@/components/auth/SignUpForm';

// Créer le client Supabase
const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

function Login() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(false);
  const [isLoginMode, setIsLoginMode] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) return <Loader center content="loading" />;

  return (
    <div className="min-h-screen bg-gray-900">
      {!session ? (
        <div className="container mx-auto px-4">
          {isLoginMode ? (
            <LoginForm onToggleMode={() => setIsLoginMode(false)} />
          ) : (
            <SignUpForm onToggleMode={() => setIsLoginMode(true)} />
          )}
        </div>
      ) : (
        <div className="container mx-auto px-4 py-8 text-center">
          <p className="text-white mb-4">Welcome back {session.user.email}</p>
          <button
            onClick={async () => {
              await supabase.auth.signOut();
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Logout
          </button>
        </div>
      )}
    </div>
  );
}

export default Login;