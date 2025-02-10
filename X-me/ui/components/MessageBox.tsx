'use client';

/* eslint-disable @next/next/no-img-element */
import React, { MutableRefObject, useEffect, useState, useRef } from 'react';
import ReactDOMServer from 'react-dom/server';
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
import LegalSearch from './LegalSearch';
import SearchVideos from './SearchVideos';
import { useSpeech } from 'react-text-to-speech';
import { Expert } from '@/lib/actions';
import Source from './Source';

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
  const [parsedMessage, setParsedMessage] = useState(message.content);
  const [speechMessage, setSpeechMessage] = useState(message.content);
  const [isSourcesOpen, setIsSourcesOpen] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  /**
   * Composant SourceLink (non utilisé dans le remplacement mais conservé ici pour référence)
   * Affiche le numéro de la source dans un badge cliquable avec une modale d'aperçu.
   */
  const SourceLink = ({ sourceIndex }: { sourceIndex: number }) => {
    const source = message.sources?.[sourceIndex];
    if (!source) return null;
    const url = source.metadata?.url || '';
    const isFile = source.metadata?.isFile;
    let faviconUrl: string | null = null;
    try {
      if (!isFile && url) {
        faviconUrl = `https://s2.googleusercontent.com/s2/favicons?domain_url=${encodeURIComponent(new URL(url).origin)}`;
      }
    } catch (error) {
      faviconUrl = null;
    }
    const displayNumber = sourceIndex + 1;

    return (
      <span className="group relative inline">
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="ml-1 text-xs text-light-200 dark:text-white hover:underline"
        >
          {displayNumber}
        </a>
        <div className="absolute z-50 w-[300px] bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 mb-2 bottom-full left-1/2 transform -translate-x-1/2 border border-gray-200 dark:border-gray-700 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
          <div className="flex items-start space-x-3">
            {isFile ? (
              <div className="bg-gray-800 flex items-center justify-center w-10 h-10 rounded-lg">
                <File size={16} className="text-white" />
              </div>
            ) : faviconUrl ? (
              <img
                src={faviconUrl}
                width={16}
                height={16}
                alt="favicon"
                className="rounded-lg h-4 w-4 object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            ) : (
              <div className="bg-gray-700 flex items-center justify-center w-10 h-10 rounded-lg">
                <File size={16} className="text-white" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                {source.metadata?.title || 'Source'}
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                {source.pageContent}
              </p>
              <div className="flex items-center mt-2">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {isFile
                    ? `Document PDF - Page ${source.metadata?.page || 1}`
                    : url
                    ? new URL(url).hostname.replace(/^www\./, '')
                    : 'Source'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </span>
    );
  };

  /**
   * Remplacement des références de type [Source X] dans le contenu par un badge HTML.
   * On ajoute ici un attribut inline onClick pour stopper la propagation du clic.
   */
  useEffect(() => {
    const regex = /\[(\d+)\]/g;

    if (
      message.role === 'assistant' &&
      message?.sources &&
      message.sources.length > 0
    ) {
      return setParsedMessage(
        message.content.replace(
          regex,
          (_, number) =>
            `<a href="${message.sources?.[number - 1]?.metadata?.url}" target="_blank" className="bg-light-secondary dark:bg-dark-secondary px-1 rounded ml-1 no-underline text-xs text-black/70 dark:text-white/70 relative">${number}</a>`,
        ),
      );
    }

    setSpeechMessage(message.content.replace(regex, ''));
    setParsedMessage(message.content);
  }, [message.content, message.sources, message.role]);

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
                <div className="flex flex-row items-center space-x-2">
                  <BookCopy className="text-black dark:text-white" size={20} />
                  <h3 className="text-black dark:text-white font-medium text-xl">
                    Sources
                  </h3>
                </div>
                <MessageSources 
                  sources={message.sources} 
                  openModal={openSourcesModal}
                  onClose={closeSourcesModal}
                />
              </div>
            )}

            {/* Mobile: SearchVideos and LegalSearch */}
            <div className="md:hidden space-y-3">
              <SearchVideos
                chatHistory={history.slice(0, messageIndex - 1)}
                query={history[messageIndex - 1].content}
              />
              <LegalSearch
                query={history[messageIndex - 1].content}
                chatHistory={history.slice(0, messageIndex - 1)}
              />
            </div>

            <div ref={contentRef} className="flex flex-col space-y-2 w-full">
              <div className="flex flex-row items-center space-x-2">
                <Disc3
                  className={cn(
                    'text-black dark:text-white',
                    isLast && loading ? 'animate-spin' : 'animate-none',
                  )}
                  size={20}
                />
                <h3 className="text-black dark:text-white font-medium text-xl">
                  Réponse
                </h3>
              </div>
              <div className={cn(
                'prose prose-h1:mb-3 prose-h2:mb-2 prose-h2:mt-6 prose-h2:font-[800] prose-h3:mt-4 prose-h3:mb-1.5 prose-h3:font-[600] dark:prose-invert prose-p:leading-relaxed prose-pre:p-0 font-[400] prose-p:inline',
                'max-w-none w-full break-words text-black dark:text-white',
              )}>
                {Array.isArray(parsedMessage) ? 
                  parsedMessage.map((element, index) => (
                    typeof element === 'string' ? (
                      <Markdown
                        key={index}
                        className="max-w-none break-words text-black dark:text-white inline"
                        options={{
                          wrapper: 'span',
                          disableParsingRawHTML: false,
                          forceWrapper: true,
                        }}
                      >
                        {element}
                      </Markdown>
                    ) : (
                      <span key={index} className="inline-flex align-baseline">{element}</span>
                    )
                  ))
                  : (
                    <Markdown
                      className="prose prose-h1:mb-3 prose-h2:mb-2 prose-h2:mt-6 prose-h2:font-[800] prose-h3:mt-4 prose-h3:mb-1.5 prose-h3:font-[600] dark:prose-invert prose-p:leading-relaxed prose-pre:p-0 font-[400] max-w-none break-words text-black dark:text-white"
                      options={{ disableParsingRawHTML: false }}
                    >
                      {parsedMessage}
                    </Markdown>
                  )
                }
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
                  <>
                    {console.log('Debug - Message complet:', JSON.stringify(message, null, 2))}
                    {console.log('Debug - Suggestions:', message.suggestions)}
                    {console.log('Debug - Experts:', message.suggestedExperts)}
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
                          <div className="flex flex-col space-y-4">
                            {message.suggestedExperts.map((expert: Expert, i) => (
                              <div
                                key={expert.id_expert || i}
                                className="flex flex-row items-start p-4 rounded-lg bg-light-secondary dark:bg-dark-secondary hover:bg-light-secondary/80 dark:hover:bg-dark-secondary/80 transition-colors duration-200 cursor-pointer gap-4"
                                onClick={() => {
                                  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
                                  const url = `${baseUrl}/expert/${expert.prenom.toLowerCase()}-${expert.nom.toLowerCase()}-${expert.id_expert}`;
                                  window.open(url, '_blank');
                                }}
                              >
                                <div className="flex-shrink-0">
                                  {expert.image_url ? (
                                    <img
                                      src={expert.image_url}
                                      alt={`${expert.prenom} ${expert.nom}`}
                                      className="w-20 h-20 rounded-lg object-cover"
                                      onError={(e) => {
                                        console.error("Erreur de chargement de l'image expert:", e);
                                        (e.target as HTMLImageElement).style.display = 'none';
                                      }}
                                    />
                                  ) : (
                                    <div className="w-20 h-20 rounded-lg bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                                      <User className="w-8 h-8 text-gray-500" />
                                    </div>
                                  )}
                                </div>

                                <div className="flex-grow">
                                  <div className="flex justify-between items-start">
                                    <div>
                                      <h4 className="font-medium text-lg">{expert.prenom} {expert.nom}</h4>
                                      <p className="text-sm text-gray-500">{expert.expertises}</p>
                                      <p className="text-sm text-gray-500">{expert.ville}, {expert.pays}</p>
                                    </div>
                                    <div className="flex flex-col items-end">
                                      <span className="text-lg font-medium text-[#24A0ED]">{expert.tarif}€/h</span>
                                      <button 
                                        className="mt-2 px-4 py-2 bg-[#24A0ED] text-white rounded-md hover:bg-[#1a8cd8] transition-colors duration-200"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          const expertUrl = `/expert/${expert.id_expert}`;
                                          window.open(expertUrl, '_blank');
                                        }}
                                      >
                                        Voir le profil
                                      </button>
                                    </div>
                                  </div>
                                  <p className="mt-2 text-sm text-gray-600 dark:text-gray-300 line-clamp-2">{expert.biographie}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  </>
                )}
            </div>
          </div>

          {/* Desktop: Sidebar content */}
          <div className="hidden md:flex lg:sticky lg:top-20 flex-col items-center space-y-3 w-full md:w-3/12 z-30 h-full pb-4">
            {message.sources && message.sources.length > 0 && (
              <div className="w-full">
                <Source 
                  sources={message.sources}
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
              <LegalSearch
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