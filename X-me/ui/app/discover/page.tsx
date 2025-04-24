'use client';

import { Search, Filter, X, Users, MapPin, Star, Briefcase, Clock, XCircle } from 'lucide-react';
import { useEffect, useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Expert } from '@/types/index';
import PageHeader from '@/components/PageHeader';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import ExpertDrawer from './components/ExpertDrawer';
import ExpertCard from '@/components/ExpertCard';
import SidebarFilters from './components/SidebarFilters';
import BecomeExpertCard from './components/BecomeExpertCard';

interface Location {
  pays: string;
  villes: string[];
}

interface Activité {
  id: string;
  name: string;
}

const Page = () => {
  const [experts, setExperts] = useState<Expert[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVille, setSelectedVille] = useState('');
  const [locations, setLocations] = useState<Location[]>([]);
  const [selectedActivite, setSelectedActivite] = useState('');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  
  // État pour le drawer d'expert
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedExpert, setSelectedExpert] = useState<Expert | null>(null);

  // Fonction pour ouvrir le drawer avec l'expert sélectionné
  const openExpertDrawer = (expert: Expert) => {
    setSelectedExpert(expert);
    setDrawerOpen(true);
  };

  const handleThemeToggle = () => {
    setIsDarkMode(!isDarkMode);
    // Ajoutez ici votre logique de changement de thème
  };

  // Calcul du nombre de filtres actifs
  const activeFiltersCount = [
    ...(selectedActivite.length > 0 ? [1] : []),
    selectedVille
  ].filter(Boolean).length;

  // Mise à jour de fetchExperts pour inclure la recherche
  const fetchExperts = useCallback(async () => {
    try {
      let query = supabase
        .from('experts')
        .select('*');

      // Improved search functionality
      if (searchQuery.trim()) {
        const searchTerms = searchQuery.trim().toLowerCase().split(/\s+/);
        
        query = query.or(
          searchTerms.map(term => `or(nom.ilike.%${term}%,prenom.ilike.%${term}%,expertises.ilike.%${term}%,ville.ilike.%${term}%,pays.ilike.%${term}%)`).join(',')
        );
      }

      // Préparer les filtres d'activité et de ville
      let activiteFilter = '';
      if (selectedActivite) {
        activiteFilter = `or(expertises.ilike.%;${selectedActivite.trim()}%,expertises.ilike.%${selectedActivite.trim()};%,activité.eq.${selectedActivite.trim()})`;
      }
      
      // Appliquer les filtres
      if (selectedActivite && selectedVille) {
        // Si les deux filtres sont actifs, on utilise une requête plus spécifique
        query = query
          .or(activiteFilter)
          .eq('ville', selectedVille);
      } else {
        // Sinon, on applique chaque filtre individuellement
        if (selectedActivite) {
          query = query.or(activiteFilter);
        }
        
        if (selectedVille) {
          query = query.eq('ville', selectedVille);
        }
      }

      const { data, error } = await query;
          
      if (error) {
        console.error('Supabase query error:', error);
        throw error;
      }
      
      // Sort results by relevance if there's a search query
      if (searchQuery.trim()) {
        const searchTerms = searchQuery.toLowerCase().split(/\s+/);
        data.sort((a, b) => {
          const aRelevance = calculateRelevance(a, searchTerms);
          const bRelevance = calculateRelevance(b, searchTerms);
          return bRelevance - aRelevance;
        });
      }
      
      setExperts(data);
    } catch (err: any) {
      console.error('Error fetching experts:', err.message);
      toast.error('Erreur lors du chargement des experts');
    } finally {
      setLoading(false);
    }
  }, [searchQuery, selectedVille, selectedActivite]);

  // Add helper function for calculating search relevance
  const calculateRelevance = (expert: Expert, searchTerms: string[]) => {
    let score = 0;
    const expertises = expert.expertises.split(';').map(exp => exp.trim());
    const expertText = `${expert.nom} ${expert.prenom} ${expertises.join(' ')} ${expert.ville} ${expert.pays}`.toLowerCase();
    
    searchTerms.forEach(term => {
      // Exact matches get higher scores
      if (expert.nom.toLowerCase() === term || expert.prenom.toLowerCase() === term) {
        score += 10;
      }
      // Partial matches in name or expertise get medium scores
      if (expert.nom.toLowerCase().includes(term) || expert.prenom.toLowerCase().includes(term)) {
        score += 5;
      }
      // Check each expertise individually
      expertises.forEach(expertise => {
        if (expertise.toLowerCase() === term) {
          score += 5; // Exact expertise match
        } else if (expertise.toLowerCase().includes(term)) {
          score += 3; // Partial expertise match
        }
      });
      // Location matches get lower scores
      if (expert.ville.toLowerCase().includes(term) || expert.pays.toLowerCase().includes(term)) {
        score += 2;
      }
      // General content match
      if (expertText.includes(term)) {
        score += 1;
      }
    });
    
    return score;
  };

  // Récupérer la liste des pays et villes uniques
  const fetchLocations = async () => {
    try {
      const { data, error } = await supabase
        .from('experts')
        .select('pays, ville');
      
      if (error) throw error;

      // Créer un objet avec pays et villes uniques
      const locationMap = new Map<string, Set<string>>();
      
      data.forEach(expert => {
        if (expert.pays) {
          if (!locationMap.has(expert.pays)) {
            locationMap.set(expert.pays, new Set());
          }
          if (expert.ville) {
            locationMap.get(expert.pays)?.add(expert.ville);
          }
        }
      });

      // Convertir en tableau trié
      const sortedLocations = Array.from(locationMap).map(([pays, villes]) => ({
        pays,
        villes: Array.from(villes).sort()
      })).sort((a, b) => a.pays.localeCompare(b.pays));

      setLocations(sortedLocations);
    } catch (err: any) {
      console.error('Error fetching locations:', err.message);
    }
  };

  // Trigger search when filters change
  useEffect(() => {
    fetchExperts();
  }, [searchQuery, selectedVille, selectedActivite, fetchExperts]);

  // Add debounce for search query
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchExperts();
    }, 300); // 300ms delay

    return () => clearTimeout(timer);
  }, [searchQuery, fetchExperts]);

  // Separate useEffect for initial load and location fetching
  useEffect(() => {
    fetchLocations();
  }, []);

  // Close filter dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setIsFilterOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <>
      <PageHeader
        title="Nos Experts"
        icon={<Users className="w-6 h-6" />}
      />
      <main className="min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {loading ? (
            <div className="flex flex-row items-center justify-center min-h-screen">
              <svg
                aria-hidden="true"
                className="w-8 h-8 text-light-200 fill-light-secondary dark:text-[#202020] animate-spin dark:fill-[#ffffff3b]"
                viewBox="0 0 100 101"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M100 50.5908C100.003 78.2051 78.1951 100.003 50.5908 100C22.9765 99.9972 0.997224 78.018 1 50.4037C1.00281 22.7993 22.8108 0.997224 50.4251 1C78.0395 1.00281 100.018 22.8108 100 50.4251ZM9.08164 50.594C9.06312 73.3997 27.7909 92.1272 50.5966 92.1457C73.4023 92.1642 92.1298 73.4365 92.1483 50.6308C92.1669 27.8251 73.4392 9.0973 50.6335 9.07878C27.8278 9.06026 9.10003 27.787 9.08164 50.594Z"
                  fill="currentColor"
                />
                <path
                  d="M93.9676 39.0409C96.393 38.4037 97.8624 35.9116 96.9801 33.5533C95.1945 28.8227 92.871 24.3692 90.0681 20.348C85.6237 14.1775 79.4473 9.36872 72.0454 6.45794C64.6435 3.54717 56.3134 2.65431 48.3133 3.89319C45.869 4.27179 44.3768 6.77534 45.014 9.20079C45.6512 11.6262 48.1343 13.0956 50.5786 12.717C56.5073 11.8281 62.5542 12.5399 68.0406 14.7911C73.527 17.0422 78.2187 20.7487 81.5841 25.4923C83.7976 28.5886 85.4467 32.059 86.4416 35.7474C87.1273 38.1189 89.5423 39.6781 91.9676 39.0409Z"
                  fill="currentFill"
                />
              </svg>
            </div>
          ) : (
            <div className="pb-24 lg:pb-0">
              {/* Sticky Header */}
              <div className="sticky top-0 z-40 -mx-4 sm:-mx-6 lg:-mx-8 backdrop-blur-md">
                <div className="px-4 sm:px-6 lg:px-8 py-4">
                  <div className="flex flex-col pt-4">
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col">
                        <div className="text-gray-500">
                          Trouver votre expert en accommpagnement
                        </div>
                      </div>
                      {/* Bouton de filtre mobile */}
                      <button
                        type="button"
                        onClick={() => setIsFilterOpen(true)}
                        className="flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700 dark:hover:bg-gray-700 lg:hidden"
                      >
                        <Filter className="mr-2 h-4 w-4" />
                        <span>Filtres</span>
                        {activeFiltersCount > 0 && (
                          <span className="ml-1 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-800 dark:text-indigo-100">
                            {activeFiltersCount}
                          </span>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="max-w-[1800px] mx-auto pt-6">
                <div className="lg:grid lg:grid-cols-4 lg:gap-x-8">
                  {/* Sidebar filters - Desktop */}
                  <aside className="hidden lg:block">
                    <SidebarFilters
                      selectedVille={selectedVille}
                      setSelectedVille={setSelectedVille}
                      selectedActivite={selectedActivite}
                      setSelectedActivite={setSelectedActivite}
                      locations={locations}
                      experts={experts}
                      mobileFiltersOpen={isFilterOpen}
                      setMobileFiltersOpen={setIsFilterOpen}
                    />
                  </aside>

                  {/* Mobile filters modal - Supprimé car maintenant géré dans SidebarFilters */}

                  {/* Expert list */}
                  <div className="lg:col-span-3">
                    <div className="grid grid-cols-1 gap-6 pb-28 lg:pb-8">
                      {/* Carte de promotion pour devenir expert */}
                      <BecomeExpertCard onContactClick={() => toast.info('Fonctionnalité en développement')} />
                      
                      {experts && experts.length > 0 ? (
                        experts.map((expert) => (
                          <ExpertCard 
                            key={expert.id} 
                            expert={expert} 
                            onClick={() => openExpertDrawer(expert)}
                          />
                        ))
                      ) : (
                        <p className="col-span-full text-center text-gray-500">
                          Aucun expert trouvé
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Expert Drawer */}
      <ExpertDrawer 
        expert={selectedExpert} 
        open={drawerOpen} 
        setOpen={setDrawerOpen}
        className="max-w-5xl"
      />
    </>
  );
};

export default Page;
