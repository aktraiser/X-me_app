import { useState } from 'react';
import { ChevronRight, ChevronLeft, Store, ShoppingBag, Building2, Palette, Leaf, Coffee, Home, Factory, Globe, Briefcase, Heart, Building, Users, Tent, Car, Euro } from 'lucide-react';
import { Transition } from "@headlessui/react";

interface Sector {
  name: string;
  subsectors?: string[];
}

const regions = [
  { name: "Auvergne-Rhône-Alpes", cities: ["Lyon", "Grenoble", "Saint-Étienne", "Clermont-Ferrand", "Annecy"] },
  { name: "Bourgogne-Franche-Comté", cities: ["Dijon", "Besançon", "Belfort", "Chalon-sur-Saône", "Nevers"] },
  { name: "Bretagne", cities: ["Rennes", "Brest", "Quimper", "Saint-Malo", "Vannes"] },
  { name: "Centre-Val de Loire", cities: ["Orléans", "Tours", "Bourges", "Blois", "Chartres"] },
  { name: "Corse", cities: ["Ajaccio", "Bastia", "Porto-Vecchio", "Calvi", "Corte"] },
  { name: "Grand Est", cities: ["Strasbourg", "Reims", "Metz", "Nancy", "Mulhouse"] },
  { name: "Hauts-de-France", cities: ["Lille", "Amiens", "Calais", "Dunkerque", "Roubaix"] },
  { name: "Île-de-France", cities: ["Paris", "Versailles", "Saint-Denis", "Boulogne-Billancourt", "Argenteuil"] },
  { name: "Normandie", cities: ["Rouen", "Caen", "Le Havre", "Cherbourg", "Évreux"] },
  { name: "Nouvelle-Aquitaine", cities: ["Bordeaux", "Limoges", "Poitiers", "La Rochelle", "Pau"] },
  { name: "Occitanie", cities: ["Toulouse", "Montpellier", "Nîmes", "Perpignan", "Albi"] },
  { name: "Pays de la Loire", cities: ["Nantes", "Angers", "Le Mans", "Saint-Nazaire", "Cholet"] },
  { name: "Provence-Alpes-Côte d'Azur", cities: ["Marseille", "Nice", "Toulon", "Aix-en-Provence", "Avignon"] }
];

const budgetRanges = [
  "Moins de 15 000€",
  "15 000€ - 30 000€",
  "30 000€ - 50 000€",
  "50 000€ - 100 000€",
  "100 000€ - 200 000€",
  "Plus de 200 000€"
];

const sectors: Sector[] = [
  {
    name: "Commerce alimentaire",
    subsectors: [
      "Boulangerie",
      "Épicerie",
      "Caviste",
      "Commerce bio",
      "Épicerie fine",
      "Primeur",
      "Pâtisserie artisanale"
    ]
  },
  {
    name: "Commerce non alimentaire",
    subsectors: [
        "Boutique Deco",
        "Fleuriste",
        "Prêt à Porter",
        "Velo",
        "Bijou Fantaisie",
        "Cordonnerie",
        "Librairie"
    ]
  },
  {
    name: "Construction - Bâtiment",
    subsectors: [
        "Peinture",
        "Maconnerie",
        "Menuiserie",
        "Plomberie",
        "Eclectricité",
        "Jardinier Paysagiste"
    ]
  },
  {
    name: "Culture - Arts - Communication",
    subsectors: [
        "Agence Evenementiel",
        "Métier d'Art",
        "Loisir Créatifs"
    ]
  },
  {
    name: "Développement Durable",
    subsectors: [
        "Construction"
    ]
  },
  {
    name: "Hôtellerie - Café - Restauration",
    subsectors: [
        "Brasserie",
        "Restauration Rapide",
        "Restauration Traditionnelle",
        "Restauration Nomade",
        "Café Bistrot",
        "Coffee Shop"
    ]
  },
  {
    name: "Immobilier",
    subsectors: [
        "Diagnostiqueur Immobilier",
        "Agence Immobilière"
    ]
  },
  {
    name: "Industrie - Mode",
    subsectors: [
        "Créateur de marque"
    ]
  },
  {
    name: "Internet - Edition - Média",
    subsectors: [
        "Influenceur",
        "Marketing Digital"
    ]
  },
  {
    name: "Profession Libérales",
    subsectors: [
        "Design",
        "Coach Sportif",
        "Consultant",
        "Enseignant Independant",
        "Formation Pro",
        "Traducteur Interprete",
        "Coach",
        "Professeur de Yoga",
        "Soutien Scolaire"
    ]
  },
  {
    name: "Santé - Bien - Beauté",
    subsectors: [
        "Naturopathe",
        "Reflexo Shiatsu",
        "Sophrologie",
        "Coiffeur",
        "Esthétique",
        "Osthéochiro",
        "Psychologue"
    ]
  },
  {
    name: "Services aux Entreprises",
    subsectors: [
        "Architecture Intérieur",
        "Décorateur d'Intérieur",
        "Secretaire",
        "Nettoyage"
    ]
  },
  {
    name: "Services aux Particuliers",
    subsectors: [
        "Conciergerie Location",
        "Homme toute Main",
        "Salon de Tatouage",
        "Assistante Maternelle",
        "Créche Assistante",
        "Organisateur de Mariage",
        "Retouche Vêtements"
    ]
  },
  {
    name: "Tourisme - Nature - Monde rural",
    subsectors: [
        "Gite Chambre d'Hôte",
        "Agriculture Urbaine"
    ]
  },
  {
    name: "Transport - Automobile",
    subsectors: [
        "Taxi",
        "Chauffeur VTC",
        "Garage"
    ]
  },

];

