'use client';

import { cn } from '@/lib/utils';
import { Home, Search, Plus, Settings, ArrowLeftToLine, ArrowRightToLine, User, Library } from 'lucide-react';
import Link from 'next/link';
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
import { Session } from '@supabase/supabase-js';

interface Chat {
  id: string;
  title: string;
  createdAt: string;
  focusMode: string;
}

// Constantes pour les dimensions de la barre latérale
const SIDEBAR_WIDTH = "14rem";
const SIDEBAR_WIDTH_COLLAPSED = "5rem";

// Context pour gérer l'état de la barre latérale
const SidebarContext = React.createContext<{
  isExpanded: boolean;
  setIsExpanded: React.Dispatch<React.SetStateAction<boolean>>;
}>({
  isExpanded: false,
  setIsExpanded: () => {},
});

// Hook pour utiliser le contexte de la barre latérale
const useSidebar = () => {
  const context = React.useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar doit être utilisé dans un SidebarProvider");
  }
  return context;
};

// Provider pour le contexte de la barre latérale
const SidebarProvider = ({ children, defaultExpanded = false, onExpandChange }: { 
  children: ReactNode; 
  defaultExpanded?: boolean;
  onExpandChange?: (expanded: boolean) => void;
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  // Notifier le parent du changement d'état
  useEffect(() => {
    onExpandChange?.(isExpanded);
  }, [isExpanded, onExpandChange]);

  return (
    <SidebarContext.Provider value={{ isExpanded, setIsExpanded }}>
      {children}
    </SidebarContext.Provider>
  );
};

// Composant pour le logo
const SidebarLogo = () => {
  return (
    <div className="flex items-center justify-center w-full px-2.5">
      <img
        src="/images/logo.svg"
        alt="Logo X&ME"
        className="w-10 h-10"
      />
    </div>
  );
};

// Composant pour le bouton de nouvelle discussion
const SidebarNewChat = () => {
  const { isExpanded } = useSidebar();

  return (
    <button
      onClick={() => window.location.href = '/'}
      className={cn(
        "w-full flex items-center rounded-lg transition-all duration-200",
        isExpanded 
          ? "px-3 border border-black/10 dark:border-white/10 hover:border-[#c49c48] dark:hover:border-[#c49c48] h-10" 
          : "justify-center hover:bg-black/10 dark:hover:bg-white/10 py-2"
      )}
    >
      {isExpanded ? (
        <div className="flex items-center w-full gap-3">
          <Plus className="w-4 h-4 text-black dark:text-white" />
          <span className="truncate text-black dark:text-white">Nouvelle Discussion</span>
        </div>
      ) : (
        <TooltipProvider delayDuration={0}>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="w-8 h-8 flex items-center justify-center rounded-full bg-light-primary dark:bg-dark-primary hover:bg-[#c49c48]/20 transition-colors">
                <Plus className="w-4 h-4 text-black dark:text-white" />
              </div>
            </TooltipTrigger>
            <TooltipContent side="right" align="center" sideOffset={4}>Nouvelle discussion</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </button>
  );
};

// Composant pour l'en-tête de la barre latérale
const SidebarHeader = () => {
  return (
    <div className="space-y-4 mb-6">
      <SidebarLogo />
      <SidebarNewChat />
    </div>
  );
};

// Composant pour un élément de menu
const SidebarMenuItem = ({ 
  icon: Icon, 
  label, 
  href, 
  active 
}: { 
  icon: React.ElementType; 
  label: string; 
  href: string; 
  active: boolean;
}) => {
  const { isExpanded } = useSidebar();

  return (
    <Link
      href={href}
      className={cn(
        "relative flex items-center w-full rounded-lg transition-all duration-200 cursor-pointer",
        active 
          ? isExpanded 
            ? "bg-[#c49c48]/20 text-black dark:text-white px-3 h-10" 
            : "text-black dark:text-white py-2 flex justify-center" 
          : isExpanded
            ? "text-black/70 dark:text-white/70 hover:bg-black/10 dark:hover:bg-white/10 px-3 h-10"
            : "text-black/70 dark:text-white/70 hover:bg-black/10 dark:hover:bg-white/10 py-2 flex justify-center"
      )}
    >
      {isExpanded ? (
        <>
          <Icon className="w-4 h-4 text-black dark:text-white" />
          <span className="ml-3 truncate">{label}</span>
        </>
      ) : (
        <TooltipProvider delayDuration={0}>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex flex-col items-center">
                <Icon className={cn(
                  "w-4 h-4", 
                  active ? "text-[#c49c48]" : "text-black dark:text-white"
                )} />
                {active && (
                  <div className="w-1.5 h-1.5 rounded-full bg-[#c49c48] mt-1"></div>
                )}
              </div>
            </TooltipTrigger>
            <TooltipContent side="right" align="center" sideOffset={4}>
              {label}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
      {active && isExpanded && (
        <span className="absolute bg-[#c49c48] w-1 right-0 top-0 h-full rounded-l-md" />
      )}
    </Link>
  );
};

// Composant pour l'historique des discussions
const ChatHistoryList = ({ chatHistory }: { chatHistory: Chat[] }) => {
  if (chatHistory.length === 0) return null;

  return (
    <div className="pl-10 mt-2 space-y-1 relative">
      <div className="absolute left-8 top-0 bottom-0 w-px bg-black/10 dark:bg-white/10" />
      {chatHistory.map(chat => (
        <Link
          key={chat.id}
          href={`/c/${chat.id}`}
          className="block truncate max-w-[160px] py-1 text-black/70 dark:text-white/70 hover:text-black dark:hover:text-white transition-colors"
        >
          {chat.title}
        </Link>
      ))}
    </div>
  );
};

// Composant pour la navigation principale
const SidebarNav = ({ chatHistory }: { chatHistory: Chat[] }) => {
  const segments = useSelectedLayoutSegments();
  const { isExpanded } = useSidebar();
  const [loading] = useState(false);

  const navLinks = [
    { icon: Home, href: '/', active: segments.length === 0 || segments.includes('c'), label: 'Accueil' },
    { icon: Search, href: '/discover', active: segments.includes('discover'), label: 'Nos experts' },
    { icon: Library, href: '/library', active: segments.includes('library'), label: 'Historique' },
  ];

  return (
    <div className="space-y-3">
      {navLinks.map((link, i) => (
        <div key={i} className="w-full">
          <SidebarMenuItem 
            icon={link.icon} 
            label={link.label} 
            href={link.href} 
            active={link.active} 
          />
          {isExpanded && link.label === 'Historique' && !loading && chatHistory.length > 0 && 
            <ChatHistoryList chatHistory={chatHistory} />
          }
        </div>
      ))}
    </div>
  );
};

// Composant pour le bouton d'expansion/réduction
const SidebarToggleButton = () => {
  const { isExpanded, setIsExpanded } = useSidebar();

  return (
    <button
      onClick={() => setIsExpanded(prev => !prev)}
      className={cn(
        "flex items-center w-full rounded-lg transition-all duration-200 cursor-pointer",
        isExpanded 
          ? "px-3 justify-start hover:bg-black/10 dark:hover:bg-white/10 h-10" 
          : "justify-center hover:bg-black/10 dark:hover:bg-white/10 py-2"
      )}
    >
      {isExpanded ? (
        <>
          <ArrowLeftToLine className="w-4 h-4 text-black dark:text-white" />
          <span className="ml-3 text-black dark:text-white">Réduire</span>
        </>
      ) : (
        <TooltipProvider delayDuration={0}>
          <Tooltip>
            <TooltipTrigger asChild>
              <ArrowRightToLine className="w-4 h-4 text-black dark:text-white" />
            </TooltipTrigger>
            <TooltipContent side="right" align="center" sideOffset={4}>Étendre</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </button>
  );
};

// Composant pour le lien vers le profil
const SidebarProfileLink = () => {
  const segments = useSelectedLayoutSegments();
  const { isExpanded } = useSidebar();
  const isActive = segments.includes('settings');

  return (
    <Link
      href="/settings"
      className={cn(
        "flex items-center w-full rounded-lg transition-all duration-200 cursor-pointer",
        isExpanded 
          ? "px-3 h-10" 
          : "justify-center py-2",
        isActive 
          ? isExpanded 
            ? 'bg-[#c49c48]/20 text-white' 
            : 'text-[#c49c48]' 
          : 'text-black/70 dark:text-white/70',
        'hover:bg-black/10 dark:hover:bg-white/10'
      )}
    >
      {isExpanded ? (
        <>
          <div className={cn(
            "inline-flex items-center justify-center w-8 h-8 rounded-full bg-light-primary dark:bg-dark-primary",
            isActive && "bg-[#c49c48]/20"
          )}>
            <User className={cn(
              'w-4 h-4', 
              isActive && 'text-[#c49c48]'
            )} />
          </div>
          <span className="ml-3 whitespace-normal leading-tight">Mon Profil</span>
        </>
      ) : (
        <TooltipProvider delayDuration={0}>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex flex-col items-center">
                <User className={cn(
                  'w-4 h-4', 
                  isActive && 'text-[#c49c48]'
                )} />
                {isActive && (
                  <div className="w-1.5 h-1.5 rounded-full bg-[#c49c48] mt-1"></div>
                )}
              </div>
            </TooltipTrigger>
            <TooltipContent side="right" align="center" sideOffset={4}>
              Mon Profil
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </Link>
  );
};

// Composant pour le pied de la barre latérale
const SidebarFooter = () => {
  return (
    <div className="space-y-4 w-full mt-auto">
      <SidebarToggleButton />
      <div className="w-full h-px bg-black/10 dark:bg-white/10" />
      <SidebarProfileLink />
    </div>
  );
};

// Composant pour la barre latérale sur desktop
const SidebarDesktop = ({ chatHistory }: { chatHistory: Chat[] }) => {
  const { isExpanded } = useSidebar();

  return (
    <aside
      className={cn(
        "hidden lg:flex lg:fixed lg:inset-y-0 lg:z-50 lg:flex-col bg-light-secondary dark:bg-dark-secondary transition-all duration-300 ease-in-out",
        isExpanded ? `lg:w-[${SIDEBAR_WIDTH}]` : `lg:w-[${SIDEBAR_WIDTH_COLLAPSED}]`
      )}
      style={{
        width: isExpanded ? SIDEBAR_WIDTH : SIDEBAR_WIDTH_COLLAPSED
      }}
    >
      <div className="flex grow flex-col justify-between h-full px-2 py-8">
        <SidebarHeader />
        <SidebarNav chatHistory={chatHistory} />
        <SidebarFooter />
      </div>
    </aside>
  );
};

// Composant principal de la barre latérale
const Sidebar = ({ children, onExpandChange }: { children?: ReactNode; onExpandChange?: (expanded: boolean) => void; }) => {
  const segments = useSelectedLayoutSegments();
  const [chatHistory, setChatHistory] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const supabase = createClient();
  const { isNavVisible } = useNavVisibility();
  
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }: { data: { session: Session | null } }) => {
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
    fetchChats();
    return () => controller.abort();
  }, []);

  // Navigation links pour le mobile
  const navLinks = [
    { icon: Home, href: '/', active: segments.length === 0 || segments.includes('c'), label: 'Accueil' },
    { icon: Search, href: '/discover', active: segments.includes('discover'), label: 'Nos experts' },
    { icon: Library, href: '/library', active: segments.includes('library'), label: 'Historique' },
  ];

  return (
    <SidebarProvider defaultExpanded={false} onExpandChange={onExpandChange}>
      <div>
        {/* Desktop Sidebar */}
        <SidebarDesktop chatHistory={chatHistory} />
        
        {/* Mobile Header */}
        <nav className="fixed top-0 left-0 right-0 flex justify-between items-center p-4 bg-light-secondary dark:bg-dark-secondary z-[100] lg:hidden">
          <img
            src="/images/logo.svg"
            alt="Logo X&ME"
            className="w-8 h-8"
          />
          <Link href="/settings">
            <div className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center bg-light-primary dark:bg-dark-primary",
              segments.includes('settings') && 'bg-[#c49c48]/20'
            )}>
              <User className={cn('w-4 h-4 text-black dark:text-white', segments.includes('settings') && 'text-[#c49c48]')} />
            </div>
          </Link>
        </nav>
        
        {/* Mobile Bottom Navigation */}
        <nav className={cn(
          "fixed bottom-0 left-0 right-0 flex justify-around items-center p-4 bg-light-secondary dark:bg-dark-secondary shadow-t-sm z-[100] lg:hidden transition-transform duration-300 ease-in-out",
          isNavVisible ? 'translate-y-0' : 'translate-y-full',
          "border-t border-light-700 dark:border-dark-700"
        )}>
          {navLinks.map((link, i) => (
            <Link 
              key={i} 
              href={link.href} 
              className="flex flex-col items-center space-y-1 relative"
            >
              {link.active && (
                <div className="absolute -top-1 w-1.5 h-1.5 rounded-full bg-[#c49c48]" />
              )}
              <link.icon className={cn(
                "w-4 h-4",
                link.active ? "text-[#c49c48]" : "text-black/70 dark:text-white/70"
              )} />
              <span className={cn(
                "text-xs",
                link.active ? "text-black dark:text-[#c49c48]" : "text-black/70 dark:text-white/70"
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
    </SidebarProvider>
  );
};

export default Sidebar;