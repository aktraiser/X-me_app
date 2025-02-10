'use client';

import { useState, useEffect } from 'react';
import { Moon, Sun, Edit2, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import PageHeader from '@/components/PageHeader';
import { useTheme } from 'next-themes';
import { useAuth } from '@/lib/hooks/useAuth';
import { toast } from 'react-hot-toast';
import { useUserPreferences } from '@/lib/hooks/useUserPreferences';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { useUser } from '@/lib/hooks/useUser';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('compte');
  const [language, setLanguage] = useState('French (Français)');
  const [semiAutoComplete, setSemiAutoComplete] = useState(true);
  const [aiDataRetention, setAiDataRetention] = useState(true);
  const [isThemeOpen, setIsThemeOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const { user, signOut, deleteAccount, loading: authLoading } = useAuth();
  const { profile, loading: profileLoading, updateProfile } = useUser();
  const { preferences, updatePreference, loading: prefsLoading } = useUserPreferences();

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      if (!user?.id) {
        toast.error('Utilisateur non identifié');
        return;
      }

      setLoading(true);
      if (!event.target.files || event.target.files.length === 0) {
        throw new Error('Vous devez sélectionner une image à télécharger');
      }

      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      await updateProfile({ avatar_url: publicUrl });
      toast.success('Avatar mis à jour avec succès');
    } catch (error: any) {
      if (error?.message === 'Bucket not found') {
        toast.error('Erreur de configuration du stockage');
      } else {
        toast.error('Erreur lors du téléchargement de l\'avatar');
      }
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFullNameUpdate = async (newFullName: string) => {
    const { error } = await updateProfile({ full_name: newFullName });
    if (error) {
      toast.error('Erreur lors de la mise à jour du nom');
    } else {
      toast.success('Nom mis à jour avec succès');
    }
  };

  const handlePhoneUpdate = async (newPhone: string) => {
    const { error } = await updateProfile({ phone: newPhone });
    if (error) {
      toast.error('Erreur lors de la mise à jour du téléphone');
    } else {
      toast.success('Téléphone mis à jour avec succès');
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success('Déconnexion réussie');
    } catch (error) {
      toast.error('Erreur lors de la déconnexion');
    }
  };

  const handleDeleteAccount = async () => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer votre compte ? Cette action est irréversible.')) {
      try {
        await deleteAccount();
        toast.success('Compte supprimé avec succès');
      } catch (error) {
        toast.error('Erreur lors de la suppression du compte');
      }
    }
  };

  const handleLanguageChange = async (value: string) => {
    await updatePreference('language', value);
  };

  const handleSemiAutoCompleteChange = async (value: boolean) => {
    await updatePreference('semi_auto_complete', value);
  };

  const handleAiDataRetentionChange = async (value: boolean) => {
    await updatePreference('ai_data_retention', value);
  };

  const handleAiModelChange = async (value: string) => {
    await updatePreference('ai_model', value);
  };

  const handleImageModelChange = async (value: string) => {
    await updatePreference('image_model', value);
  };

  if (authLoading || profileLoading || prefsLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <>
      <PageHeader
        title="Réglages"
        icon={<Settings className="w-6 h-6" />}
      />
      <main className="min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-8">
            <section>
              <h2 className="text-xl font-semibold mb-4">Général</h2>
              
              <div className="space-y-6 bg-dark-secondary rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-medium">Apparence</h3>
                    <p className="text-gray-400">Comment X&me apparaît sur votre appareil</p>
                  </div>
                  <div className="relative">
                    <button
                      onClick={() => setIsThemeOpen(!isThemeOpen)}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg bg-dark-primary text-white"
                    >
                      {theme === 'dark' ? (
                        <>
                          <Moon className="w-4 h-4" />
                          <span>Sombre</span>
                        </>
                      ) : (
                        <>
                          <Sun className="w-4 h-4" />
                          <span>Lumière</span>
                        </>
                      )}
                    </button>

                    {isThemeOpen && (
                      <div className="absolute right-0 mt-2 w-40 rounded-lg bg-dark-primary shadow-lg overflow-hidden z-50">
                        <button
                          className="w-full flex items-center gap-2 px-4 py-2 hover:bg-dark-secondary text-white"
                          onClick={() => {
                            setTheme('light');
                            setIsThemeOpen(false);
                          }}
                        >
                          <Sun className="w-4 h-4" />
                          <span>Lumière</span>
                        </button>
                        <button
                          className="w-full flex items-center gap-2 px-4 py-2 hover:bg-dark-secondary text-white"
                          onClick={() => {
                            setTheme('dark');
                            setIsThemeOpen(false);
                          }}
                        >
                          <Moon className="w-4 h-4" />
                          <span>Sombre</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-medium">Biscuits</h3>
                    <button className="text-gray-400 flex items-center gap-1">
                      Tous
                      <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
                        <path d="M4.18179 6.18181C4.35753 6.00608 4.64245 6.00608 4.81819 6.18181L7.49999 8.86362L10.1818 6.18181C10.3575 6.00608 10.6424 6.00608 10.8182 6.18181C10.9939 6.35755 10.9939 6.64247 10.8182 6.81821L7.81819 9.81821C7.73379 9.9026 7.61934 9.95001 7.49999 9.95001C7.38064 9.95001 7.26618 9.9026 7.18179 9.81821L4.18179 6.81821C4.00605 6.64247 4.00605 6.35755 4.18179 6.18181Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path>
                      </svg>
                    </button>
                  </div>
                </div>

              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-4">Système</h2>
              
              <div className="space-y-6 bg-dark-secondary rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-medium">Compte actif</h3>
                    <p className="text-gray-400">Vous êtes connecté en tant que {user?.email}</p>
                  </div>
                  <button 
                    onClick={handleSignOut}
                    className="px-4 py-2 rounded-lg bg-dark-primary text-white">
                    Déconnexion
                  </button>
                </div>

                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-medium">Supprimer le compte</h3>
                    <p className="text-gray-400">Supprimer définitivement votre compte et vos données</p>
                  </div>
                  <button 
                    onClick={handleDeleteAccount}
                    className="px-4 py-2 rounded-lg bg-dark-primary text-white hover:bg-red-600">
                    En savoir plus
                  </button>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-4">Compte client</h2>
              
              <div className="space-y-6 bg-dark-secondary rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-medium">Avatars</h3>
                  </div>
                  <div className="relative">
                    <Image
                      src={profile?.avatar_url || '/images/default-avatar.jpg'}
                      alt="Avatar"
                      width={64}
                      height={64}
                      className="rounded-full object-cover"
                      priority
                    />
                    <label className="absolute bottom-0 right-0 bg-dark-primary p-1 rounded-full cursor-pointer">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarUpload}
                        className="hidden"
                      />
                      <Edit2 className="w-4 h-4" />
                    </label>
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-medium">Nom complet</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>{profile?.full_name || 'Non défini'}</span>
                    <button onClick={() => {
                      const newFullName = prompt('Entrez votre nom complet', profile?.full_name || '');
                      if (newFullName) handleFullNameUpdate(newFullName);
                    }}>
                      <Edit2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-medium">Téléphone</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>{profile?.phone || 'Non défini'}</span>
                    <button onClick={() => {
                      const newPhone = prompt('Entrez votre numéro de téléphone', profile?.phone || '');
                      if (newPhone) handlePhoneUpdate(newPhone);
                    }}>
                      <Edit2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-medium">E-mail</h3>
                  </div>
                  <span>{profile?.email || user?.email || 'Non disponible'}</span>
                </div>

                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-medium">Conservation des données IA</h3>
                    <p className="text-gray-400">La conservation des données AI permet d&apos;améliorer les résultats AI</p>
                  </div>
                  <button 
                    onClick={() => handleAiDataRetentionChange(!preferences.ai_data_retention)}
                    className={cn(
                      "w-12 h-6 rounded-full relative transition-colors",
                      preferences.ai_data_retention ? "bg-[#00A67E]" : "bg-gray-600"
                    )}
                  >
                    <div className={cn(
                      "w-5 h-5 rounded-full bg-white absolute top-0.5 transition-transform",
                      preferences.ai_data_retention ? "translate-x-6" : "translate-x-0.5"
                    )} />
                  </button>
                </div>
              </div>
            </section>
          </div>
        </div>
      </main>
    </>
  );
}