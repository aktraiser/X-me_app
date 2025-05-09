'use client';

/* eslint-disable @next/next/no-img-element */
import React, { MutableRefObject, useEffect, useState, useRef } from 'react';
import { Message } from './ChatWindow';
import { cn } from '@/lib/utils';
import {
  BookCopy,
  Disc3,
  Volume2,
  StopCircle,
  Layers3,
  Plus,
  UserCheck,
  User,
  File,
} from 'lucide-react';
import Markdown from 'markdown-to-jsx';
import Copy from './MessageActions/Copy';
import Rewrite from './MessageActions/Rewrite';
import MessageSources from './MessageSources';
import SearchVideos from './SearchVideos';
import { useSpeech } from 'react-text-to-speech';
import { Expert } from '@/types/index';
import { Document } from '@langchain/core/documents';
import Source from './Source';
import PartnerAds from './PartnerAds';
import ExpertCard from './ExpertCard';
import ExpertDrawer from '@/app/discover/components/ExpertDrawer';
import SourcePopover from './SourcePopover';
import ContactModal from '@/app/discover/components/ContactModal';
import { debugLog, debugError } from '@/lib/hooks/useDebug';

// Define SourceMetadata interface (similar to Source.tsx)
interface SourceMetadata {
  url?: string;
  isFile?: boolean;
  type?: string;
  page?: number;
  title?: string;
  favicon?: string;
  expertId?: string;
  expertData?: any; // Utiliser any pour éviter les conflits de types
  expertises?: string; // Garder le type string, conforme à SourcePopover
  activité?: string;
  tarif?: string;
  illustrationImage?: string;
  image_url?: string;
  // Ajout des nouveaux champs pour métier/profession
  metier?: string;
  profession?: string;
  specialisation?: string;
  // Ajout des champs manquants qui sont dans actions.ts
  logo?: string;
  site_web?: string;
  reseau?: string;
}

// Define the type for source documents
interface SourceDocument extends Document {
  metadata: SourceMetadata;
}

const formatImageUrl = (url: string): string => {
  if (!url) return '';
  
  // Si c'est une URL Unsplash, on s'assure d'avoir des paramètres de redimensionnement optimisés.
  if (url.includes('unsplash.com')) {
    const baseUrl = url.split('?')[0];
    return `${baseUrl}?w=1200&q=80&fm=jpg`;
  }
  
  return url;
};

