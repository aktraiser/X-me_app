'use client'

import { useState } from 'react'
import { Dialog, DialogBackdrop, DialogPanel, Disclosure, DisclosureButton, DisclosurePanel } from '@headlessui/react'
import { X, ChevronDown, Plus } from 'lucide-react'

interface SidebarFiltersProps {
  selectedVille: string;
  setSelectedVille: (ville: string) => void;
  selectedActivite: string;
  setSelectedActivite: (activite: string) => void;
  locations: { pays: string; villes: string[] }[];
  experts: any[] | null;
  mobileFiltersOpen?: boolean;
  setMobileFiltersOpen?: (open: boolean) => void;
}

const SidebarFilters: React.FC<SidebarFiltersProps> = ({
  selectedVille,
  setSelectedVille,
  selectedActivite,
  setSelectedActivite,
  locations,
  experts,
  mobileFiltersOpen: externalMobileFiltersOpen,
  setMobileFiltersOpen: externalSetMobileFiltersOpen
}) => {
  const [internalMobileFiltersOpen, setInternalMobileFiltersOpen] = useState(false)
  
  // Utiliser les états fournis ou internes
  const isOpen = externalMobileFiltersOpen !== undefined ? externalMobileFiltersOpen : internalMobileFiltersOpen;
  const setOpen = externalSetMobileFiltersOpen || setInternalMobileFiltersOpen;

  // Extraire toutes les activités uniques des experts
  // Les activités peuvent être stockées dans 'activité' ou séparées dans 'expertises'
  const allActivites = new Set<string>();
  experts?.forEach(expert => {
    if (expert.activité) {
      allActivites.add(expert.activité);
    } else if (expert.expertises) {
      // Si pas d'activité définie, on utilise les expertises qui sont séparées par des points-virgules
      const expertisesList = expert.expertises.split(';');
      expertisesList.forEach((expertise: string) => {
        if (expertise.trim()) {
          allActivites.add(expertise.trim());
        }
      });
    }
  });

  // Récupérer toutes les villes de tous les pays
  const allVilles = new Set<string>();
  locations.forEach(location => {
    location.villes.forEach(ville => {
      allVilles.add(ville);
    });
  });

  const filters = [
    {
      id: 'ville',
      name: 'Ville',
      options: Array.from(allVilles).sort().map(ville => ({ value: ville, label: ville })),
    },
    {
      id: 'activité',
      name: 'Activité',
      options: Array.from(allActivites).sort().map(act => ({ value: act, label: act })),
    },
  ];

  // Fonction pour gérer la sélection/désélection des activités
  const handleActiviteChange = (activite: string) => {
    if (selectedActivite === activite) {
      // Si la même activité est sélectionnée, on la désélectionne
      setSelectedActivite('');
    } else {
      setSelectedActivite(activite);
    }
  };

  // Fonction pour gérer la sélection/désélection des villes
  const handleVilleChange = (ville: string) => {
    if (selectedVille === ville) {
      // Si la même ville est sélectionnée, on la désélectionne
      setSelectedVille('');
    } else {
      setSelectedVille(ville);
    }
  };

  // Fonction pour réinitialiser tous les filtres
  const resetFilters = () => {
    setSelectedVille('');
    setSelectedActivite('');
  };

  return (
    <div>
      {/* Mobile filter dialog */}
      <Dialog open={isOpen} onClose={setOpen} className="relative z-40 lg:hidden">
        <DialogBackdrop
          transition
          className="fixed inset-0 bg-black/25 transition-opacity duration-300 ease-linear data-[closed]:opacity-0"
        />

        <div className="fixed inset-0 z-40 flex">
          <DialogPanel
            transition
            className="relative flex w-full flex-col overflow-y-auto bg-white dark:bg-gray-900 py-4 pb-6 shadow-xl transition duration-300 ease-in-out data-[closed]:translate-x-full"
          >
            <div className="flex items-center justify-between px-4">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white">Filtres</h2>
              <div className="flex items-center">
                <button
                  type="button"
                  onClick={resetFilters}
                  className="mr-2 text-sm text-orange-500 dark:text-orange-400 hover:text-orange-600 dark:hover:text-orange-300"
                >
                  Réinitialiser
                </button>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="-mr-2 flex size-10 items-center justify-center p-2 text-gray-400 hover:text-gray-500 dark:text-gray-300 dark:hover:text-gray-200"
                >
                  <span className="sr-only">Fermer menu</span>
                  <X className="size-6" />
                </button>
              </div>
            </div>

            {/* Filters */}
            <form className="mt-4 px-4">
              {filters.map((section) => (
                <Disclosure key={section.name} as="div" className="border-t border-gray-200 dark:border-gray-700 pb-4 pt-4" defaultOpen={true}>
                  <fieldset>
                    <legend className="w-full px-2">
                      <DisclosureButton className="group flex w-full items-center justify-between p-2 text-gray-400 hover:text-gray-500 dark:text-gray-300 dark:hover:text-gray-200">
                        <span className="text-sm font-medium text-gray-900 dark:text-white">{section.name}</span>
                        <span className="ml-6 flex h-7 items-center">
                          <ChevronDown
                            className="size-5 rotate-0 transform group-data-[open]:-rotate-180"
                          />
                        </span>
                      </DisclosureButton>
                    </legend>
                    <DisclosurePanel className="px-4 pb-2 pt-4">
                      <div className="space-y-6">
                        {section.options.map((option, optionIdx) => (
                          <div key={option.value} className="flex gap-3">
                            <div className="flex h-5 shrink-0 items-center">
                              <div className="group grid size-4 grid-cols-1">
                                {section.id === 'ville' ? (
                                  <input
                                    value={option.value}
                                    id={`${section.id}-${optionIdx}-mobile`}
                                    name={`${section.id}[]`}
                                    type="radio"
                                    checked={selectedVille === option.value}
                                    onChange={() => handleVilleChange(option.value)}
                                    className="col-start-1 row-start-1 h-4 w-4 border-gray-300 text-orange-500 focus:ring-orange-500 dark:border-gray-600 dark:bg-gray-800"
                                  />
                                ) : (
                                  <input
                                    value={option.value}
                                    id={`${section.id}-${optionIdx}-mobile`}
                                    name={`${section.id}[]`}
                                    type="radio"
                                    checked={selectedActivite === option.value}
                                    onChange={() => handleActiviteChange(option.value)}
                                    className="col-start-1 row-start-1 h-4 w-4 border-gray-300 text-orange-500 focus:ring-orange-500 dark:border-gray-600 dark:bg-gray-800"
                                  />
                                )}
                              </div>
                            </div>
                            <label htmlFor={`${section.id}-${optionIdx}-mobile`} className="text-sm text-gray-500 dark:text-gray-300">
                              {option.label}
                            </label>
                          </div>
                        ))}
                      </div>
                    </DisclosurePanel>
                  </fieldset>
                </Disclosure>
              ))}
            </form>
            
            {/* Bouton Réinitialiser pour le mobile */}
            <div className="mt-auto px-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={() => {
                  resetFilters();
                  setOpen(false);
                }}
                className="w-full py-2.5 px-4 bg-orange-500 hover:bg-orange-600 text-white rounded-md font-medium transition-colors dark:bg-orange-600 dark:hover:bg-orange-700"
              >
                Réinitialiser les filtres
              </button>
            </div>
          </DialogPanel>
        </div>
      </Dialog>

      <div>
        <h2 className="sr-only">Filtres</h2>

        <div className="hidden lg:block">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white">Filtres</h2>
            <button
              type="button"
              onClick={resetFilters}
              className="text-sm text-orange-500 dark:text-orange-400 hover:text-orange-600 dark:hover:text-orange-300"
            >
              Réinitialiser
            </button>
          </div>
          <div className="border-b border-gray-200 dark:border-gray-700 mb-6"></div>
          <form className="divide-y divide-gray-200">
            {filters.map((section) => (
              <div key={section.name} className="py-10 first:pt-0 last:pb-0">
                <fieldset>
                  <legend className="block text-sm font-medium text-gray-900 dark:text-white">{section.name}</legend>
                  <div className="space-y-3 pt-6">
                    {section.options.map((option, optionIdx) => (
                      <div key={option.value} className="flex gap-3">
                        <div className="flex h-5 shrink-0 items-center">
                          <div className="group grid size-4 grid-cols-1">
                            {section.id === 'ville' ? (
                              <input
                                value={option.value}
                                id={`${section.id}-${optionIdx}`}
                                name={`${section.id}[]`}
                                type="radio"
                                checked={selectedVille === option.value}
                                onChange={() => handleVilleChange(option.value)}
                                className="h-4 w-4 border-gray-300 text-orange-500 focus:ring-orange-500"
                              />
                            ) : (
                              <input
                                value={option.value}
                                id={`${section.id}-${optionIdx}`}
                                name={`${section.id}[]`}
                                type="radio"
                                checked={selectedActivite === option.value}
                                onChange={() => handleActiviteChange(option.value)}
                                className="h-4 w-4 border-gray-300 text-orange-500 focus:ring-orange-500"
                              />
                            )}
                          </div>
                        </div>
                        <label htmlFor={`${section.id}-${optionIdx}`} className="text-sm text-gray-600 dark:text-gray-300">
                          {option.label}
                        </label>
                      </div>
                    ))}
                  </div>
                </fieldset>
              </div>
            ))}
          </form>
        </div>
      </div>
    </div>
  )
}

export default SidebarFilters 