'use client';

import { useState, useEffect, useCallback } from 'react';
import { Moon, Sun, Edit2, Settings, X, Video as VideoIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import PageHeader from '@/components/PageHeader';
import { useTheme } from 'next-themes';
import { toast } from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { Switch } from '../../components/ui/switch';
import { Textarea } from '../../components/Textarea';
import { ImagesIcon } from '../../components/icons';
import { useUser, useClerk } from '@clerk/nextjs';
import ConfirmationMessage from '@/components/ConfirmationMessage';
import ConfirmationDialog from '@/components/ConfirmationDialog';

const SettingsSection = ({ 
  title, 
  children,
  className
}: { 
  title: string;
  children: React.ReactNode;
  className?: string;
}) => {
  return (
    <section className={className}>
      <h2 className="text-xl font-semibold mb-4 text-black dark:text-white">{title}</h2>
      <div className="bg-light-secondary dark:bg-dark-secondary rounded-lg p-6 space-y-6">
        {children}
      </div>
    </section>
  );
};

const ThemeSwitcher = () => {
  const { theme, setTheme } = useTheme();
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  
  const handleThemeChange = (newTheme: string) => {
    setTheme(newTheme);
    setNotificationMessage(`Thème ${newTheme === 'light' ? 'clair' : 'sombre'} activé`);
    setShowNotification(true);
  };
  
  return (
    <>
      <div className="flex items-center space-x-2 bg-light-200 dark:bg-dark-primary rounded-lg p-1">
        <button
          onClick={() => handleThemeChange('light')}
          className={cn(
            "py-2 px-3 rounded-md flex items-center space-x-2 transition-colors",
            theme === 'light' ? "bg-white text-black" : "text-black/70 dark:text-white/70"
          )}
        >
          <Sun size={18} />
          <span>Lumière</span>
        </button>
        <button
          onClick={() => handleThemeChange('dark')}
          className={cn(
            "py-2 px-3 rounded-md flex items-center space-x-2 transition-colors",
            theme === 'dark' ? "bg-dark-100 text-white" : "text-black/70 dark:text-white/70"
          )}
        >
          <Moon size={18} />
          <span>Sombre</span>
        </button>
      </div>
      
      {showNotification && (
        <ConfirmationMessage 
          message={notificationMessage}
          show={showNotification}
          setShow={setShowNotification}
        />
      )}
    </>
  );
};


export default function SettingsPage() {
  const router = useRouter();
  const { user, isLoaded, isSignedIn } = useUser();
  const { signOut } = useClerk();
  const [loading, setLoading] = useState(true);
  const [isThemeOpen, setIsThemeOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  const [automaticImageSearch, setAutomaticImageSearch] = useState(true);
  const [automaticVideoSearch, setAutomaticVideoSearch] = useState(true);
  const [systemInstructions, setSystemInstructions] = useState('');
  const [savingStates, setSavingStates] = useState<Record<string, boolean>>({});
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [confirmSignOutOpen, setConfirmSignOutOpen] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  
  // États pour les notifications
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  const [notificationDescription, setNotificationDescription] = useState('');
  
  // Charger les préférences depuis localStorage
  useEffect(() => {
    if (isLoaded && isSignedIn) {
      try {
        setLoading(true);
        
        // Charger les configurations depuis localStorage
        const storedImageSearch = localStorage.getItem('automaticImageSearch');
        if (storedImageSearch !== null) {
          setAutomaticImageSearch(storedImageSearch === 'true');
        }
        
        const storedVideoSearch = localStorage.getItem('automaticVideoSearch');
        if (storedVideoSearch !== null) {
          setAutomaticVideoSearch(storedVideoSearch === 'true');
        }
        
        const storedInstructions = localStorage.getItem('systemInstructions');
        if (storedInstructions) {
          setSystemInstructions(storedInstructions);
        }
      } catch (error) {
        console.error('Error loading settings:', error);
        toast.error('Erreur lors du chargement des paramètres');
      } finally {
        setLoading(false);
      }
    } else if (isLoaded && !isSignedIn) {
      router.push('/sign-in');
    }
  }, [isLoaded, isSignedIn, router]);

  const handleSignOutDialog = async (confirmed: boolean) => {
    if (confirmed) {
      try {
        setIsSigningOut(true);
        await signOut();
        setNotificationMessage('Déconnexion réussie');
        setShowNotification(true);
        router.push('/sign-in');
      } catch (error) {
        console.error('Error:', error);
        toast.error('Erreur lors de la déconnexion');
      } finally {
        setIsSigningOut(false);
      }
    }
    setConfirmSignOutOpen(false);
  };

  const handleDeleteAccountDialog = async (confirmed: boolean) => {
    if (confirmed) {
      try {
        setIsDeletingAccount(true);
        await user?.delete();
        setNotificationMessage('Votre compte a été supprimé avec succès');
        setShowNotification(true);
        router.push('/sign-in');
      } catch (error) {
        console.error('Error deleting account:', error);
        toast.error('Erreur lors de la suppression du compte');
      } finally {
        setIsDeletingAccount(false);
      }
    }
    setConfirmDeleteOpen(false);
  };

  // Fonction pour enregistrer la configuration
  const saveConfig = (key: string, value: any) => {
    setSavingStates((prev) => ({ ...prev, [key]: true }));
    
    // Sauvegarder dans localStorage
    setTimeout(() => {
      localStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value));
      setSavingStates((prev) => ({ ...prev, [key]: false }));
      
      // Messages personnalisés selon le type de configuration
      if (key === 'automaticImageSearch') {
        setNotificationMessage(value ? 'Recherche d\'images automatique activée' : 'Recherche d\'images automatique désactivée');
        setShowNotification(true);
      } else if (key === 'automaticVideoSearch') {
        setNotificationMessage(value ? 'Recherche de vidéos automatique activée' : 'Recherche de vidéos automatique désactivée');
        setShowNotification(true);
      } else if (key === 'systemInstructions') {
        setNotificationMessage('Instructions système enregistrées');
        setShowNotification(true);
      } else {
        setNotificationMessage('Configuration sauvegardée');
        setShowNotification(true);
      }
    }, 500);
  };

  return (
    <>
      <PageHeader
        title="Réglages"
        icon={<Settings className="w-6 h-6 text-black dark:text-white" />}
      />
      <main className="min-h-screen pt-8">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-8 pb-24 md:pb-32">
            <section>
              <h2 className="text-xl font-semibold mb-4 text-black dark:text-white">Mon compte client</h2>
              <div className="space-y-6 bg-light-secondary dark:bg-dark-secondary rounded-lg p-6">
                <div className="flex justify-between items-center">
                  <div className="flex flex-col">
                    <h3 className="text-lg font-medium text-black dark:text-white">Nom complet</h3>
                    <span className="mt-1 text-black/60 dark:text-white/60">{user?.fullName || 'Non défini'}</span>
                  </div>
                </div>

                <div className="h-px bg-[#c49c48]" />

                <div className="flex justify-between items-center">
                  <div className="flex flex-col">
                    <h3 className="text-lg font-medium text-black dark:text-white">Téléphone</h3>
                    <span className="mt-1 text-black/60 dark:text-white/60">{user?.primaryPhoneNumber?.phoneNumber || 'Non défini'}</span>
                  </div>
                </div>

                <div className="h-px bg-[#c49c48]" />

                <div className="flex justify-between items-center">
                  <div className="flex flex-col">
                    <h3 className="text-lg font-medium text-black dark:text-white">E-mail</h3>
                    <span className="mt-1 text-black/60 dark:text-white/60">{user?.primaryEmailAddress?.emailAddress || 'Non défini'}</span>
                  </div>
                </div>
              </div>
            </section>

            <SettingsSection title="Apparence" className="text-black dark:text-white">
              <div className="flex justify-between items-center">
                <p className="text-lg font-medium text-black dark:text-white">
                  Theme
                </p>
                <ThemeSwitcher />
              </div>
            </SettingsSection>

            <SettingsSection title="Recherche Automatique">
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-light-200 dark:bg-dark-secondary rounded-lg">
                    <ImagesIcon
                      size={18}
                      className="text-black/70 dark:text-white/70"
                    />
                  </div>
                  <div>
                    <p className="text-sm text-black/90 dark:text-white/90 font-medium">
                      Recherche d&apos;images automatique
                    </p>
                    <p className="text-xs text-black/60 dark:text-white/60 mt-0.5">
                      Recherche automatiquement des images pertinentes dans les réponses du chat
                    </p>
                  </div>
                </div>
                <Switch
                  checked={automaticImageSearch}
                  onChange={(checked: boolean) => {
                    setAutomaticImageSearch(checked);
                    saveConfig('automaticImageSearch', checked);
                  }}
                  className={cn(
                    automaticImageSearch
                    ? 'bg-dark-200 dark:bg-dark-200'
                    : 'bg-dark-secondary',
                    'relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none',
                  )}
                >
                  <span
                    className={cn(
                      automaticImageSearch
                        ? 'translate-x-6'
                        : 'translate-x-1',
                      'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                    )}
                  />
                </Switch>
              </div>

              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-light-200 dark:bg-dark-secondary rounded-lg">
                    <VideoIcon
                      size={18}
                      className="text-black/70 dark:text-white/70"
                    />
                  </div>
                  <div>
                    <p className="text-sm text-black/90 dark:text-white/90 font-medium">
                      Recherche de vidéos automatique
                    </p>
                    <p className="text-xs text-black/60 dark:text-white/60 mt-0.5">
                      Recherche automatiquement des vidéos pertinentes dans les réponses du chat
                    </p>
                  </div>
                </div>
                <Switch
                  checked={automaticVideoSearch}
                  onChange={(checked: boolean) => {
                    setAutomaticVideoSearch(checked);
                    saveConfig('automaticVideoSearch', checked);
                  }}
                  className={cn(
                    automaticVideoSearch
                      ? 'bg-dark-200 dark:bg-dark-200'
                      : 'bg-dark-secondary',
                    'relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none',
                  )}
                >
                  <span
                    className={cn(
                      automaticVideoSearch
                        ? 'translate-x-6'
                        : 'translate-x-1',
                      'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                    )}
                  />
                </Switch>
              </div>
            </SettingsSection>

            <SettingsSection title="Systeme Instructions">
              <Textarea
                value={systemInstructions}
                isSaving={savingStates['systemInstructions']}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
                  setSystemInstructions(e.target.value);
                }}
                onSave={(value: string) => saveConfig('systemInstructions', value)}
                placeholder="Je viens tout juste de lancer mon entreprise. Je me rends compte qu’il me reste encore beaucoup à apprendre, surtout en ce qui concerne la gestion, l’organisation et la manière de trouver les bons experts pour m’entourer."
              />
            </SettingsSection>

            <section>
              <h2 className="text-xl font-semibold mb-4 text-black dark:text-white">Système</h2>
              <div className="space-y-6 bg-light-secondary dark:bg-dark-secondary  rounded-lg p-6">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-medium text-black dark:text-white">Compte actif</h3>
                    <p className="mt-1 text-black/60 dark:text-white/60">Vous êtes connecté en tant que {user?.primaryEmailAddress?.emailAddress}</p>
                  </div>
                  <button 
                    onClick={() => setConfirmSignOutOpen(true)}
                    className="px-4 py-2 rounded-lg bg-dark-primary text-white hover:bg-red-600"
                    disabled={loading || isSigningOut}
                  >
                    Déconnexion
                  </button>
                </div>

                <div className="h-px bg-[#c49c48]" />

                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-medium text-black dark:text-white">Supprimer le compte</h3>
                    <p className="mt-1 text-black/60 dark:text-white/60">Supprimer définitivement votre compte et vos données</p>
                  </div>
                  <button 
                    onClick={() => setConfirmDeleteOpen(true)}
                    className="px-4 py-2 rounded-lg bg-dark-primary text-white hover:bg-red-600"
                    disabled={loading || isDeletingAccount}
                  >
                    Supprimer
                  </button>
                </div>
              </div>
            </section>
          </div>
        </div>
        <div className="h-18"></div>
      </main>

      {/* Affichage de la notification globale */}
      {showNotification && (
        <ConfirmationMessage
          message={notificationMessage}
          description={notificationDescription}
          show={showNotification}
          setShow={setShowNotification}
        />
      )}

      {/* Modal de confirmation de déconnexion */}
      <ConfirmationDialog
        title="Confirmer la déconnexion"
        description="Êtes-vous sûr de vouloir vous déconnecter de votre compte ?"
        confirmButtonText="Déconnexion"
        open={confirmSignOutOpen}
        onClose={handleSignOutDialog}
        isProcessing={isSigningOut}
        dangerConfirm={false}
      />

      {/* Modal de confirmation de suppression */}
      <ConfirmationDialog
        title="Confirmer la suppression"
        description="Êtes-vous sûr de vouloir supprimer votre compte ? Cette action est irréversible et toutes vos données seront perdues."
        confirmButtonText="Supprimer définitivement"
        open={confirmDeleteOpen}
        onClose={handleDeleteAccountDialog}
        isProcessing={isDeletingAccount}
        dangerConfirm={true}
      />
    </>
  );
}