import { Briefcase } from 'lucide-react';
import { useState } from 'react';
import ExpertApplicationModal from './ExpertApplicationModal';

export default function BecomeExpertCard() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const openModal = () => {
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  return (
    <>
      <div className="group w-full rounded-xl overflow-hidden bg-white dark:bg-gray-800 shadow hover:shadow-lg dark:hover:shadow-lg border border-gray-100 dark:border-gray-700 hover:border-dark-200 dark:hover:border-dark-200 hover:bg-amber-50 dark:hover:bg-amber-800/10 transition-all duration-300 cursor-pointer transform hover:-translate-y-1" onClick={openModal}>
        {/* Ligne 1: Photo, nom, activité */}
        <div className="flex items-center p-4 border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-4">
            {/* Icône */}
            <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-full overflow-hidden border-2 border-white dark:border-gray-800 shadow-sm flex-shrink-0">
              <div className="w-full h-full bg-gradient-to-br from-indigo-400 to-indigo-600 flex items-center justify-center">
                <Briefcase className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
              </div>
            </div>
            
            {/* Titre et sous-titre */}
            <div>
              <h2 className="text-base sm:text-lg text-gray-900 dark:text-white">
                Devenez Expert
              </h2>
              <p className="text-xs sm:text-sm font-bold text-gray-600 dark:text-gray-300">
                Rejoignez notre réseau
              </p>
            </div>
          </div>
        </div>
        
        {/* Ligne 2: Description */}
        <div className="p-4">
          <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-300">
            Proposez vos services en tant qu&apos;expert et développez votre activité avec Xandme.
          </p>
        </div>
        
        {/* Ligne 3: CTA en bas */}
        <div className="p-4 flex justify-left">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              openModal();
            }}
            className="w-full sm:w-auto px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-md text-sm font-medium transition-colors"
          >
            Contactez-nous
          </button>
        </div>
      </div>

      {/* Modal de demande d'expert */}
      <ExpertApplicationModal isOpen={isModalOpen} onClose={closeModal} />
    </>
  )
} 