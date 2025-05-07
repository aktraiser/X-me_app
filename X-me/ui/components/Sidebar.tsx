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

const VerticalIconContainer = ({ children }: { children: ReactNode }) => (
  <div className="flex flex-col items-center gap-y-3 w-full">
    {children}
  </div>
);

const IconWithTooltip = ({ icon: Icon, label, isExpanded }: { icon: any; label: string; isExpanded: boolean; }) => {
  return isExpanded ? (
    <Icon className="w-4 h-4 text-black dark:text-white" />
  ) : (
    <TooltipProvider delayDuration={0}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="inline-flex">
            <Icon className="w-4 h-4 text-black dark:text-white" />
          </span>
        </TooltipTrigger>
        <TooltipContent side="right" align="center" sideOffset={4} className="flex items-center gap-2">
          {label}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

const Sidebar = ({ children, onExpandChange }: { children?: ReactNode; onExpandChange?: (expanded: boolean) => void; }) => {
  const segments = useSelectedLayoutSegments();
  const [isExpanded, setIsExpanded] = useState(false);
  const [chatHistory, setChatHistory] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const supabase = createClient();
  const { isNavVisible } = useNavVisibility();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) setUser(session.user);
    });
  }, [supabase]);

  useEffect(() => {
    const controller = new AbortController();
    const signal = controller.signal;
    const fetchChats = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${getApiUrl()}/chats`, { signal });
        const { chats } = await res.json();
        if (chats) {
          setChatHistory(prev => {
            const recent = prev.slice(-3);
            const newChats = chats.filter((c: Chat) => !recent.some(r => r.id === c.id));
            return [...newChats, ...recent].slice(-3);
          });
        }
      } catch (err) {
        if ((err as Error).name !== 'AbortError') console.error(err);
      } finally {
        setLoading(false);
      }
    };
    if (isExpanded) fetchChats();
    return () => controller.abort();
  }, [isExpanded]);

  useEffect(() => onExpandChange?.(isExpanded), [isExpanded, onExpandChange]);

  const navLinks = [
    { icon: Home, href: '/', active: segments.length === 0 || segments.includes('c'), label: 'Accueil' },
    { icon: Search, href: '/discover', active: segments.includes('discover'), label: 'Nos experts' },
    { icon: Library, href: '/library', active: segments.includes('library'), label: 'Historique' },
  ];

  return (
    <div>
      <aside
        className={cn(
          "hidden lg:flex lg:fixed lg:inset-y-0 lg:z-50 lg:flex-col bg-light-secondary dark:bg-dark-secondary overflow-hidden transition-all duration-300 ease-in-out",
          isExpanded ? "lg:w-48" : "lg:w-14"
        )}
      >
        <div className="flex flex-col justify-between h-full py-8 px-2">
          {/* Logo & New Chat */}
          <div className="space-y-4">
            <div className="flex items-center justify-center w-full">
              <Image src="/images/logo.svg" alt="Logo" width={40} height={40} />
            </div>
            <button
              onClick={() => window.location.href = '/'}
              className={cn(
                "w-full h-12 flex items-center rounded-lg transition-all duration-200",
                isExpanded ? "px-3 hover:border-[#c49c48] border border-transparent" : "justify-center hover:bg-black/10 dark:hover:bg-white/10"
              )}
            >
              {isExpanded ? (
                <div className="flex items-center w-full gap-3 px-3">
                  <Plus className="w-4 h-4" />
                  <span className="truncate">Nouvelle Discussion</span>
                </div>
              ) : (
                <TooltipProvider delayDuration={0}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="w-8 h-8 flex items-center justify-center rounded-full bg-light-primary dark:bg-dark-primary hover:bg-[#c49c48]/20 transition-colors">
                        <Plus className="w-4 h-4" />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="right" align="center" sideOffset={4}>Nouvelle discussion</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </button>
          </div>

          {/* Navigation Links */}
          <div className="flex flex-col items-center gap-y-3">
            {navLinks.map((link, i) => (
              <div key={i} className="w-full">
                <Link
                  href={link.href}
                  className={cn(
                    "relative flex items-center w-full h-10 rounded-lg transition-all duration-200",
                    link.active 
                      ? isExpanded 
                        ? "bg-[#c49c48]/20 text-white" 
                        : "text-black dark:text-white" 
                      : "text-black/70 dark:text-white/70 hover:bg-black/10 dark:hover:bg-white/10",
                    isExpanded ? "px-3" : "justify-center"
                  )}
                >
                  <IconWithTooltip icon={link.icon} label={link.label} isExpanded={isExpanded} />
                  {isExpanded && <span className="ml-3 truncate">{link.label}</span>}
                  {link.active && (
                    <span className={cn(
                      "absolute bg-[#c49c48]",
                      isExpanded 
                        ? "w-1 right-0 top-0 h-full" 
                        : "w-1 h-8 rounded-r-md left-0"
                    )} />
                  )}
                </Link>
                {/* Chat History under Historique */}
                {isExpanded && link.label === 'Historique' && !loading && chatHistory.length > 0 && (
                  <div className="pl-10 mt-2 space-y-1 relative">
                    <div className="absolute left-8 top-0 bottom-0 w-px bg-black/10 dark:bg-white/10" />
                    {chatHistory.map(chat => (
                      <Link
                        key={chat.id}
                        href={`/c/${chat.id}`}
                        className="block truncate max-w-[160px] py-1 hover:text-black dark:hover:text-white transition-colors"
                      >{chat.title}</Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Footer: Expand & Profile */}
          <div className="space-y-4">
            <button
              onClick={() => setIsExpanded(prev => !prev)}
              className={cn(
                "flex items-center w-full h-10 rounded-lg transition-all duration-200",
                isExpanded ? "px-3 justify-start hover:bg-black/10" : "justify-center hover:bg-black/10 dark:hover:bg-white/10"
              )}
            >
              {isExpanded ? (
                <>
                  <ArrowLeftToLine className="w-4 h-4" />
                  <span className="ml-3">Réduire</span>
                </>
              ) : (
                <TooltipProvider delayDuration={0}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <ArrowRightToLine className="w-4 h-4" />
                    </TooltipTrigger>
                    <TooltipContent side="right" align="center" sideOffset={4}>Étendre</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </button>
            <div className="w-full h-px bg-black/10 dark:bg-white/10" />
            <Link
              href="/settings"
              className={cn(
                "flex items-center w-full h-10 rounded-lg transition-all duration-200",
                isExpanded ? "px-3" : "justify-center",
                segments.includes('settings') 
                  ? isExpanded 
                    ? 'bg-[#c49c48]/20 text-white' 
                    : 'text-[#c49c48]' 
                  : 'text-black/70 dark:text-white/70',
                'hover:bg-black/10 dark:hover:bg-white/10'
              )}
            >
              <div className={cn(
                "inline-flex items-center justify-center w-8 h-8 rounded-full bg-light-primary dark:bg-dark-primary",
                segments.includes('settings') && "bg-[#c49c48]/20"
              )}>
                <User className={cn(
                  'w-4 h-4', 
                  segments.includes('settings') && 'text-[#c49c48]'
                )} />
              </div>
              {isExpanded && <span className="ml-3">Mon Profil</span>}
            </Link>
          </div>
        </div>
      </aside>

      {/* Mobile Navigation */}
      {segments.length === 0 && (
        <nav className="fixed top-0 left-0 right-0 flex justify-between items-center p-4 bg-light-secondary dark:bg-dark-secondary z-[100] lg:hidden">
          <Image src="/images/logo.svg" alt="Logo" width={32} height={32} />
          <Link href="/settings">
            <div className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center bg-light-primary dark:bg-dark-primary",
              segments.includes('settings') && 'bg-[#c49c48]/20'
            )}>
              <User className={cn('w-4 h-4', segments.includes('settings') && 'text-[#c49c48]')} />
            </div>
          </Link>
        </nav>
      )}

      {/* Bottom Nav */}
      <nav className={cn(
        "fixed bottom-0 left-0 right-0 flex justify-around items-center p-4 bg-dark-secondary shadow-t-sm z-[100] lg:hidden transition-transform duration-300 ease-in-out",
        isNavVisible ? 'translate-y-0' : 'translate-y-full'
      )}>
        {navLinks.map((link, i) => (
          <Link 
            key={i} 
            href={link.href} 
            className="flex flex-col items-center space-y-1"
          >
            {link.active && (
              <span className="absolute top-0 left-1/2 transform -translate-x-1/2 -mt-2 w-2 h-2 rounded-full bg-[#c49c48]" />
            )}
            <link.icon className={cn(
              "w-4 h-4 text-white",
              link.active && "text-[#c49c48]"
            )} />
            <span className={cn(
              "text-xs",
              link.active ? "text-[#c49c48]" : "text-white/70"
            )}>{link.label}</span>
          </Link>
        ))}
      </nav>

      {children}

      <style jsx global>{`
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
          padding-right: 17px;
          margin-right: -17px;
        }
        .hide-scrollbar::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
};

export default Sidebar;