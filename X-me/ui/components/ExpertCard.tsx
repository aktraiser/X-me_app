'use client';

import Image from 'next/image';
import { Search, Filter, X, Users, MapPin, Star, Briefcase, Clock, XCircle } from 'lucide-react';
import { Expert } from '@/types/index';

interface ExpertCardProps {
  expert: Expert;
  onClick: () => void;
  onContactClick: () => void;
}

const ExpertCard: React.FC<ExpertCardProps> = ({ expert, onClick, onContactClick }) => {
  // Utiliser directement le champ activité s'il existe, sinon prendre la première expertise
  // Dans le cas où activité est défini mais vide, on utilise quand même la première expertise
  const activité = (expert.activité && expert.activité.trim() !== '') 
    ? expert.activité 
    : (expert.expertises?.split(',')[0].trim() || "Expert");
  
  return (
    <div
      className="group w-full rounded-xl overflow-hidden bg-white dark:bg-gray-800 shadow hover:shadow-lg dark:hover:shadow-lg border border-gray-100 dark:border-gray-700 hover:border-dark-200 dark:hover:border-dark-200 hover:bg-amber-50 dark:hover:bg-amber-800/20 transition-all duration-300 cursor-pointer transform hover:-translate-y-1"
      onClick={onClick}
    >
      {/* Ligne 1: Photo, nom, activité et CTA */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border-gray-100 dark:border-gray-700 gap-4">
        <div className="flex items-center gap-4 w-full sm:w-auto">
          {/* Photo de profil */}
          <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-full overflow-hidden border-2 border-white dark:border-gray-800 shadow-sm flex-shrink-0">
            {expert.image_url ? (
              <Image
                src={expert.image_url.replace(/([^:]\/)\/+/g, "$1")}
                alt={`${expert.prenom} ${expert.nom}`}
                fill
                className="object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.onerror = null;
                  target.src = '/placeholder-image.jpg';
                }}
                unoptimized={true}
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
                <Users className="w-7 h-7 sm:w-8 sm:h-8 text-gray-400" />
              </div>
            )}
          </div>
          
          {/* Nom et activité */}
          <div>
            <h2 className="text-base sm:text-lg text-gray-900 dark:text-white">
              {expert.prenom} {expert.nom}
            </h2>
            <p className="text-xs sm:text-sm font-bold text-gray-600 dark:text-gray-300">
              {activité}
            </p>
          </div>
        </div>
        
        {/* CTA Contacter */}
        <button 
          className="w-full sm:w-auto px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-md text-sm font-medium transition-colors"
          onClick={(e) => {
            e.stopPropagation(); // Empêcher la propagation pour ne pas déclencher onClick de la carte
            onContactClick();
          }}
          aria-label={`Contacter ${expert.prenom} ${expert.nom}`}
        >
          Contacter l&apos;expert
        </button>
      </div>
      
      {/* Ligne 2: Informations avec icônes (tarif, localisation, disponibilité) */}
      <div className="flex flex-wrap items-center gap-2 sm:gap-3 p-4 border-gray-100 dark:border-gray-700">
        {/* Tarif */}
        <div className="flex items-center gap-2 border rounded-full px-2 sm:px-3 py-1 sm:py-1.5 border-gray-200 dark:border-gray-600 group-hover:border-amber-500 dark:group-hover:border-white">
          <Clock className="w-3 h-3 sm:w-4 sm:h-4 text-gray-500 dark:text-gray-400" />
          <span className="text-xs sm:text-sm text-gray-700 dark:text-gray-300"><span className="text-xs">À partir de </span>{expert.tarif}€ </span>
        </div>
        
        {/* Localisation */}
        <div className="flex items-center gap-2 border rounded-full px-2 sm:px-3 py-1 sm:py-1.5 border-gray-200 dark:border-gray-600 group-hover:border-amber-500 dark:group-hover:border-white">
          <MapPin className="w-3 h-3 sm:w-4 sm:h-4 text-gray-500 dark:text-gray-400" />
          <span className="text-xs sm:text-sm text-gray-700 dark:text-gray-300">{expert.ville}, {expert.pays}</span>
        </div>
        
        {/* Disponibilité */}
        <div className="flex items-center gap-2 border rounded-full px-2 sm:px-3 py-1 sm:py-1.5 border-gray-200 dark:border-gray-600 group-hover:border-amber-500 dark:group-hover:border-white">
          <div className="w-2 h-2 rounded-full bg-green-500"></div>
          <span className="text-xs sm:text-sm text-gray-700 dark:text-gray-300">Disponible</span>
        </div>
      </div>
      
      {/* Ligne 3: Expertises */}
      <div className="p-4">
        <h3 className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Expertises</h3>
        <div className="flex flex-wrap gap-1.5 sm:gap-2">
          {expert.expertises?.split(',').slice(0, 5).map((expertise, index) => (
            <span key={index} className="inline-flex items-center text-xs font-medium px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200">
              {expertise.trim()}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ExpertCard; 