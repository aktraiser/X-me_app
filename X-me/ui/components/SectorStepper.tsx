import { useState } from 'react';
import { ChevronRight, ChevronLeft } from 'lucide-react';

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
    <div className="w-full max-w-4xl mx-auto bg-light-secondary dark:bg-dark-secondary rounded-lg p-6">
      {step !== 'main' && (
        <button
          onClick={handleBack}
          className="flex items-center text-black/70 dark:text-white/70 mb-4 hover:text-primary transition-colors"
        >
          <ChevronLeft size={20} />
          <span>Retour</span>
        </button>
      )}

      {step === 'main' && (
        <div>
          <h3 className="text-lg font-medium text-black/70 dark:text-white/70 mb-4">
            Sélectionnez votre secteur d&apos;activité
          </h3>
          <div className="h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-3">
              {sectors.map((sector) => (
                <button
                  key={sector.name}
                  onClick={() => handleSectorClick(sector)}
                  className="flex items-center justify-between p-3 text-left border border-light-200 dark:border-dark-200 rounded-lg hover:bg-light-100 dark:hover:bg-dark-100 transition-colors group"
                >
                  <span className="text-black dark:text-white text-sm group-hover:text-primary">{sector.name}</span>
                  <ChevronRight className="text-black/50 dark:text-white/50 group-hover:text-primary" size={18} />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {step === 'sub' && selectedSector && (
        <div>
          <h3 className="text-lg font-medium text-black/70 dark:text-white/70 mb-4">
            {selectedSector.name} - Sélectionnez votre sous-secteur
          </h3>
          <div className="h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-3">
              {selectedSector.subsectors?.map((subsector) => (
                <button
                  key={subsector}
                  onClick={() => handleSubsectorClick(subsector)}
                  className="flex items-center justify-between p-3 text-left border border-light-200 dark:border-dark-200 rounded-lg hover:bg-light-100 dark:hover:bg-dark-100 transition-colors group"
                >
                  <span className="text-black dark:text-white text-sm group-hover:text-primary">{subsector}</span>
                  <ChevronRight className="text-black/50 dark:text-white/50 group-hover:text-primary" size={18} />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {step === 'region' && (
        <div>
          <h3 className="text-lg font-medium text-black/70 dark:text-white/70 mb-4">
            Sélectionnez votre région d&apos;implantation
          </h3>
          <div className="h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-3">
              {regions.map((region) => (
                <button
                  key={region.name}
                  onClick={() => handleRegionClick(region.name)}
                  className="flex items-center justify-between p-3 text-left border border-light-200 dark:border-dark-200 rounded-lg hover:bg-light-100 dark:hover:bg-dark-100 transition-colors group"
                >
                  <span className="text-black dark:text-white text-sm group-hover:text-primary">{region.name}</span>
                  <ChevronRight className="text-black/50 dark:text-white/50 group-hover:text-primary" size={18} />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {step === 'city' && (
        <div>
          <h3 className="text-lg font-medium text-black/70 dark:text-white/70 mb-4">
            Sélectionnez votre ville d&apos;implantation
          </h3>
          <div className="h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-3">
              {getCurrentCities().map((city) => (
                <button
                  key={city}
                  onClick={() => handleCityClick(city)}
                  className="flex items-center justify-between p-3 text-left border border-light-200 dark:border-dark-200 rounded-lg hover:bg-light-100 dark:hover:bg-dark-100 transition-colors group"
                >
                  <span className="text-black dark:text-white text-sm group-hover:text-primary">{city}</span>
                  <ChevronRight className="text-black/50 dark:text-white/50 group-hover:text-primary" size={18} />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {step === 'budget' && (
        <div>
          <h3 className="text-lg font-medium text-black/70 dark:text-white/70 mb-4">
            Sélectionnez votre budget d&apos;investissement
          </h3>
          <div className="h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-3">
              {budgetRanges.map((budget) => (
                <button
                  key={budget}
                  onClick={() => handleBudgetClick(budget)}
                  className="flex items-center justify-between p-3 text-left border border-light-200 dark:border-dark-200 rounded-lg hover:bg-light-100 dark:hover:bg-dark-100 transition-colors group"
                >
                  <span className="text-black dark:text-white text-sm group-hover:text-primary">{budget}</span>
                  <ChevronRight className="text-black/50 dark:text-white/50 group-hover:text-primary" size={18} />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SectorStepper; 