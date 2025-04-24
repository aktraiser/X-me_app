import React, { useState, useEffect } from 'react';
import { ResearchActivity } from './ChatWindow';
import ThinkBox from './ThinkBox';
import { cn } from '@/lib/utils';

interface MessageBoxLoadingProps {
  researchActivities?: ResearchActivity[];
  userQuery?: string;
  keywords?: string[];
}

const MessageBoxLoading = ({ 
  researchActivities = [], 
  userQuery = "Votre recherche...",
  keywords = ["mot-clé 1", "mot-clé 2"]
}: MessageBoxLoadingProps) => {
  // État pour suivre l'étape actuelle du processus
  const [currentStep, setCurrentStep] = useState(1);
  
  // Déterminer si on doit afficher Firecrawl au lieu des étapes standard
  const showFirecrawl = researchActivities.length > 0;

  // Effet pour avancer automatiquement à travers les étapes
  useEffect(() => {
    if (showFirecrawl) return; // Ne pas utiliser la séquence si on affiche Firecrawl
    
    // Avancer à l'étape suivante après un délai
    const timer = setTimeout(() => {
      if (currentStep < 3) {
        setCurrentStep((prevStep: number) => prevStep + 1);
      }
    }, 5000); // 4 secondes par étape
    
    return () => clearTimeout(timer);
  }, [currentStep, showFirecrawl]);

  // Formatage du contenu pour ThinkBox
  const formatActivitiesContent = () => {
    if (!showFirecrawl) {
      let content = "";
      
      // Étape 1 : Analyse des besoins (toujours visible)
      content += "✅ Analyser de votre demande\n";
      content += `Requête: 🔍 "${userQuery}"\n`;
      content += "Mots-clés:\n";
      keywords.forEach(keyword => {
        content += `✓ ${keyword}\n`;
      });
      content += "\n";
      
      // Étape 2 : Vérification des produits (visible à partir de l'étape 2)
      if (currentStep >= 2) {
        content += "✅ Recherche d'information\n";
        content += "J'analyse les résultats, vérifie les sources et compare les informations\n";
        content += "avec la base de connaissances.\n\n";
      } else {
        content += "🧠 Analyse des résultats\n\n";
      }
      
      // Étape 3 : Validation et évaluation des risques (visible à l'étape 3)
      if (currentStep >= 3) {
        content += "✅ Validation des résultats et recherche d'un expert\n";
        content += "Vérification finale des informations pour garantir la pertinence et la qualité\n";
        content += "des résultats. Analyse comparative des options identifiées.\n";
      } else {
        content += "⏳ Validation des résultats\n";
      }
      
      return content;
    }
    
    // Logique Firecrawl (maintenue telle quelle)
    // Organiser les activités par type
    const activitiesByType = {
      search: researchActivities.filter(a => a.type === 'search'),
      analyze: researchActivities.filter(a => a.type === 'analyze'),
      extract: researchActivities.filter(a => a.type === 'extract'),
      synthesize: researchActivities.filter(a => a.type === 'synthesize'),
      thought: researchActivities.filter(a => a.type === 'thought'),
    };
    
    // Calculer la progression
    const completedCount = researchActivities.filter(a => a.status === 'completed').length;
    const progressPercent = Math.min(100, (completedCount / researchActivities.length) * 100);
    
    // Construire le contenu formaté
    let content = `Activités Firecrawl (${researchActivities.length})\n`;
    content += `Progression: ${progressPercent.toFixed(0)}% (${completedCount}/${researchActivities.length})\n\n`;
    
    // Ajouter les détails de chaque type d'activité
    for (const [type, activities] of Object.entries(activitiesByType)) {
      if (activities.length === 0) continue;
      
      const icon = type === 'search' ? '🔍' : 
                   type === 'analyze' ? '🧠' : 
                   type === 'extract' ? '📄' : 
                   type === 'synthesize' ? '✨' : '💭';
                   
      const label = type === 'search' ? 'Recherche' : 
                    type === 'analyze' ? 'Analyse' : 
                    type === 'extract' ? 'Extraction' : 
                    type === 'synthesize' ? 'Synthèse' : 'Réflexion';
      
      content += `${icon} ${label} (${activities.length}):\n`;
      
      // Afficher quelques activités de ce type
      activities.slice(0, 3).forEach((activity, index) => {
        const statusIcon = activity.status === 'completed' ? '✅' : '⏳';
        content += `   ${statusIcon} ${activity.message}\n`;
        if (activity.depth !== undefined && activity.maxDepth !== undefined) {
          content += `      Profondeur: ${activity.depth}/${activity.maxDepth}\n`;
        }
      });
      
      if (activities.length > 3) {
        content += `   + ${activities.length - 3} autres...\n`;
      }
      
      content += '\n';
    }
    
    return content;
  };

  return (
    <div>
      {/* Structure alignée avec MessageBox - on utilise le même cn() */}
      <div className={cn(
        "flex flex-col space-y-4",
        "px-0 md:px-4",
        "md:space-y-0 md:flex-row md:justify-between md:space-x-9",
        "w-full max-w-none",
        "pt-3"
      )}>
        {/* Contenu principal - même structure et spacing que MessageBox */}
        <div className="flex flex-col space-y-3 w-full md:w-9/12">
          {/* ThinkBox sans div wrapper supplémentaire pour éviter la marge additionnelle */}
          <ThinkBox content={formatActivitiesContent()} />
          
          {/* Reste du contenu (loading skeletons) */}
          <div className="w-full animate-pulse">
            <div className="h-8 bg-light-secondary dark:bg-dark-secondary rounded-lg w-1/3" />
          </div>

          {/* Sources loading */}
          <div className="w-full">
            <div className="flex items-center space-x-2 mb-4">
              <div className="h-5 w-5 bg-light-secondary dark:bg-dark-secondary rounded-full animate-pulse" />
              <div className="h-5 w-24 bg-light-secondary dark:bg-dark-secondary rounded-lg animate-pulse" />
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-light-secondary dark:bg-dark-secondary h-20 rounded-lg animate-pulse" />
              ))}
            </div>
          </div>

          {/* Content loading skeleton */}
          <div className="flex flex-col space-y-4 w-full">
            <div className="flex items-center space-x-2 mb-2">
              <div className="h-5 w-5 bg-light-secondary dark:bg-dark-secondary rounded-full animate-pulse" />
              <div className="h-5 w-32 bg-light-secondary dark:bg-dark-secondary rounded-lg animate-pulse" />
            </div>
            <div className="space-y-3">
              <div className="h-3 bg-light-secondary dark:bg-dark-secondary rounded-full w-full animate-pulse" />
              <div className="h-3 bg-light-secondary dark:bg-dark-secondary rounded-full w-11/12 animate-pulse" />
              <div className="h-3 bg-light-secondary dark:bg-dark-secondary rounded-full w-9/12 animate-pulse" />
              <div className="h-3 bg-light-secondary dark:bg-dark-secondary rounded-full w-10/12 animate-pulse" />
            </div>
          </div>
        </div>

        {/* Partie droite - barre latérale (sidebar) - identique à MessageBox */}
        <div className="hidden lg:flex lg:sticky lg:top-20 flex-col items-center space-y-3 w-full md:w-3/12 z-30 h-full pb-4">
          {/* Squelette pour la barre latérale */}
          <div className="w-full bg-light-secondary dark:bg-dark-secondary h-32 rounded-lg animate-pulse" />
          <div className="w-full bg-light-secondary dark:bg-dark-secondary h-40 rounded-lg animate-pulse" />
          <div className="w-full bg-light-secondary dark:bg-dark-secondary h-24 rounded-lg animate-pulse" />
        </div>
      </div>
    </div>
  );
};

export default MessageBoxLoading;