const MessageBox = ({
  message,
  messageIndex,
  history,
  loading,
  dividerRef,
  isLast,
  rewrite,
  sendMessage,
}: {
  message: Message;
  messageIndex: number;
  history: Message[];
  loading: boolean;
  dividerRef?: MutableRefObject<HTMLDivElement | null>;
  isLast: boolean;
  rewrite: (messageId: string) => void;
  sendMessage: (message: string) => void;
}) => {
  // Removed parsedMessage state
  const [speechMessage, setSpeechMessage] = useState(message.content);
  const [isSourcesOpen, setIsSourcesOpen] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const [selectedExpert, setSelectedExpert] = useState<Expert | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [dedupedExperts, setDedupedExperts] = useState<Expert[]>([]);
  const [contactModalOpen, setContactModalOpen] = useState(false);

  /**
   * Dédupliquer les experts suggérés pour éviter les doublons dans l'interface
   */
  useEffect(() => {
    if (message.suggestedExperts && message.suggestedExperts.length > 0) {
      // Utiliser un Map pour dédupliquer les experts par leur id_expert
      const uniqueExpertsMap = new Map<string, Expert>();
      
      message.suggestedExperts.forEach(expert => {
        if (expert.id_expert && !uniqueExpertsMap.has(expert.id_expert.toString())) {
          uniqueExpertsMap.set(expert.id_expert.toString(), expert);
        }
      });
      
      // Convertir le Map en tableau
      const uniqueExperts = Array.from(uniqueExpertsMap.values());
      debugLog('MessageBox', `Dédoublonnage des experts : ${message.suggestedExperts.length} → ${uniqueExperts.length}`);
      
      setDedupedExperts(uniqueExperts);
    } else {
      setDedupedExperts([]);
    }
  }, [message.suggestedExperts]);

  /**
   * Prepare content for speech synthesis (remove citations)
   */
  useEffect(() => {
    const regex = /\[((?:\d+\s*,\s*)*\d+)\]/g;
    setSpeechMessage(message.content.replace(regex, ''));
  }, [message.content]);

  // Fonction pour gérer les clics sur les sources d'experts
  const handleExpertSourceClick = (source: SourceDocument) => {
    debugLog('MessageBox', 'Clic sur source expert détecté:', source.metadata);
    
    // Vérifier si nous avons des experts suggérés
    if (!message.suggestedExperts || message.suggestedExperts.length === 0) {
      debugLog('MessageBox', 'Aucun expert suggéré disponible dans le message actuel');
      return;
    }
    
    // Identifier l'expert à ouvrir en priorité par son ID
    let expertToOpen: Expert | null = null;
    
    // 1. Vérifier si nous avons un ID expert direct dans la source
    if (source.metadata.expertId) {
      const matchingExpert = message.suggestedExperts.find(
        expert => expert.id_expert && expert.id_expert.toString() === source.metadata.expertId
      );
      
      if (matchingExpert) {
        expertToOpen = matchingExpert;
        debugLog('MessageBox', 'Expert trouvé par ID direct:', source.metadata.expertId);
      }
    }
    
    // 2. Vérifier si nous avons un ID dans expertData
    if (!expertToOpen && source.metadata.expertData && source.metadata.expertData.id_expert) {
      const expertId = source.metadata.expertData.id_expert;
      const matchingExpert = message.suggestedExperts.find(
        expert => expert.id_expert && expert.id_expert.toString() === expertId.toString()
      );
      
      if (matchingExpert) {
        expertToOpen = matchingExpert;
        debugLog('MessageBox', 'Expert trouvé par ID dans expertData:', expertId);
      }
    }
    
    // 3. Recherche par nom/prénom si toujours pas d'expert trouvé
    if (!expertToOpen && source.metadata.expertData) {
      const expertNom = source.metadata.expertData.nom || '';
      const expertPrenom = source.metadata.expertData.prenom || '';
      
      if (expertNom || expertPrenom) {
        const matchingExpert = message.suggestedExperts.find(expert => 
          (expertNom && expert.nom && expert.nom.toLowerCase() === expertNom.toLowerCase()) ||
          (expertPrenom && expert.prenom && expert.prenom.toLowerCase() === expertPrenom.toLowerCase()) ||
          (expertNom && expertPrenom && expert.nom && expert.prenom && 
           expert.nom.toLowerCase() === expertNom.toLowerCase() && 
           expert.prenom.toLowerCase() === expertPrenom.toLowerCase())
        );
        
        if (matchingExpert) {
          expertToOpen = matchingExpert;
          debugLog('MessageBox', `Expert trouvé par nom/prénom: ${expertPrenom} ${expertNom}`);
        }
      }
    }
    
    // 4. Si on n'a toujours pas trouvé, utiliser le titre de la source pour rechercher
    if (!expertToOpen && source.metadata.title) {
      const sourceTitle = source.metadata.title;
      const expertNameFromTitle = sourceTitle.split(/[-,]/)[0].trim().toLowerCase();
      
      debugLog('MessageBox', 'Recherche par titre de source:', expertNameFromTitle);
      
      const matchingExpert = message.suggestedExperts.find(expert => {
        const fullName = `${expert.prenom} ${expert.nom}`.toLowerCase();
        const lastName = expert.nom.toLowerCase();
        const firstName = expert.prenom.toLowerCase();
        
        return fullName === expertNameFromTitle || 
               fullName.includes(expertNameFromTitle) || 
               expertNameFromTitle.includes(fullName) ||
               expertNameFromTitle.includes(lastName) ||
               lastName.includes(expertNameFromTitle) ||
               firstName.includes(expertNameFromTitle) ||
               expertNameFromTitle.includes(firstName);
      });
      
      if (matchingExpert) {
        expertToOpen = matchingExpert;
        debugLog('MessageBox', 'Expert trouvé par titre de source:', sourceTitle);
      }
    }
    
    // 5. Si on n'a toujours pas trouvé, prendre le premier expert de la liste
    if (!expertToOpen && message.suggestedExperts.length > 0) {
      expertToOpen = message.suggestedExperts[0];
      debugLog('MessageBox', 'Aucun expert correspondant trouvé, utilisation du premier expert par défaut');
    }
    
    if (!expertToOpen) {
      debugLog('MessageBox', 'Impossible de trouver un expert à afficher');
      return;
    }
    
    // Afficher les données pour le débogage
    debugLog('MessageBox', 'Données de l\'expert sélectionné:', {
      id: expertToOpen.id_expert,
      nom: expertToOpen.nom,
      prenom: expertToOpen.prenom,
      activité: expertToOpen.activité,
      expertises: expertToOpen.expertises,
      // Cast vers any pour accéder aux propriétés qui ne sont pas dans l'interface
      metier: (expertToOpen as any).metier,
      profession: (expertToOpen as any).profession,
      specialisation: (expertToOpen as any).specialisation
    });
    
    debugLog('MessageBox', 'Ouverture du drawer pour l\'expert sélectionné');
    setSelectedExpert(expertToOpen);
    setDrawerOpen(true);
  };

  useEffect(() => {
    if (message.sources && message.sources.length > 0) {
      debugLog('MessageBox', 'Sources dans MessageBox:', message.sources.map(s => ({
        type: s.metadata?.type,
        title: s.metadata?.title,
        url: s.metadata?.url
      })));
    }
  }, [message.sources]);


  const { speechStatus, start, stop } = useSpeech({ text: speechMessage });

  const openSourcesModal = () => {
    setIsSourcesOpen(true);
  };

  const closeSourcesModal = () => {
    setIsSourcesOpen(false);
  };

  // Pre-process content for Markdown rendering with placeholders
  let processedContent = message.content;
  if (message.role === 'assistant' && message.sources && message.sources.length > 0) {
      // Associer les sources d'experts avec les experts suggérés
      if (message.suggestedExperts && message.suggestedExperts.length > 0) {
        debugLog('MessageBox', 'Traitement des sources d\'experts...');
        message.sources.forEach(source => {
          if (source.metadata?.type === 'expert' && message.suggestedExperts) {
            const sourceTitle = source.metadata?.title || '';
            debugLog('MessageBox', 'Titre de la source:', sourceTitle);
            
            // Extraire le nom de l'expert (avant le premier - ou la première virgule)
            const expertName = sourceTitle.split(/[-,]/)[0].trim().toLowerCase();
            debugLog('MessageBox', 'Nom extrait de la source:', expertName);
            
            // Chercher l'expert correspondant par son nom
            const matchingExpert = message.suggestedExperts.find(expert => {
              const fullName = `${expert.prenom} ${expert.nom}`.toLowerCase();
              const lastName = expert.nom.toLowerCase();
              const firstName = expert.prenom.toLowerCase();
              
              // Vérifier plusieurs possibilités de correspondance
              return fullName === expertName || 
                     fullName.includes(expertName) || 
                     expertName.includes(fullName) ||
                     expertName.includes(lastName) ||
                     lastName.includes(expertName) ||
                     firstName.includes(expertName) ||
                     expertName.includes(firstName);
            });
            
            // Si un expert correspondant est trouvé, ajouter son ID aux métadonnées de la source
            if (matchingExpert && matchingExpert.id_expert) {
              source.metadata.expertId = matchingExpert.id_expert.toString();
              
              // Ajouter également les données complètes de l'expert pour une meilleure cohérence d'affichage
              source.metadata.expertData = matchingExpert;
              
              // Copier les informations de métier/profession si elles sont disponibles dans les données
              // Utiliser any pour accéder de manière dynamique aux propriétés qui pourraient ne pas être définies dans le type
              const expertAny = matchingExpert as any;
              if (expertAny.metier) source.metadata.metier = expertAny.metier;
              if (expertAny.profession) source.metadata.profession = expertAny.profession;
              if (expertAny.specialisation) source.metadata.specialisation = expertAny.specialisation;
              
              // Assurer la cohérence en copiant les expertises si elles existent
              if (matchingExpert.expertises && !source.metadata.expertises) {
                source.metadata.expertises = matchingExpert.expertises;
              }
              
              // Assurer la cohérence en copiant l'activité si elle existe
              // Prendre en compte le champ avec accent (activité) d'abord
              if (matchingExpert.activité && !source.metadata.activité) {
                source.metadata.activité = matchingExpert.activité;
              } else if (expertAny.metier && !source.metadata.activité) {
                source.metadata.activité = expertAny.metier;
              } else if (expertAny.profession && !source.metadata.activité) {
                source.metadata.activité = expertAny.profession;
              } else if (expertAny.specialisation && !source.metadata.activité) {
                source.metadata.activité = expertAny.specialisation;
              } else if (expertAny.specialite && !source.metadata.activité) {
                source.metadata.activité = expertAny.specialite;
              }
              
              // Copier les champs additionnels présents dans actions.ts
              if (matchingExpert.logo) source.metadata.logo = matchingExpert.logo;
              if (matchingExpert.site_web) source.metadata.site_web = matchingExpert.site_web;
              if (matchingExpert.reseau) source.metadata.reseau = matchingExpert.reseau;
              
              debugLog('MessageBox', `ID Expert ajouté aux métadonnées de la source: ${matchingExpert.prenom} ${matchingExpert.nom} ${matchingExpert.id_expert}`);
            } else {
              debugLog('MessageBox', 'Aucun expert correspondant trouvé pour la source:', sourceTitle);
            }
          }
        });
      }
      
      // Remplacer les références [X] par des balises <sourceref> (tout en minuscules)
      processedContent = processedContent.replace(/\[(\d+)\]/g, (match, numberString) => {
          const number = parseInt(numberString.trim(), 10);
          const sourceIndex = number - 1;
          
          if (sourceIndex >= 0 && message.sources && sourceIndex < message.sources.length) {
              // Utiliser une balise HTML personnalisée en minuscules - important !
              return `<sourceref index="${sourceIndex}" number="${number}" />`;
          } else {
              return `[${number}]`; // Keep original text if source index is invalid
          }
      });
  }

  // Normaliser les listes dans le contenu
  if (message.role === 'assistant') {
    // Normalisation des listes à puces pour s'assurer qu'elles utilisent le format "- "
    processedContent = processedContent.replace(/^(\s*)[-•⚫⚪●○]\s+/gm, '$1- ');
    
    // Normalisation des listes numérotées pour s'assurer qu'elles utilisent le format "1. "
    processedContent = processedContent.replace(/^(\s*)(\d+)\)\s+/gm, '$1$2. ');
  }

  // Fonction pour ouvrir le modal de contact
  const openContactModal = (expert: Expert) => {
    setSelectedExpert(expert);
    setContactModalOpen(true);
  };

  useEffect(() => {
    if (message.role === 'assistant') {
      debugLog('MessageBox', `Message ${messageIndex} info:`, {
        hasSuggestions: !!message.suggestions,
        suggestionsCount: message.suggestions?.length || 0,
        hasExperts: !!message.suggestedExperts,
        expertsCount: message.suggestedExperts?.length || 0,
        hasSourcesLength: message.sources?.length || 0,
        messageId: message.messageId,
        isLast: isLast
      });
      
      // Vérifier si les suggestions devraient être affichées
      if (isLast && (!message.suggestions || message.suggestions.length === 0)) {
        debugLog('MessageBox', `Dernier message sans suggestions. Message ID: ${message.messageId}`);
      }
      
      if (isLast && message.suggestions && message.suggestions.length > 0) {
        debugLog('MessageBox', `Dernier message avec ${message.suggestions.length} suggestion(s)`, message.suggestions);
      }
      
      // Données d'experts sont présentes
      if (isLast && message.suggestedExperts && message.suggestedExperts.length > 0) {
        debugLog('MessageBox', `Dernier message avec ${message.suggestedExperts.length} expert(s)`, 
          message.suggestedExperts.map(e => `${e.prenom} ${e.nom}`));
      }

      // Vérifier la condition d'affichage des suggestions
      const shouldShowSuggestions = isLast && 
        ((message.suggestions && message.suggestions.length > 0) ||
         (message.suggestedExperts && message.suggestedExperts.length > 0)) &&
        message.role === 'assistant' &&
        !loading;
      
      debugLog('MessageBox', `Conditions d'affichage des suggestions:`, {
        shouldShow: shouldShowSuggestions,
        isLast,
        hasSuggestions: !!message.suggestions && message.suggestions.length > 0,
        hasExperts: !!message.suggestedExperts && message.suggestedExperts.length > 0,
        isAssistant: message.role === 'assistant',
        isLoading: loading
      });
    }
  }, [message, messageIndex, isLast, loading]);

  return (
    <div className="pb-8">
      {message.role === 'user' && (
        <div className={cn('w-full', 'px-0 md:px-4', messageIndex === 0 ? 'pt-8' : 'pt-4')}>
          <h3 className="text-black dark:text-white font-medium text-3xl lg:w-9/12 mb-6">
            {message.content}
          </h3>
        </div>
      )}

      {message.role === 'assistant' && (
        <div className={cn(
          "flex flex-col space-y-4",
          "px-0 md:px-4",
          "md:space-y-0 md:flex-row md:justify-between md:space-x-9",
          "w-full max-w-none",
          message.sources && message.sources.length > 0 ? 'pt-2' : 'pt-3'
        )}>
          <div
            ref={dividerRef}
            className="flex flex-col space-y-3 w-full md:w-9/12"
          >
            {message.sources && message.sources[0]?.metadata?.illustrationImage && (
              <div className="flex flex-col -mx-6 md:mx-0 mb-2">
                <div className="w-full aspect-[21/6] relative overflow-hidden md:rounded-xl shadow-lg">
                  <img
                    src={formatImageUrl(message.sources[0].metadata.illustrationImage)}
                    alt="Illustration"
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
                      debugError("MessageBox", "Erreur de chargement de l'image:", e);
                      const imgElement = e.target as HTMLImageElement;
                      if (imgElement.src.includes('unsplash.com')) {
                        const newUrl = imgElement.src.split('?')[0] + '?w=1200&q=80&fm=jpg';
                        if (imgElement.src !== newUrl) {
                          imgElement.src = newUrl;
                          return;
                        }
                      }
                      imgElement.style.display = 'none';
                      const fallbackDiv = document.createElement('div');
                      fallbackDiv.className = 'w-full h-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center';
                      fallbackDiv.innerHTML = '<svg class="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>';
                      imgElement.parentNode?.appendChild(fallbackDiv);
                    }}
                  />
                </div>
              </div>
            )}
            {message.sources && message.sources.length > 0 && (
              <div className="flex flex-col space-y-2">
                <MessageSources
                  sources={message.sources as SourceDocument[]} // Assurer le type
                  openModal={openSourcesModal}
                  onClose={closeSourcesModal}
                />
              </div>
            )}

            {/* Mobile: SearchVideos and LegalSearch */}
            <div className="lg:hidden space-y-3">
              <SearchVideos
                chatHistory={history.slice(0, messageIndex - 1)}
                query={history[messageIndex - 1].content}
              />
              <PartnerAds
                query={history[messageIndex - 1].content}
                chatHistory={history.slice(0, messageIndex - 1)}
              />
            </div>

            <div ref={contentRef} className="flex flex-col space-y-4 w-full">

              {/* Utilisation de Markdown pour rendre le contenu pré-traité */}
              <div className="mb-3 max-w-full prose prose-sm dark:prose-invert prose-img:mx-auto dark:text-white max-w-none">
                <Markdown
                  remarkPlugins={[]}
                  options={{
                    // Utiliser options.overrides au lieu de components
                    overrides: {
                      // Définir le composant pour la balise <sourceref>
                      sourceref: {
                        component: ({index, number, ...props}) => {
                          const sourceIndex = parseInt(index, 10);
                          const originalNumber = parseInt(number, 10);
                          
                          // Vérifier que la source existe
                          if (message.sources && sourceIndex >= 0 && sourceIndex < message.sources.length) {
                            return (
                              <SourcePopover
                                source={message.sources[sourceIndex] as SourceDocument}
                                number={originalNumber}
                                onExpertClick={handleExpertSourceClick}
                              />
                            );
                          }
                          
                          // Fallback pour source invalide
                          return <span>[{originalNumber}]</span>;
                        }
                      },
                      // Autres overrides si nécessaire...
                    }
                  }}
                  components={{
                    // Ne pas utiliser components pour les balises personnalisées
                    p: {
                      component: ({ children, ...props }: React.PropsWithChildren<any>) => {
                          // Si le contenu est juste une image, pas besoin d'un <p>
                          if (typeof children === 'object' && React.isValidElement(children) && children.type === 'img') {
                            return children;
                          }
                          // Paragraphe normal - on le rend comme un p
                          return <p className="my-2" {...props}>{children}</p>;
                        }
                      },
                    // Style pour les listes à puces (ul)
                    ul: {
                      component: ({ children, ...props }: React.PropsWithChildren<any>) => {
                        return (
                          <ul className="my-4 pl-2" {...props}>
                            {children}
                          </ul>
                        );
                      }
                    },
                    // Style pour les listes numérotées (ol)
                    ol: {
                      component: ({ children, ...props }: React.PropsWithChildren<any>) => {
                        return (
                          <ol className="my-4 pl-2" {...props}>
                            {children}
                          </ol>
                        );
                      }
                    },
                    // Style pour les éléments de liste (li)
                    li: {
                      component: ({ children, ...props }: React.PropsWithChildren<any>) => {
                        let itemContent = children;
                        let listType = 'bullet'; // Par défaut
                        let bulletOrNumber = '-'; // Valeur par défaut
                        
                        // Vérifier le contenu pour détecter le type de liste
                        if (typeof children === 'string') {
                          // Recherche de formats de liste numérotée: 1., 2., etc.
                          const numericRegex = /^\s*(\d+)[\.\)]\s*(.+)$/;
                          const bulletRegex = /^\s*[-•⚫⚪●○]\s*(.+)$/;
                          
                          // Test pour liste numérotée
                          const numericMatch = children.match(numericRegex);
                          if (numericMatch) {
                            bulletOrNumber = numericMatch[1]; // Le numéro
                            itemContent = numericMatch[2]; // Le contenu après le numéro
                            listType = 'numbered';
                          } 
                          // Test pour liste à puces
                          else if (bulletRegex.test(children)) {
                            const bulletMatch = children.match(bulletRegex);
                            if (bulletMatch) {
                              itemContent = bulletMatch[1]; // Le contenu après la puce
                            } else {
                              // Cas de fallback si le regex match mais pas la capture
                              itemContent = children.replace(/^\s*[-•⚫⚪●○]\s*/, '');
                            }
                            listType = 'bullet';
                          }
                          // Si le texte commence simplement par un tiret sans espace
                          else if (children.startsWith('-')) {
                            itemContent = children.substring(1);
                            listType = 'bullet';
                          }
                        }
                        
                        return (
                          <li className="my-1 pl-6 flex flex-row" {...props}>
                            {/* Afficher différemment selon le type de liste */}
                            {listType === 'numbered' ? (
                              <span className="inline-block mr-2 font-medium flex-shrink-0">{bulletOrNumber}.</span>
                            ) : (
                              <span className="inline-block mr-2 flex-shrink-0">-</span>
                            )}
                            <span className="flex-grow">{itemContent}</span>
                          </li>
                        );
                      }
                    },
                  }}>
                  {processedContent}
                </Markdown>
              </div>
              
              {loading && isLast ? null : (
                <div className="flex flex-row items-center justify-between w-full text-black dark:text-white py-4 -mx-2">
                  <div className="flex flex-row items-center space-x-1">
                    <Rewrite rewrite={rewrite} messageId={message.messageId} />
                  </div>
                  <div className="flex flex-row items-center space-x-1">
                    <Copy initialMessage={message.content} message={message} />
                    <button
                      onClick={() => {
                        if (speechStatus === 'started') {
                          stop();
                        } else {
                          start();
                        }
                      }}
                      className="p-2 text-black/70 dark:text-white/70 rounded-xl hover:bg-light-secondary dark:hover:bg-dark-secondary transition duration-200 hover:text-black dark:hover:text-white"
                    >
                      {speechStatus === 'started' ? (
                        <StopCircle size={18} />
                      ) : (
                        <Volume2 size={18} />
                      )}
                    </button>
                  </div>
                </div>
              )}
              {isLast &&
                ((message.suggestions && message.suggestions.length > 0) ||
                (message.suggestedExperts && message.suggestedExperts.length > 0)) &&
                message.role === 'assistant' &&
                !loading && (
                  <div className="mt-4">
                    <div className="h-px w-full bg-light-secondary dark:bg-dark-secondary" />
                    <div className="flex flex-col space-y-3 text-black dark:text-white">
                      {message.suggestions && message.suggestions.length > 0 && (
                        <>
                          <div className="flex flex-row items-center space-x-2 mt-4">
                            <Layers3 />
                            <h3 className="text-xl font-medium">Suggestions</h3>
                          </div>
                          <div className="flex flex-col space-y-3 mb-8">
                            {message.suggestions.map((suggestion, i) => (
                              <div
                                className="flex flex-col space-y-3 text-sm"
                                key={i}
                              >
                                <div className="h-px w-full bg-light-secondary dark:bg-dark-secondary" />
                                <div
                                  onClick={() => sendMessage(suggestion)}
                                  className="cursor-pointer flex flex-row justify-between font-medium space-x-2 items-center"
                                >
                                  <p className="transition duration-200 hover:text-orange-500">
                                    {suggestion}
                                  </p>
                                  <Plus
                                    size={20}
                                    className="text-black dark:text-white flex-shrink-0"
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        </>
                      )}
                      
                      {/* Espacement visible entre les sections */}
                      {message.suggestions && message.suggestions.length > 0 && 
                       message.suggestedExperts && message.suggestedExperts.length > 0 && (
                        <div className="py-4"></div>
                      )}
                      
                      {dedupedExperts.length > 0 && (
                        <>
                          <div className="mt-8">
                            <div className="h-px w-full bg-light-secondary dark:bg-dark-secondary" />
                            <div className="flex flex-row items-center space-x-2 mt-4">
                              <UserCheck className="text-black dark:text-white" />
                              <h3 className="text-xl font-medium">On vous accompagne</h3>
                            </div>
                          </div>
                          <div className="flex flex-col space-y-4 w-full">
                            {dedupedExperts.map((expert: Expert, i) => (
                              <div key={expert.id_expert || i} className="w-full">
                                <ExpertCard 
                                  expert={expert}
                                  onClick={() => {
                                    setSelectedExpert(expert);
                                    setDrawerOpen(true);
                                  }}
                                  onContactClick={() => {
                                    setSelectedExpert(expert);
                                    setContactModalOpen(true);
                                  }}
                                />
                              </div>
                            ))}
                          </div>
                          <ExpertDrawer
                            expert={selectedExpert}
                            open={drawerOpen}
                            setOpen={setDrawerOpen}
                            className="max-w-5xl"
                            onContactClick={() => {
                              setDrawerOpen(false);
                              setTimeout(() => setContactModalOpen(true), 300);
                            }}
                          />
                        </>
                      )}
                    </div>
                  </div>
                )}
            </div>
          </div>

          {/* Desktop: Sidebar content */}
          <div className="hidden lg:flex lg:sticky lg:top-20 flex-col items-center space-y-3 w-full md:w-3/12 z-30 h-full pb-4 -mt-4">
            {message.sources && message.sources.length > 0 && (
              <div className="w-full">
                <Source
                  sources={message.sources as SourceDocument[]} // Assurer le type
                  isOpen={isSourcesOpen}
                  onClose={closeSourcesModal}
                />
              </div>
            )}
            <div className="w-full">
              <SearchVideos
                chatHistory={history.slice(0, messageIndex - 1)}
                query={history[messageIndex - 1].content}
              />
            </div>
            <div className="w-full">
              <PartnerAds
                query={history[messageIndex - 1].content}
                  chatHistory={history.slice(0, messageIndex - 1)}
                />
            </div>
            </div>
          </div>
      )}

      {/* Expert Drawer */}
      <ExpertDrawer
        expert={selectedExpert}
        open={drawerOpen}
        setOpen={setDrawerOpen}
        className="max-w-5xl"
        onContactClick={() => {
          setDrawerOpen(false);
          setTimeout(() => setContactModalOpen(true), 300);
        }}
      />

      {/* Contact Modal */}
      <ContactModal
        expert={selectedExpert}
        open={contactModalOpen}
        setOpen={setContactModalOpen}
      />
    </div>
  );
};

export default React.memo(MessageBox);