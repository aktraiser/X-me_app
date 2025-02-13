import { Settings, X, CreditCard } from 'lucide-react';
import EmptyChatMessageInput from './EmptyChatEtudeMessageInput';
import SettingsDialog from './SettingsDialog';
import { useState, useEffect } from 'react';
import { File } from './MarketResearchChatWindow';
import SectorStepper from './SectorStepper';
import { createClient } from '@/utils/supabase/client';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

// Composant Modal de Souscription
const SubscriptionModal = ({ isOpen, onClose, onSubscribe }: { 
  isOpen: boolean; 
  onClose: () => void;
  onSubscribe: () => void;
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[200]">
      <div className="bg-white dark:bg-dark-secondary md:rounded-lg p-8 md:max-w-md w-full h-full md:h-auto md:mx-4 relative flex flex-col">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 z-[201]"
        >
          <X size={24} />
        </button>
        
        <div className="text-center space-y-6 h-full md:h-auto flex flex-col justify-between md:justify-center pt-16 md:pt-0">
          <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto">
            <CreditCard className="w-8 h-8 text-blue-500" />
          </div>
          
          <div className="space-y-2">
            <h3 className="text-xl font-bold text-black dark:text-white">
              Crédit insuffisant
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              Pour lancer une étude de marché, vous avez besoin d&apos;au moins 1 crédit.
            </p>
          </div>
          
          <div className="bg-gray-50 dark:bg-dark-100 p-4 rounded-lg mt-auto md:mt-0">
            <h4 className="font-medium text-black dark:text-white mb-2">
              Pack Découverte
            </h4>
            <p className="text-blue-500 text-2xl font-bold mb-1">9.99€</p>
            <p className="text-gray-500 dark:text-gray-400 text-sm mb-4">
              1 crédit d&apos;étude de marché
            </p>
            <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-2 mb-4">
              <li><span className="text-green-500">✓</span> Analyse complète du marché</li>
              <li><span className="text-green-500">✓</span> Rapport détaillé</li>
              <li><span className="text-green-500">✓</span> Support par email</li>
            </ul>
          </div>
          
          <button
            onClick={onSubscribe}
            className="w-full py-3 px-4 bg-transparent border border-white dark:border-white/20 text-white hover:bg-gray-100 hover:text-white dark:hover:bg-dark-100 rounded-lg transition-all duration-200 font-medium"
          >
            Obtenir un crédit
          </button>
          
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Paiement sécurisé par Stripe
          </p>
        </div>
      </div>
    </div>
  );
};

const EmptyChat = ({
  sendMessage,
  focusMode,
  setFocusMode,
  optimizationMode,
  setOptimizationMode,
  fileIds,
  setFileIds,
  files,
  setFiles,
}: {
  sendMessage: (message: string) => void;
  focusMode: string;
  setFocusMode: (mode: string) => void;
  optimizationMode: string;
  setOptimizationMode: (mode: string) => void;
  fileIds: string[];
  setFileIds: (fileIds: string[]) => void;
  files: File[];
  setFiles: (files: File[]) => void;
}) => {
  const supabase = createClient();
  const router = useRouter();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSubscriptionModalOpen, setIsSubscriptionModalOpen] = useState(false);
  const [selectedSector, setSelectedSector] = useState<string | null>(null);
  const [selectedSubsector, setSelectedSubsector] = useState<string | null>(null);
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [selectedBudget, setSelectedBudget] = useState<string | null>(null);
  const [userCredits, setUserCredits] = useState<number>(0);
  const [isStarted, setIsStarted] = useState(false);

  useEffect(() => {
    const checkUserCredits = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        router.push('/login');
        return;
      }

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('credits')
        .eq('id', session.user.id)
        .single();

      if (error) {
        console.error('Error fetching credits:', error);
        toast.error('Erreur lors de la vérification des crédits');
        return;
      }

      setUserCredits(profile?.credits || 0);
    };

    checkUserCredits();
  }, [supabase, router]);

  const handleSectorSelect = async (data: {
    sector: string;
    subsector?: string;
    region: string;
    city: string;
    budget: string;
  }) => {
    if (userCredits < 1) {
      setIsSubscriptionModalOpen(true);
      return;
    }

    setSelectedSector(data.sector);
    setSelectedSubsector(data.subsector || null);
    setSelectedRegion(data.region);
    setSelectedCity(data.city);
    setSelectedBudget(data.budget);
    
    // Format structuré pour que l'agent puisse facilement parser l'information
    const message = JSON.stringify({
      type: "sector_research",
      sector: data.sector,
      subsector: data.subsector || null,
      region: data.region,
      city: data.city,
      budget: data.budget,
      query: `Fais une étude de marché pour ${data.sector}${data.subsector ? ` - ${data.subsector}` : ''} à ${data.city} (${data.region}) avec un budget de ${data.budget}.`,
      documentPath: `documentation/${data.sector.replace(/ /g, '_')}`
    });

    // Déduire un crédit après le lancement de l'étude
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          credits: userCredits - 1,
          updated_at: new Date().toISOString()
        })
        .eq('id', session.user.id);

      if (error) {
        console.error('Error updating credits:', error);
        toast.error('Erreur lors de la mise à jour des crédits');
        return;
      }

      setUserCredits(prev => prev - 1);
    }
      
    sendMessage(message);
  };

  const handleSubscribe = () => {
    router.push('/settings');
  };

  return (
    <div className="relative h-screen flex flex-col">
      <SettingsDialog isOpen={isSettingsOpen} setIsOpen={setIsSettingsOpen} />
      <SubscriptionModal 
        isOpen={isSubscriptionModalOpen}
        onClose={() => setIsSubscriptionModalOpen(false)}
        onSubscribe={handleSubscribe}
      />
      <div className="absolute w-full flex flex-row items-center justify-end p-5">
        <Settings
          className="cursor-pointer lg:hidden"
          onClick={() => setIsSettingsOpen(true)}
        />
      </div>
      <div className="flex-1 flex flex-col items-center justify-center px-6 md:px-2">
        {!isStarted ? (
          <div className="max-w-screen-sm w-full space-y-4 md:space-y-8 -mt-16">
            <h2 className="text-black/70 dark:text-white text-3xl font-medium text-center">
              Vous avez un <strong>projet</strong> ?
            </h2>
            <h3 className="text-black/70 dark:text-white/70 font-medium text-center">
              Réalisez votre étude de marché en fonction de votre secteur d&apos;activité
            </h3>
            <div className="flex flex-col items-center">
              <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-2 mb-8">
                <li className="flex items-center gap-2">
                  <span className="text-green-500 text-lg">✓</span>
                  <span>Analyse complète du marché</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-500 text-lg">✓</span>
                  <span>Rapport détaillé</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-500 text-lg">✓</span>
                  <span>Support par email</span>
                </li>
              </ul>
              <button
                onClick={() => setIsStarted(true)}
                className="px-8 py-4 bg-transparent border border-white dark:border-white/20 text-white rounded-xl font-semibold text-lg hover:bg-white/5 transform hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
              >
                Commencer
              </button>
            </div>
          </div>
        ) : (
          <div className="w-full">
            {!selectedSector ? (
              <SectorStepper onSectorSelect={handleSectorSelect} />
            ) : (
              <EmptyChatMessageInput
                sendMessage={sendMessage}
                focusMode={focusMode}
                setFocusMode={setFocusMode}
                optimizationMode={optimizationMode}
                setOptimizationMode={setOptimizationMode}
                fileIds={fileIds}
                setFileIds={setFileIds}
                files={files}
                setFiles={setFiles}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default EmptyChat;
