'use client';

import { Search, Filter, X, Users } from 'lucide-react';
import { useEffect, useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Expert } from '@/lib/actions';
import PageHeader from '@/components/PageHeader';
import { FilterDropdown } from "@/components/FilterModal";

interface Location {
  pays: string;
  villes: string[];
}

interface Expertise {
  id: string;
  name: string;
}

const ExpertCard = ({ expert }: { expert: Expert }) => {
  const router = useRouter();

  return (
    <Link
      href={`/expert/${expert.id_expert}`}
      key={expert.id}
      className="group relative w-full aspect-[4/5] rounded-xl overflow-hidden bg-white dark:bg-gray-800 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02]"
    >
      {/* Image Section - Top 60% */}
      <div className="absolute inset-0 h-[60%]">
        {expert.image_url ? (
          <Image
            src={expert.image_url}
            alt={`${expert.prenom} ${expert.nom}`}
            fill
            className="object-cover"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.onerror = null;
              target.src = '/placeholder-image.jpg';
            }}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
            <Users className="w-20 h-20 text-gray-600" />
          </div>
        )}
      </div>

      {/* Content Section - Bottom 40% */}
      <div className="absolute bottom-0 left-0 right-0 h-[45%] bg-black/90 backdrop-blur-sm p-4">
        {/* Name and Location */}
        <div className="space-y-1 mb-2">
          <h2 className="text-xl font-bold text-white">
            {expert.prenom}
          </h2>
          <div className="flex items-center text-white/80 text-xs">
            <svg className="w-3 h-3 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Localisé(e) à {expert.ville}
          </div>
        </div>

        {/* Price */}
        {expert.tarif && (
          <div className="mb-2">
            <div className="inline-block px-2 py-0.5 bg-white/20 backdrop-blur-sm rounded-full text-white text-xs">
              {expert.tarif}€<span className="text-xs">/jour</span>
            </div>
          </div>
        )}

        {/* Expertise Title */}
        <h3 className="text-sm font-semibold text-white mb-1.5">
          {expert.expertises.split(',')[0]}
        </h3>
        
        {/* Expertise Tags */}
        <div className="flex flex-wrap gap-1">
          {expert.expertises.split(',').slice(1).map((expertise, index) => (
            <span
              key={index}
              className="px-2 py-0.5 text-xs font-medium rounded-full bg-white/10 text-white backdrop-blur-sm"
            >
              {expertise.trim()}
            </span>
          ))}
        </div>
      </div>
    </Link>
  );
};

const Page = () => {
  const [experts, setExperts] = useState<Expert[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPays, setSelectedPays] = useState('');
  const [selectedVille, setSelectedVille] = useState('');
  const [locations, setLocations] = useState<Location[]>([]);
  const [selectedExpertises, setSelectedExpertises] = useState<string[]>([]);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const handleThemeToggle = () => {
    setIsDarkMode(!isDarkMode);
    // Ajoutez ici votre logique de changement de thème
  };

  // Calcul du nombre de filtres actifs
  const activeFiltersCount = [
    ...(selectedExpertises.length > 0 ? [1] : []),
    selectedPays,
    selectedVille
  ].filter(Boolean).length;

  // Mise à jour de fetchExperts pour inclure la recherche
  const fetchExperts = useCallback(async () => {
    try {
      let query = supabase
        .from('experts')
        .select('*');

      // Ajout du filtre de recherche
      if (searchQuery) {
        query = query.or(`nom.ilike.%${searchQuery}%,prenom.ilike.%${searchQuery}%,expertises.ilike.%${searchQuery}%`);
      }

      if (selectedExpertises.length > 0) {
        query = query.contains('expertises', selectedExpertises);
      }

      if (selectedPays) {
        query = query.eq('pays', selectedPays);
      }

      if (selectedVille) {
        query = query.eq('ville', selectedVille);
      }

      const { data, error } = await query;
          
      if (error) throw error;
      setExperts(data);
    } catch (err: any) {
      console.error('Error fetching experts:', err.message);
      toast.error('Erreur lors du chargement des experts');
    } finally {
      setLoading(false);
    }
  }, [selectedPays, selectedVille, selectedExpertises, searchQuery]);

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

  // Reset ville quand le pays change
  useEffect(() => {
    setSelectedVille('');
  }, [selectedPays]);

  useEffect(() => {
    fetchExperts();
    fetchLocations();
  }, [fetchExperts]);

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
                          Plus de 300 experts à votre écoute
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        {/* Search Bar - Hidden on mobile, showing only icon */}
                        <div className="relative md:w-64 w-auto">
                          <div className="md:hidden">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setIsSearchOpen(!isSearchOpen)}
                              className="h-8 w-8"
                            >
                              <Search className="h-4 w-4" />
                            </Button>
                          </div>
                          <div className="hidden md:block relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <Input
                              type="text"
                              placeholder="Rechercher..."
                              value={searchQuery}
                              onChange={(e) => setSearchQuery(e.target.value)}
                              className="pl-10 w-full bg-transparent"
                            />
                          </div>
                        </div>
                        
                        <div className="relative">
                          <Button 
                            onClick={() => setIsFilterOpen(!isFilterOpen)}
                            variant="outline"
                            className="flex items-center gap-2"
                          >
                            <Filter size={18} />
                            <span className="hidden md:inline">Filter</span>
                            {activeFiltersCount > 0 && (
                              <span className="bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full">
                                {activeFiltersCount}
                              </span>
                            )}
                          </Button>

                          {/* Desktop Dropdown Container */}
                          <div className="hidden md:block">
                            <FilterDropdown
                              selectedPays={selectedPays}
                              setSelectedPays={setSelectedPays}
                              selectedVille={selectedVille}
                              setSelectedVille={setSelectedVille}
                              selectedExpertises={selectedExpertises}
                              setSelectedExpertises={setSelectedExpertises}
                              locations={locations}
                              experts={experts}
                              isOpen={isFilterOpen}
                              onClose={() => setIsFilterOpen(false)}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="max-w-[1800px] mx-auto pt-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-28 lg:pb-8">
                  {experts && experts.length > 0 ? (
                    experts.map((expert) => (
                      <ExpertCard key={expert.id} expert={expert} />
                    ))
                  ) : (
                    <p className="col-span-full text-center text-gray-500">
                      Aucun expert trouvé
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Mobile Search Overlay */}
      {isSearchOpen && (
        <div className="fixed inset-0 bg-light-secondary dark:bg-dark-secondary z-50 md:hidden">
          <div className="flex items-center p-4 border-b border-gray-200 dark:border-gray-700">
            <Search className="text-gray-400 w-4 h-4 mr-3" />
            <Input
              type="text"
              placeholder="Rechercher..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-transparent border-none focus:ring-0"
              autoFocus
            />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsSearchOpen(false)}
              className="ml-2 h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Mobile Filter Modal */}
      <div className="md:hidden">
        <FilterDropdown
          selectedPays={selectedPays}
          setSelectedPays={setSelectedPays}
          selectedVille={selectedVille}
          setSelectedVille={setSelectedVille}
          selectedExpertises={selectedExpertises}
          setSelectedExpertises={setSelectedExpertises}
          locations={locations}
          experts={experts}
          isOpen={isFilterOpen}
          onClose={() => setIsFilterOpen(false)}
        />
      </div>
    </>
  );
};

export default Page;
