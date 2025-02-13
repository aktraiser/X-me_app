'use client';

import { useState, useEffect, useCallback } from 'react';
import { Moon, Sun, Edit2, Settings, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import PageHeader from '@/components/PageHeader';
import { useTheme } from 'next-themes';
import { toast } from 'react-hot-toast';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import Script from 'next/script';

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'stripe-buy-button': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement> & {
          'buy-button-id': string;
          'publishable-key': string;
          'client-reference-id'?: string;
          'success-url'?: string;
          'cancel-url'?: string;
        },
        HTMLElement
      >;
    }
  }
}

const subscriptionPlans = [
  {
    title: "Pack Découverte",
    credits: 1,
    price: 9.99,
    priceId: 'price_1QrDjWHFhbg7l1Zn0eTfFXLq',
    features: [
      "1 crédit d'étude de marché",
      "Analyse complète du marché",
      "Rapport détaillé",
      "Support par email"
    ]
  }
];

const SubscriptionCard = ({ 
  title, 
  credits, 
  price, 
  priceId, 
  features,
  userId,
  userEmail
}: { 
  title: string;
  credits: number;
  price: number;
  priceId: string;
  features: string[];
  userId: string;
  userEmail: string;
}) => {
  console.log('SubscriptionCard userId:', userId);
  console.log('SubscriptionCard userEmail:', userEmail);

  return (
    <div className="bg-white dark:bg-dark-secondary rounded-lg p-8 max-w-sm w-full mx-auto relative border border-white/20 dark:border-white/20">
      <div className="text-center">
        <h3 className="text-xl font-bold text-black dark:text-white">{title}</h3>
        <p className="text-blue-500 text-2xl font-bold mt-2">{price}€</p>
        <p className="text-gray-500 dark:text-gray-400 text-sm">{credits} crédit{credits > 1 ? 's' : ''}</p>
      </div>
      
      <div className="bg-gray-50 dark:bg-dark-100 p-4 rounded-lg mt-6">
        <div className="flex flex-col items-center space-y-3">
          {features.map((feature, index) => (
            <div key={index} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
              <span className="text-green-500">✓</span>
              <span>{feature}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-center mt-6">
        <stripe-buy-button
          buy-button-id="buy_btn_1Qr18ZHFhbg7l1Zn3mdeTqaM"
          publishable-key="pk_test_51QqFgrHFhbg7l1ZnnY3mFGzvVF1p462vvbg4UhT9hZAP22m1IVtL0VK5il3HEmg18inHg2tlJ3xu3VH07yXlXOWW00uTelO38R"
          client-reference-id={userId}
          customer-email={userEmail}
          customer-creation="always"
          success-url={`${process.env.NEXT_PUBLIC_WEBSITE_URL}/settings?success=true&session_id={CHECKOUT_SESSION_ID}`}
          cancel-url={`${process.env.NEXT_PUBLIC_WEBSITE_URL}/settings?canceled=true`}
        >
        </stripe-buy-button>
      </div>
    </div>
  );
};

// Composant Modal
const SuccessModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-dark-secondary rounded-lg p-6 max-w-md w-full mx-4 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white"
        >
          <X size={24} />
        </button>
        
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto">
            <span className="text-3xl">✨</span>
          </div>
          
          <h3 className="text-xl font-bold text-white">Paiement réussi !</h3>
          
          <p className="text-gray-300">
            Votre crédit a été ajouté à votre compte. Vous pouvez maintenant l&apos;utiliser pour votre étude de marché.
          </p>
          
          <button
            onClick={onClose}
            className="w-full py-2 px-4 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
          >
            Continuer
          </button>
        </div>
      </div>
    </div>
  );
};

export default function SettingsPage() {
  const supabase = createClient();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [fullName, setFullName] = useState<string | null>(null);
  const [phone, setPhone] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isThemeOpen, setIsThemeOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  const [credits, setCredits] = useState<number>(0);
  const [isStripeLoaded, setIsStripeLoaded] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const getProfile = useCallback(async () => {
    try {
      setLoading(true);
      if (!user) return;

      const { data, error, status } = await supabase
        .from('profiles')
        .select(`full_name, phone, avatar_url, credits`)
        .eq('id', user.id)
        .single();

      if (error && status !== 406) {
        throw error;
      }

      if (data) {
        setFullName(data.full_name);
        setPhone(data.phone);
        setAvatarUrl(data.avatar_url);
        setCredits(data.credits);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
      toast.error('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  }, [user, supabase]);

  // Écouter les changements en temps réel sur la table profiles
  useEffect(() => {
    if (!user) {
      console.log('❌ Pas d\'utilisateur connecté pour configurer le canal');
      return;
    }

    console.log('🔄 Configuration du canal pour l\'utilisateur:', user.id);

    const channel = supabase.channel('profiles')
      .on(
        'postgres_changes' as const,
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${user.id}`
        },
        (payload) => {
          console.log('⚡️ Payload reçu dans le callback:', payload);
          console.log('📊 État actuel des crédits:', credits);
          console.log('🎭 État actuel de showSuccessModal:', showSuccessModal);
          
          // Vérifier si les crédits ont changé
          if (payload.new.credits !== credits) {
            console.log('💫 Mise à jour des crédits détectée:', payload.new.credits);
            setShowSuccessModal(true);
            console.log('✅ setShowSuccessModal appelé avec true');
            getProfile();
          } else {
            console.log('ℹ️ Pas de changement de crédits détecté');
          }
        }
      )
      .subscribe((status) => {
        console.log('📡 Statut de la souscription:', status);
      });

    console.log('🔌 Canal configuré et souscription activée');

    return () => {
      console.log('🔌 Désinscription du canal profiles');
      channel.unsubscribe();
    };
  }, [user, supabase, getProfile, credits, showSuccessModal]);

  useEffect(() => {
    const getUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
        return;
      }
      setUser(session.user);
    };
    getUser();
  }, [supabase, router]);

  useEffect(() => {
    if (user) {
      getProfile();
    }
  }, [user, getProfile]);

  async function updateProfile({
    full_name,
    phone,
    avatar_url,
  }: {
    full_name?: string | null;
    phone?: string | null;
    avatar_url?: string | null;
  }) {
    try {
      setLoading(true);
      if (!user) return;

      const { error } = await supabase.from('profiles').upsert({
        id: user.id,
        full_name,
        phone,
        avatar_url,
        email: user.email,
        updated_at: new Date().toISOString(),
      });

      if (error) throw error;
      toast.success('Profil mis à jour !');
      getProfile();
    } catch (error) {
      console.error('Error:', error);
      toast.error('Erreur lors de la mise à jour');
    } finally {
      setLoading(false);
    }
  }

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      if (!user) return;
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
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      await updateProfile({ avatar_url: publicUrl });
      setAvatarUrl(publicUrl);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Erreur lors du téléchargement de l\'avatar');
    } finally {
      setLoading(false);
    }
  };

  const handleFullNameUpdate = async () => {
    const newFullName = prompt('Entrez votre nom complet', fullName || '');
    if (newFullName) {
      await updateProfile({ full_name: newFullName });
    }
  };

  const handlePhoneUpdate = async () => {
    const newPhone = prompt('Entrez votre numéro de téléphone', phone || '');
    if (newPhone) {
      await updateProfile({ phone: newPhone });
    }
  };

  const handleSignOut = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      toast.success('Déconnexion réussie');
      router.push('/login');
    } catch (error) {
      console.error('Error:', error);
      toast.error('Erreur lors de la déconnexion');
    } finally {
      setLoading(false);
    }
  };

  const updateCredits = async (newCredits: number) => {
    try {
      setLoading(true);
      if (!user) return;

      const { error } = await supabase
        .from('profiles')
        .update({ credits: newCredits })
        .eq('id', user.id);

      if (error) throw error;
      
      setCredits(newCredits);
      toast.success('Crédits mis à jour !');
    } catch (error) {
      console.error('Error updating credits:', error);
      toast.error('Erreur lors de la mise à jour des crédits');
    } finally {
      setLoading(false);
    }
  };

  // Suivre les changements de showSuccessModal
  useEffect(() => {
    console.log('🔔 showSuccessModal a changé:', showSuccessModal);
  }, [showSuccessModal]);

  return (
    <>
      <Script 
        src="https://js.stripe.com/v3/buy-button.js"
        strategy="afterInteractive"
        onLoad={() => setIsStripeLoaded(true)}
        onError={(e) => {
          console.error('Erreur lors du chargement du script Stripe:', e);
          toast.error('Erreur lors du chargement du bouton de paiement');
        }}
      />
      <SuccessModal 
        isOpen={showSuccessModal} 
        onClose={() => {
          setShowSuccessModal(false);
          getProfile();
          router.refresh();
        }} 
      />
      <PageHeader
        title="Réglages"
        icon={<Settings className="w-6 h-6" />}
      />
      <main className="min-h-screen pt-8">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-8">
            <section>
              <h2 className="text-xl font-semibold mb-4">Compte client</h2>
              <div className="space-y-6 bg-dark-secondary rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-medium">Avatar</h3>
                  </div>
                  <div className="relative">
                    <Image
                      src={avatarUrl || '/images/default-avatar.jpg'}
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
                        disabled={loading}
                      />
                      <Edit2 className="w-4 h-4" />
                    </label>
                  </div>
                </div>

                <div className="h-px bg-gray-700" />

                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-medium">Nom complet</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>{fullName || 'Non défini'}</span>
                    <button onClick={handleFullNameUpdate} disabled={loading}>
                      <Edit2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="h-px bg-gray-700" />

                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-medium">Téléphone</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>{phone || 'Non défini'}</span>
                    <button onClick={handlePhoneUpdate} disabled={loading}>
                      <Edit2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="h-px bg-gray-700" />

                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-medium">E-mail</h3>
                  </div>
                  <span>{user?.email}</span>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-4">Crédit</h2>
              <div className="bg-dark-secondary rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-medium">Balance crédit</h3>
                    <p className="text-gray-400">Acheter des crédits pour votre étude de marché</p>
                  </div>
                  <div>
                    <p className="text-xl font-bold">{credits} crédits</p>
                  </div>
                </div>

                <div className="h-px bg-gray-700 my-6" />

                <div className="grid gap-6">
                  {subscriptionPlans.map((plan, index) => (
                    <SubscriptionCard
                      key={index}
                      {...plan}
                      userId={user?.id || ''}
                      userEmail={user?.email || ''}
                    />
                  ))}
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
                    className="px-4 py-2 rounded-lg bg-dark-primary text-white hover:bg-red-600"
                    disabled={loading}
                  >
                    Déconnexion
                  </button>
                </div>

                <div className="h-px bg-gray-700" />

                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-medium">Supprimer le compte</h3>
                    <p className="text-gray-400">Supprimer définitivement votre compte et vos données</p>
                  </div>
                  <button className="px-4 py-2 rounded-lg bg-dark-primary text-white hover:bg-red-600">
                    Supprimer
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