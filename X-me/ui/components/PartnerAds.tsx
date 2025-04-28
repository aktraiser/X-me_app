/* eslint-disable @next/next/no-img-element */
import { Building2, ExternalLink, ChevronRight } from 'lucide-react';
import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Message } from './ChatWindow';

// Définition du type Partner
type Partner = {
  id: string;
  name: string;
  description: string;
  logo_url: string;
  website_url: string | null;
  active: boolean;
  created_at?: string;
  updated_at?: string;
};

// Partenaires de fallback au cas où la requête Supabase échoue
const FALLBACK_PARTNERS: Partner[] = [
  {
    id: '1',
    name: 'Avocats & Justice',
    description: 'Le cabinet d\'avocats spécialisé en droit civil et familial. Consultation et assistance juridique.',
    logo_url: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&q=80',
    website_url: 'https://example.com/avocats',
    active: true
  },
  {
    id: '2',
    name: 'Notaires Associés',
    description: 'Services notariaux pour particuliers et professionnels. Actes authentiques, successions et patrimoine.',
    logo_url: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&q=80',
    website_url: 'https://example.com/notaires',
    active: true
  },
  {
    id: '3',
    name: 'LégalTech Solutions',
    description: 'Plateforme innovante combinant technologie et expertise juridique pour simplifier vos démarches administratives.',
    logo_url: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&q=80',
    website_url: 'https://example.com/legaltech',
    active: true
  }
];

const PartnerAds = ({
  query,
  chatHistory,
}: {
  query: string;
  chatHistory: Message[];
}) => {
  const [partner, setPartner] = useState<Partner | null>(null);
  const [loading, setLoading] = useState(true);

  // Fonction pour sélectionner un partenaire aléatoire
  const getRandomPartner = (partners: Partner[]): Partner => {
    const randomIndex = Math.floor(Math.random() * partners.length);
    return partners[randomIndex];
  };

  useEffect(() => {
    const fetchPartner = async () => {
      setLoading(true);
      try {
        // Créer un client Supabase anonyme
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
        const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
        const supabase = createClient(supabaseUrl, supabaseKey, {
          auth: {
            persistSession: false,
            autoRefreshToken: false,
            detectSessionInUrl: false
          }
        });

        // Récupérer les partenaires actifs
        const { data, error } = await supabase
          .from('partners')
          .select('id, name, description, logo_url, website_url, active')
          .eq('active', true);

        if (error) {
          console.error('Erreur lors du chargement des partenaires:', error);
          // Utiliser un partenaire aléatoire des données de fallback
          setPartner(getRandomPartner(FALLBACK_PARTNERS));
        } else if (data && data.length > 0) {
          // Sélectionner un partenaire aléatoire
          setPartner(getRandomPartner(data));
        } else {
          // Utiliser un partenaire aléatoire des données de fallback
          setPartner(getRandomPartner(FALLBACK_PARTNERS));
        }
      } catch (err) {
        console.error('Erreur lors de la connexion à Supabase:', err);
        // Utiliser un partenaire aléatoire des données de fallback
        setPartner(getRandomPartner(FALLBACK_PARTNERS));
      } finally {
        setLoading(false);
      }
    };

    fetchPartner();
  }, []);

  // Rediriger vers le site du partenaire
  const visitPartner = (websiteUrl: string | null) => {
    if (websiteUrl) {
      window.open(websiteUrl, '_blank', 'noopener,noreferrer');
    }
  };

  if (loading) {
    return (
      <div className="bg-light-secondary dark:bg-dark-secondary h-40 w-full rounded-lg animate-pulse">
        <div className="h-full w-full flex items-center justify-center">
          <Building2 size={24} className="text-gray-400/50 animate-pulse" />
        </div>
      </div>
    );
  }

  if (!partner) {
    return null;
  }

  // Générer des couleurs aléatoires pour le gradient
  const gradients = [
    'from-blue-500 to-purple-600',
    'from-emerald-500 to-teal-600',
    'from-orange-500 to-amber-600',
    'from-indigo-500 to-blue-600',
    'from-rose-500 to-pink-600',
  ];
  
  const randomGradient = gradients[Math.floor(Math.random() * gradients.length)];

  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg overflow-hidden relative mb-4">
      {/* Badge "Partenaire" */}
      <div className="absolute top-2 right-2 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs px-2 py-1 rounded-full">
        Partenaire
      </div>
      
      <div className="flex flex-col">
        <div className="flex items-center space-x-3 mb-3">
          <div className="w-14 h-14 flex-shrink-0 rounded-md overflow-hidden bg-gray-100 dark:bg-white flex items-center justify-center p-1">
            {partner.logo_url ? (
              <img
                src={partner.logo_url}
                alt={partner.name}
                className="w-full h-full object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                  (e.target as HTMLImageElement).parentElement!.innerHTML = '<div class="flex items-center justify-center h-full w-full"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-white"><path d="M18 21V6a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v15"></path><path d="M2 9h20"></path><path d="M21 19V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14"></path></svg></div>';
                }}
              />
            ) : (
              <Building2 size={28} className="text-white" />
            )}
          </div>
          <div className="flex-1">
            <h4 className="text-base font-semibold text-gray-800 dark:text-white">
              {partner.name}
            </h4>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Partenaire de confiance
            </p>
          </div>
        </div>
        
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 line-clamp-2">
          {partner.description}
        </p>
        
        <div className="flex justify-end">
          <button
            onClick={() => visitPartner(partner.website_url)}
            className="bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 flex items-center space-x-1"
          >
            <span>Découvrir</span>
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default PartnerAds; 