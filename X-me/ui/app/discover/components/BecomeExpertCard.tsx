import { Briefcase } from 'lucide-react';

interface BecomeExpertCardProps {
  onContactClick: () => void;
}

export default function BecomeExpertCard({ onContactClick }: BecomeExpertCardProps) {
  return (
    <div className="group w-full max-w-3xl mx-auto rounded-xl overflow-hidden bg-white dark:bg-gray-800 shadow hover:shadow-md transition-all duration-300 border border-gray-100 dark:border-gray-700">
      {/* Ligne 1: Photo, nom, activité */}
      <div className="flex items-center p-4 border-gray-100 dark:border-gray-700">
        <div className="flex items-center gap-4">
          {/* Icône */}
          <div className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-white dark:border-gray-800 shadow-sm">
            <div className="w-full h-full bg-gradient-to-br from-indigo-400 to-indigo-600 flex items-center justify-center">
              <Briefcase className="w-8 h-8 text-white" />
            </div>
          </div>
          
          {/* Titre et sous-titre */}
          <div>
            <h2 className="text-lg text-gray-900 dark:text-white">
              Devenez Expert
            </h2>
            <p className="text-sm font-bold text-gray-600 dark:text-gray-300">
              Rejoignez notre réseau
            </p>
          </div>
        </div>
      </div>
      
      {/* Ligne 2: Description */}
      <div className="p-4">
        <p className="text-sm text-gray-700 dark:text-gray-300">
          Proposez vos services en tant qu&apos;expert et développez votre activité avec X-me.
        </p>
      </div>
      
      {/* Ligne 3: CTA en bas */}
      <div className="p-4 flex justify-left">
        <button
          type="button"
          onClick={onContactClick}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium transition-colors"
        >
          Contactez-nous
        </button>
      </div>
    </div>
  )
} 