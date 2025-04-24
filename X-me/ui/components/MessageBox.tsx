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
import { Expert } from '@/lib/actions';
import { Document } from '@langchain/core/documents';
import Source from './Source';
import PartnerAds from './PartnerAds';
import ExpertCard from './ExpertCard';
import ExpertDrawer from '@/app/discover/components/ExpertDrawer';

// Define SourceMetadata interface (similar to Source.tsx)
interface SourceMetadata {
  url?: string;
  isFile?: boolean;
  type?: string;
  page?: number;
  title?: string;
  favicon?: string;
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

// Define SourcePopover component internally
const SourcePopover = ({ source, number, onExpertClick }: { source: SourceDocument, number: number, onExpertClick?: (source: SourceDocument) => void }) => {
  const sourceUrl = source?.metadata?.url || '#';
  const sourceTitle = source?.metadata?.title || 'Source';
  const isFile = source?.metadata?.isFile;
  const pageNumber = source?.metadata?.page || 1;
  const isExpert = source?.metadata?.type === 'expert';
  
  let faviconUrl: string | null = null;
  try {
    if (!isFile && sourceUrl && sourceUrl !== '#') {
      faviconUrl = `https://s2.googleusercontent.com/s2/favicons?domain_url=${encodeURIComponent(new URL(sourceUrl).origin)}`;
    } 
  } catch (error) {
    faviconUrl = null;
  }
  
  const hostname = isFile ? `Page ${pageNumber}` : (sourceUrl && sourceUrl !== '#') ? new URL(sourceUrl).hostname.replace(/^www\./, '') : 'Source';

  // Format page content to remove excessive whitespace and links
  const formatContent = (content: string): string => {
    if (!content) return '';
    // Remove multiple spaces, tabs, and newlines
    let formatted = content.replace(/\s+/g, ' ').trim();
    // Remove common link patterns and HTML tags
    formatted = formatted.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
    formatted = formatted.replace(/<[^>]+>/g, '');
    // Limit length
    return formatted.length > 150 ? formatted.substring(0, 150) + '...' : formatted;
  };

  // Générer un extrait direct du contenu sans appel API
  const excerpt = formatContent(source.pageContent);

  return (
    <span className="group relative inline-flex align-middle mx-px"> {/* inline-flex pour bon alignement */} 
      <span 
        className="inline-flex items-center justify-center rounded px-1.5 py-0.5 text-xs bg-black/10 dark:bg-white/10 text-black dark:text-white cursor-pointer hover:bg-[#c59d3f]/20 hover:text-[#c59d3f] dark:hover:bg-[#c59d3f]/20 dark:hover:text-[#c59d3f] transition-colors"
        onClick={(e: React.MouseEvent) => {
          e.stopPropagation();
          
          // Si c'est un expert et la fonction de callback est fournie
          if (isExpert && onExpertClick) {
            onExpertClick(source);
          } else {
            // Comportement normal pour les autres sources
            window.open(sourceUrl, '_blank');
          }
        }}
      >
        {number}
      </span>
      <div className="absolute z-50 w-[300px] bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 mb-2 bottom-full left-1/2 transform -translate-x-1/2 border border-gray-200 dark:border-gray-700 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
        <div className="flex flex-col space-y-2">
          <h3 className="text-sm font-medium text-black dark:text-white line-clamp-2">
            {sourceTitle}
          </h3>
          <p className="text-xs text-black dark:text-gray-400 line-clamp-3">
            {excerpt}
          </p>
          <div className="flex items-center mt-1">
            {isFile ? (
              <div className="flex-shrink-0 bg-gray-800 flex items-center justify-center w-4 h-4 rounded-full mr-2">
                <File size={10} className="text-black dark:text-white" />
              </div>
            ) : faviconUrl ? (
              <img
                src={faviconUrl}
                width={16}
                height={16}
                alt="favicon"
                className="flex-shrink-0 rounded-sm h-4 w-4 object-cover mr-2"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            ) : (
              <div className="flex-shrink-0 bg-gray-700 flex items-center justify-center w-4 h-4 rounded-full mr-2">
                <File size={10} className="text-white" />
              </div>
            )}
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate font-medium">
              {isFile
                ? `Document PDF - Page ${pageNumber}`
                : hostname}
            </p>
          </div>
        </div>
      </div>
    </span>
  );
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

  /**
   * Prepare content for speech synthesis (remove citations)
   */
  useEffect(() => {
    const regex = /\[((?:\d+\s*,\s*)*\d+)\]/g;
    setSpeechMessage(message.content.replace(regex, ''));
  }, [message.content]);

  // Fonction pour gérer les clics sur les sources d'experts
  const handleExpertSourceClick = (source: SourceDocument) => {
    console.log('🔍 Expert source clicked:', source.metadata);
    
    // Chercher l'expert correspondant parmi les experts suggérés
    if (message.suggestedExperts && message.suggestedExperts.length > 0) {
      console.log('👥 Experts suggérés disponibles:', message.suggestedExperts.length);
      
      // Rechercher d'abord par type 'expert'
      if (source.metadata.type === 'expert') {
        // Si nous avons les experts suggérés, utiliser le premier
        const expert = message.suggestedExperts[0];
        
        if (expert) {
          console.log('✅ Expert sélectionné pour affichage:', expert.prenom, expert.nom);
          setSelectedExpert(expert);
          setDrawerOpen(true);
          return;
        }
      }
    } else {
      console.log('❌ Aucun expert suggéré disponible dans le message actuel');
    }
  };

  useEffect(() => {
    if (message.sources && message.sources.length > 0) {
      console.log('🔍 Sources dans MessageBox:', message.sources.map(s => ({
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

  return (
    <div>
      {message.role === 'user' && (
        <div className={cn('w-full', messageIndex === 0 ? 'pt-8' : 'pt-4')}>
          <h3 className="text-black dark:text-white font-medium text-3xl lg:w-9/12">
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
              <div className="flex flex-col space-y-2 -mx-6 md:mx-0 mb-4">
                <div className="w-full aspect-[21/6] relative overflow-hidden md:rounded-xl shadow-lg">
                  <img
                    src={formatImageUrl(message.sources[0].metadata.illustrationImage)}
                    alt="Illustration"
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
                      console.error("Erreur de chargement de l'image:", e);
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
                <p className="text-sm text-gray-500 dark:text-gray-400 italic mt-2 px-4 md:px-0">
                  {message.sources[0].metadata.title || 'Illustration du sujet'}
                </p>
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
                                  <p className="transition duration-200 hover:text-[#24A0ED]">
                                    {suggestion}
                                  </p>
                                  <Plus
                                    size={20}
                                    className="text-[#24A0ED] flex-shrink-0"
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        </>
                      )}
                      
                      {message.suggestedExperts && message.suggestedExperts.length > 0 && (
                        <>
                          <div className="mt-16">
                            <div className="h-px w-full bg-light-secondary dark:bg-dark-secondary" />
                            <div className="flex flex-row items-center space-x-2 mt-4">
                              <UserCheck className="text-black dark:text-white" />
                              <h3 className="text-xl font-medium">On vous accompagne</h3>
                            </div>
                          </div>
                          <div className="flex flex-col space-y-4 w-full mx-auto">
                            {message.suggestedExperts.map((expert: Expert, i) => (
                              <div key={expert.id_expert || i} className="w-full mx-auto">
                                <ExpertCard 
                                  expert={expert}
                                  onClick={() => {
                                    setSelectedExpert(expert);
                                    setDrawerOpen(true);
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
                          />
                        </>
                      )}
                    </div>
                  </div>
                )}
            </div>
          </div>

          {/* Desktop: Sidebar content */}
          <div className="hidden lg:flex lg:sticky lg:top-20 flex-col items-center space-y-3 w-full md:w-3/12 z-30 h-full pb-4">
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
    </div>
  );
};

export default React.memo(MessageBox);