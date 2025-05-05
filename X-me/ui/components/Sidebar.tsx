'use client';

import { cn } from '@/lib/utils';
import { Home, Search, Plus, Settings, Clock, Library, ArrowLeftToLine, ArrowRightToLine, User } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useSelectedLayoutSegments } from 'next/navigation';
import React, { useState, useEffect, type ReactNode } from 'react';
import { createClient } from '@/utils/supabase/client';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";
import { getApiUrl } from '@/lib/config';
import { useNavVisibility } from '@/hooks/useNavVisibility';

interface Chat {
  id: string;
  title: string;
  createdAt: string;
  focusMode: string;
}

const VerticalIconContainer = ({ children }: { children: ReactNode }) => {
  return (
    <div className="flex flex-col items-center gap-y-3 w-full">{children}</div>
  );
};

const IconWithTooltip = ({ icon: Icon, label, isExpanded }: { icon: any, label: string, isExpanded: boolean }) => {
  if (isExpanded) return <Icon className="shrink-0 w-4 h-4 text-black dark:text-white" />;
  
  return (
    <TooltipProvider delayDuration={0}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div>
            <Icon className="shrink-0 w-4 h-4 text-black dark:text-white" />
          </div>
        </TooltipTrigger>
        <TooltipContent side="right" className="flex items-center gap-2">
          {label}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

const Sidebar = ({ 
  children,
  onExpandChange
}: { 
  children?: React.ReactNode;
  onExpandChange?: (expanded: boolean) => void;
}) => {
  const segments = useSelectedLayoutSegments();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [chatHistory, setChatHistory] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const supabase = createClient();
  const { isNavVisible } = useNavVisibility();

  useEffect(() => {
    const getUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
      }
    };
    getUser();
  }, [supabase]);

  useEffect(() => {
    const controller = new AbortController();
    const signal = controller.signal;

    const fetchChats = async () => {
      try {
        const apiUrl = getApiUrl();
        const res = await fetch(`${apiUrl}/chats`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          signal,
        });
        const data = await res.json();
        if (data && data.chats) {
          // Utiliser le chatHistory via une fonction de mise à jour
          setChatHistory((prevChatHistory: Chat[]) => {
            // Garder seulement les trois dernières discussions existantes
            const existingChats = prevChatHistory.slice(-3);
            // Ajouter les nouvelles discussions au début
            const newChats = data.chats.filter(
              (newChat: Chat) => !existingChats.some((chat) => chat.id === newChat.id)
            );
            // Combiner les nouvelles discussions avec les trois dernières existantes
            return [...newChats, ...existingChats].slice(-3);
          });
        }
      } catch (error: unknown) {
        if (error instanceof Error && error.name === 'AbortError') {
          console.log('Fetch aborted');
        } else {
          console.error('Erreur lors de la récupération des chats:', error);
        }
      }
    };

    if (isExpanded) {
      setLoading(true);
      fetchChats().finally(() => setLoading(false));
    }

    return () => {
      controller.abort();
    };
  }, [isExpanded]);

  useEffect(() => {
    onExpandChange?.(isExpanded);
  }, [isExpanded, onExpandChange]);

  // Effet de débogage
  useEffect(() => {
    if (chatHistory.length > 0) {
      console.log('Historique disponible:', chatHistory);
    }
  }, [chatHistory]);

  const navLinks = [
    {
      icon: Home,
      href: '/',
      active: segments.length === 0 || segments.includes('c'),
      label: 'Accueil',
    },
    {
      icon: Search,
      href: '/discover',
      active: segments.includes('discover'),
      label: 'Nos experts',
    },
    {
      icon: Library,
      href: '/library',
      active: segments.includes('library'),
      label: 'Historique',
    },
  ];

  return (
    <div>
      <div className={cn(
        "hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:flex-col transition-all duration-300",
        isExpanded ? "lg:w-52" : "lg:w-16"
      )}>
        <div className="flex grow flex-col items-center justify-between gap-y-5 overflow-y-auto bg-light-secondary dark:bg-dark-secondary px-2 py-8 hide-scrollbar">
          <div className="flex flex-col items-start gap-y-4 w-full">
            <div className="flex items-center pl-2 w-full">
              <div className="w-10 h-10">
                <Image
                  src="/images/logo.svg"
                  alt="Logo"
                  width={40}
                  height={40}
                  className="w-full h-full"
                />
              </div>
            </div>
            <button
              className={cn(
                "flex items-center w-full h-12 cursor-pointer rounded-lg mt-4",
                isExpanded ? "px-3" : "justify-center hover:bg-black/10 dark:hover:bg-white/10"
              )}
              onClick={() => window.location.href = '/'}
            >
              <div className="w-full">
              {isExpanded ? (
                <div className="flex items-center gap-3 w-full h-full px-4 py-3 border border-black/20 dark:border-white/20 rounded-full hover:border-[#c49c48] transition-all">
                  <Plus className="w-4 h-4 shrink-0 text-black dark:text-white" />
                  <span className="text-base font-medium text-black dark:text-white whitespace-nowrap overflow-hidden text-ellipsis">Nouvelle Discussion</span>
                </div>
              ) : (
                <TooltipProvider delayDuration={0}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center justify-center h-full">
                        <div className="w-8 h-8 flex items-center justify-center bg-light-primary dark:bg-dark-primary rounded-full hover:bg-[#c49c48]/20 transition-colors">
                          <Plus className="w-4 h-4 shrink-0 text-black dark:text-white" />
                        </div>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="right">
                      Nouvelle discussion
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
              </div>
            </button>
          </div>
          <VerticalIconContainer>
            {navLinks.map((link, i) => (
              <div key={i} className="w-full">
                <Link
                  href={link.href}
                  className={cn(
                    'relative flex flex-row items-center cursor-pointer hover:bg-black/10 dark:hover:bg-white/10 duration-150 transition w-full h-10 rounded-lg overflow-hidden',
                    isExpanded ? '' : 'justify-center',
                    link.active
                      ? 'text-black dark:text-white'
                      : 'text-black/70 dark:text-white/70',
                  )}
                >
                  <div className={cn(
                    "flex items-center h-full z-10",
                    isExpanded ? "px-3 w-full" : "justify-center w-6" 
                  )}>
                    <IconWithTooltip icon={link.icon} label={link.label} isExpanded={isExpanded} />
                    {isExpanded && (
                      <span className="ml-3 text-base font-medium whitespace-nowrap overflow-hidden text-ellipsis transition-all duration-300">{link.label}</span>
                    )}
                  </div>
                  {link.active && (
                    isExpanded ? (
                      <div className="absolute right-0 top-0 h-full w-2 rounded-l-lg bg-[#c49c48] z-20" />
                    ) : (
                      <div className="absolute right-2 top-1/2 -translate-y-1/2 h-2 w-2 rounded-full bg-[#c49c48] z-20" />
                    )
                  )}
                </Link>
                {isExpanded && link.label === "Historique" && !loading && chatHistory && chatHistory.length > 0 && (
                  <div className="relative pl-8 mt-1 space-y-0.5">
                    <div className="absolute left-6 top-0 bottom-0 w-[1px] bg-black/10 dark:bg-white/10" />
                    {chatHistory.map((chat) => (
                      <Link
                        key={chat.id}
                        href={`/c/${chat.id}`}
                        className="flex items-center py-1.5 text-base text-black/70 dark:text-white/70 hover:text-black dark:hover:text-white transition-colors duration-200"
                      >
                        <span className="truncate max-w-[160px]">{chat.title}</span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </VerticalIconContainer>

          <div className="flex flex-col items-center gap-y-4 w-full ">
            <button 
              onClick={() => setIsExpanded(!isExpanded)}
              className={cn(
                "flex items-center w-full h-10 cursor-pointer hover:bg-black/10 dark:hover:bg-white/10 rounded-lg",
                isExpanded ? "px-3" : "justify-center"
              )}
            >
              <div className="flex items-center justify-center h-full">
                {isExpanded ? (
                  <>
                    <ArrowLeftToLine className="w-4 h-4 shrink-0 text-black dark:text-white" />
                    <span className="ml-3 text-base font-medium text-black/70 dark:text-white/70 whitespace-nowrap transition-all duration-300">Réduire</span>
                  </>
                ) : (
                  <TooltipProvider delayDuration={0}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center justify-center h-full">
                          <ArrowRightToLine className="w-4 h-4 shrink-0 text-black dark:text-white" />
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="right">
                        Étendre
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </div>
            </button>

            <div className="w-full h-px bg-black/10 dark:bg-white/10" />

            <Link
              href="/settings"
              className={cn(
                "flex items-center w-full h-10 cursor-pointer hover:bg-black/10 dark:hover:bg-white/10 rounded-lg",
                isExpanded ? "px-3" : "justify-center",
                segments.includes('settings') ? "text-black dark:text-white" : "text-black/70 dark:text-white/70"
              )}
            >
              <div className="flex items-center justify-center h-full">
                {isExpanded ? (
                  <>
                    <div className={cn(
                      "w-8 h-8 relative shrink-0 flex items-center justify-center bg-light-primary dark:bg-dark-primary rounded-full",
                      segments.includes('settings') && "bg-[#c49c48]/20"
                    )}>
                      <User className={cn(
                        "w-4 h-4 text-black dark:text-white",
                        segments.includes('settings') && "text-[#c49c48]"
                      )} />
                    </div>
                    <span className={cn(
                      "ml-3 text-base whitespace-nowrap font-medium transition-all duration-300",
                      segments.includes('settings') ? "text-[#c49c48]" : "text-black/70 dark:text-white/70"
                    )}>Mon Profil</span>
                  </>
                ) : (
                  <TooltipProvider delayDuration={0}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className={cn(
                          "w-8 h-8 relative flex items-center justify-center bg-light-primary dark:bg-dark-primary rounded-full",
                          segments.includes('settings') && "bg-[#c49c48]/20"
                        )}>
                          <User className={cn(
                            "w-4 h-4 text-black dark:text-white",
                            segments.includes('settings') && "text-[#c49c48]"
                          )} />
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="right">
                        Mon Profil
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </div>
            </Link>
          </div>
        </div>
      </div>

      {/* Mobile Navigation - Only on home page */}
      {(segments.length === 0) && (
        <div className="fixed top-0 left-0 right-0 w-full z-[100] flex justify-between items-center px-4 py-4 lg:hidden">
          <div className="w-8 h-8">
            <Image
              src="/images/logo.svg"
              alt="Logo"
              width={32}
              height={32}
              className="w-full h-full"
            />
          </div>
          <Link href="/settings">
            <div className={cn(
              "w-8 h-8 relative flex items-center justify-center bg-light-primary dark:bg-dark-primary rounded-full",
              segments.includes('settings') && "bg-[#c49c48]/20"
            )}>
              <User className={cn(
                "w-4 h-4 text-black dark:text-white",
                segments.includes('settings') && "text-[#c49c48]"
              )} />
            </div>
          </Link>
        </div>
      )}

      <div className={cn(
        "fixed bottom-0 left-0 right-0 w-full z-[100] flex flex-row items-center justify-between bg-dark-secondary px-4 py-4 shadow-t-sm lg:hidden transition-transform duration-300",
        isNavVisible ? "translate-y-0" : "translate-y-full"
      )}>
        {navLinks.map((link, i) => (
          <Link
            href={link.href}
            key={i}
            className={cn(
              'relative flex flex-col items-center space-y-1 text-center w-full',
              link.active
                ? 'text-white'
                : 'text-white/70',
            )}
          >
            {link.active && (
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -mt-2 h-2 w-2 rounded-full bg-[#c49c48]" />
            )}
            <link.icon className="w-4 h-4 text-white" />
            <p className="text-xs">{link.label}</p>
          </Link>
        ))}
      </div>

      {children}

      <style jsx global>{`
        .hide-scrollbar {
          -ms-overflow-style: none;  /* IE and Edge */
          scrollbar-width: none;     /* Firefox */
          padding-right: 17px;       /* Compense la largeur de la scrollbar */
          margin-right: -17px;       /* Annule le padding pour maintenir la largeur totale */
        }
        
        .hide-scrollbar::-webkit-scrollbar {
          display: none;             /* Chrome, Safari and Opera */
        }
      `}</style>
    </div>
  );
};

export default Sidebar;