interface StepperProps {
  onSectorSelect: (data: {
    sector: string;
    subsector?: string;
    region: string;
    city: string;
    budget: string;
  }) => void;
}

const SectorStepper = ({ onSectorSelect }: StepperProps) => {
  const [step, setStep] = useState<'main' | 'sub' | 'region' | 'city' | 'budget'>('main');
  const [selectedSector, setSelectedSector] = useState<Sector | null>(null);
  const [selectedSubsector, setSelectedSubsector] = useState<string | null>(null);
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [selectedBudget, setSelectedBudget] = useState<string | null>(null);

  const steps = ['main', 'sub', 'region', 'city', 'budget'];
  const currentStepIndex = steps.indexOf(step);
  const totalSteps = 5; // Changed from 3 to 5 to account for all steps
  const currentMainStep = currentStepIndex + 1; // Simplified to use actual step index

  const getStepMessage = () => {
    switch(step) {
      case 'main':
        return "Sélectionnez votre secteur d'activité";
      case 'sub':
        return "Sélectionnez votre sous-secteur";
      case 'region':
        return "Sélectionnez votre région";
      case 'city':
        return "Sélectionnez votre ville";
      case 'budget':
        return "Sélectionnez votre budget";
      default:
        return "Step message";
    }
  };

  const getSectorIcon = (sectorName: string) => {
    const icons: { [key: string]: any } = {
      "Commerce alimentaire": Store,
      "Commerce non alimentaire": ShoppingBag,
      "Construction - Bâtiment": Building2,
      "Culture - Arts - Communication": Palette,
      "Développement Durable": Leaf,
      "Hôtellerie - Café - Restauration": Coffee,
      "Immobilier": Home,
      "Industrie - Mode": Factory,
      "Internet - Edition - Média": Globe,
      "Profession Libérales": Briefcase,
      "Santé - Bien - Beauté": Heart,
      "Services aux Entreprises": Building,
      "Services aux Particuliers": Users,
      "Tourisme - Nature - Monde rural": Tent,
      "Transport - Automobile": Car,
    };
    const Icon = icons[sectorName] || Store;
    return <Icon size={24} className="text-primary" />;
  };

  const handleSectorClick = (sector: Sector) => {
    setSelectedSector(sector);
    if (!sector.subsectors?.length) {
      setStep('region');
    } else {
      setStep('sub');
    }
  };

  const handleSubsectorClick = (subsector: string) => {
    setSelectedSubsector(subsector);
    setStep('region');
  };

  const handleRegionClick = (region: string) => {
    setSelectedRegion(region);
    setStep('city');
  };

  const handleCityClick = (city: string) => {
    setSelectedCity(city);
    setStep('budget');
  };

  const handleBudgetClick = (budget: string) => {
    setSelectedBudget(budget);
    if (selectedSector) {
      onSectorSelect({
        sector: selectedSector.name,
        subsector: selectedSubsector || undefined,
        region: selectedRegion!,
        city: selectedCity!,
        budget: budget
      });
    }
  };

  const handleBack = () => {
    switch (step) {
      case 'sub':
        setStep('main');
        setSelectedSector(null);
        break;
      case 'region':
        setStep(selectedSubsector ? 'sub' : 'main');
        if (!selectedSubsector) setSelectedSector(null);
        setSelectedRegion(null);
        break;
      case 'city':
        setStep('region');
        setSelectedCity(null);
        break;
      case 'budget':
        setStep('city');
        setSelectedBudget(null);
        break;
    }
  };

  const getCurrentCities = () => {
    const region = regions.find(r => r.name === selectedRegion);
    return region ? region.cities : [];
  };

  return (
    <div className="w-full max-w-6xl mx-auto">
      <div className="mb-8">
        <div className="flex items-baseline gap-1 mb-1">
          <h1 className="text-primary text-3xl font-medium">Step {currentMainStep}</h1>
          <span className="text-gray-400 text-xl">/ {totalSteps}</span>
        </div>
        <h2 className="text-gray-600 dark:text-gray-300 text-lg mb-4">{getStepMessage()}</h2>
        <div className="w-full bg-gray-200 dark:bg-gray-700 h-1 rounded-full">
          <div
            className="bg-dark-200 h-full rounded-full transition-all duration-300"
            style={{ width: `${(currentMainStep / totalSteps) * 100}%` }}
          />
        </div>
      </div>

      {step !== 'main' && (
        <button
          onClick={handleBack}
          className="flex items-center text-primary mb-4 hover:text-primary/80 transition-colors"
        >
          <ChevronLeft size={14} />
          <span className="font-medium text-sm">Retour</span>
        </button>
      )}

      <Transition
        show={true}
        enter="transition-opacity duration-300"
        enterFrom="opacity-0"
        enterTo="opacity-100"
        leave="transition-opacity duration-300"
        leaveFrom="opacity-100"
        leaveTo="opacity-0"
      >
        <div key={step} className="transform transition-all duration-300">
          {step === 'main' && (
            <div>
              <div className="h-[calc(100vh-280px)] overflow-y-auto pr-2 custom-scrollbar">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                {sectors.map((sector) => (
                  <button
                    key={sector.name}
                    onClick={() => handleSectorClick(sector)}
                    className="flex flex-col items-center justify-center p-3 text-center bg-dark-100 hover:bg-gray-700 transition-all duration-200 rounded-xl aspect-[2.5/1] w-full"
                  >
                    <div className="flex items-center justify-center mb-2">
                      {getSectorIcon(sector.name)}
                    </div>
                    <div className="w-full flex flex-col items-center justify-center">
                      <span className="text-white text-sm font-medium block mb-1">
                        {sector.name}
                      </span>
                      <p className="text-xs text-gray-400">
                        {sector.subsectors?.length || 0} sous-secteurs
                      </p>
                    </div>
                  </button>
                ))}
              </div>
              </div>
            </div>
          )}

          {step === 'sub' && selectedSector && (
            <div>
              <div className="h-[calc(100vh-280px)] overflow-y-auto pr-2 custom-scrollbar">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                {selectedSector.subsectors?.map((subsector) => (
                  <button
                    key={subsector}
                    onClick={() => handleSubsectorClick(subsector)}
                    className="flex flex-col items-center justify-center p-3 text-center bg-dark-100 hover:bg-gray-700 transition-all duration-200 rounded-xl aspect-[2.5/1] w-full"
                  >
                    <div className="flex items-center justify-center mb-2">
                      {getSectorIcon(selectedSector.name)}
                    </div>
                    <div className="w-full flex flex-col items-center justify-center">
                      <span className="text-white text-sm font-medium block mb-1">
                        {subsector}
                      </span>
                      <p className="text-xs text-gray-400">
                        {selectedSector.name}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
              </div>
            </div>
          )}

          {step === 'region' && (
            <div>
              <div className="h-[calc(100vh-280px)] overflow-y-auto pr-2 custom-scrollbar">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                  {regions.map((region) => (
                    <button
                      key={region.name}
                      onClick={() => handleRegionClick(region.name)}
                      className="flex flex-col items-center justify-center p-3 text-center bg-dark-100 hover:bg-gray-700 transition-all duration-200 rounded-xl aspect-[2.5/1] w-full"
                    >
                      <div className="flex items-center justify-center mb-2">
                        <Building2 size={24} className="text-primary" />
                      </div>
                      <div className="w-full flex flex-col items-center justify-center">
                        <span className="text-white text-sm font-medium block mb-1">
                          {region.name}
                        </span>
                        <p className="text-xs text-gray-400">
                          {region.cities.length} villes
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 'city' && (
            <div>
              <div className="h-[calc(100vh-280px)] overflow-y-auto pr-2 custom-scrollbar">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                  {getCurrentCities().map((city) => (
                    <button
                      key={city}
                      onClick={() => handleCityClick(city)}
                      className="flex flex-col items-center justify-center p-3 text-center bg-dark-100 hover:bg-gray-700 transition-all duration-200 rounded-xl aspect-[2.5/1] w-full"
                    >
                      <div className="flex items-center justify-center mb-2">
                        <Building size={24} className="text-primary" />
                      </div>
                      <div className="w-full flex flex-col items-center justify-center">
                        <span className="text-white text-sm font-medium block mb-1">
                          {city}
                        </span>
                        <p className="text-xs text-gray-400">
                          {selectedRegion}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 'budget' && (
            <div>
              <div className="h-[calc(100vh-280px)] overflow-y-auto pr-2 custom-scrollbar">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                  {budgetRanges.map((budget) => (
                    <button
                      key={budget}
                      onClick={() => handleBudgetClick(budget)}
                      className="flex flex-col items-center justify-center p-3 text-center bg-dark-100 hover:bg-gray-700 transition-all duration-200 rounded-xl aspect-[2.5/1] w-full"
                    >
                      <div className="flex items-center justify-center mb-2">
                        <Euro size={24} className="text-primary" />
                      </div>
                      <div className="w-full flex flex-col items-center justify-center">
                        <span className="text-white text-sm font-medium block mb-1">
                          {budget}
                        </span>
                        <p className="text-xs text-gray-400">
                          Budget d&apos;investissement
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </Transition>
    </div>
  );
};

export default SectorStepper; 