'use client';

import { usePathname } from 'next/navigation';
import Sidebar from './Sidebar';
import InfoBubble from './InfoBubble';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { NavVisibilityProvider, useNavVisibility } from '@/hooks/useNavVisibility';

interface LayoutProps {
  children: React.ReactNode;
}

// Composant interne qui utilise le hook useNavVisibility
const LayoutContent = ({ children }: LayoutProps) => {
  const pathname = usePathname();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isAuthRoute, setIsAuthRoute] = useState(false);
  const [isTextContentRoute, setIsTextContentRoute] = useState(false);
  const [isPublicRoute, setIsPublicRoute] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);
  const { isNavVisible, setNavVisible } = useNavVisibility();

  // Vérifier si c'est une route d'authentification ou une route publique
  useEffect(() => {
    // Routes d'authentification strictes (formulaires de connexion/inscription)
    const isPathAuthRoute = [
      '/sign-in',
      '/sign-up',
      '/auth',
      '/forgot-password',
      '/reset-password',
      '/sso-callback',
      '/clerk', // Routes dynamiques de Clerk
      '/__clerk' // Routes internes de Clerk
    ].some(route => pathname.startsWith(route));

    // Routes avec contenu textuel plus large (conditions, vie privée)
    const isPathTextContentRoute = [
      '/terms',
      '/privacy',
      '/politique-confidentialite',
      '/conditions-utilisation'
    ].some(route => pathname.startsWith(route));

    // Routes publiques accessibles sans connexion
    const isPathPublicRoute = [
      '/a-propos'
    ].some(route => pathname.startsWith(route));

    setIsAuthRoute(isPathAuthRoute);
    setIsTextContentRoute(isPathTextContentRoute);
    setIsPublicRoute(isPathPublicRoute);
  }, [pathname]);

  // Gestion du scroll pour la navigation mobile
  useEffect(() => {
    const handleScroll = () => {
      // Récupérer l'élément de défilement principal
      const scrollContainer = document.getElementById('main-scroll-container');
      if (!scrollContainer) return;
      
      const currentScrollY = scrollContainer.scrollTop;
      
      if (currentScrollY > lastScrollY && currentScrollY > 20) {
        // Défilement vers le bas - masquer la navigation
        setNavVisible(false);
      } else if (currentScrollY < lastScrollY) {
        // Défilement vers le haut - afficher la navigation
        setNavVisible(true);
      }
      
      setLastScrollY(currentScrollY);
    };
    
    const scrollContainer = document.getElementById('main-scroll-container');
    if (scrollContainer) {
      scrollContainer.addEventListener('scroll', handleScroll, { passive: true });
      
      return () => {
        scrollContainer.removeEventListener('scroll', handleScroll);
      };
    }
  }, [lastScrollY, setNavVisible]);

  // Layout pour les routes d'authentification (modales étroites)
  if (isAuthRoute) {
    return (
      <div className="min-h-screen bg-[#F5F5EC] dark:bg-[#0F172A] flex items-center justify-center p-4">
        {/* Conteneur pour les formulaires d'authentification Clerk */}
        <div className="clerk-container w-full max-w-md">
          {children}
        </div>
        
        {/* Lien vers les préférences de consentement Termly */}
        <div className="fixed bottom-2 right-4">
          <a href="#" className="termly-display-preferences text-xs text-gray-500 dark:text-gray-400 hover:underline">
            Préférences de consentement
          </a>
        </div>
      </div>
    );
  }

  // Layout pour les pages de contenu textuel (plus larges)
  if (isTextContentRoute) {
    return (
      <div className="min-h-screen bg-[#F5F5EC] dark:bg-[#0F172A] flex items-center justify-center">
        <main className="flex flex-col w-full max-w-4xl px-4 py-8">
          {children}
        </main>
        
        {/* Lien vers les préférences de consentement Termly */}
        <div className="fixed bottom-2 right-4">
          <a href="#" className="termly-display-preferences text-xs text-gray-500 dark:text-gray-400 hover:underline">
            Préférences de consentement
          </a>
        </div>
      </div>
    );
  }

  // Layout standard pour les routes protégées (avec sidebar complète)
  return (
    <div className="min-h-screen bg-light-secondary dark:bg-dark-secondary flex overflow-hidden relative">
      {/* Sidebar - visible on all screens */}
      <Sidebar onExpandChange={setIsExpanded} />

      {/* Main content area */}
      <div className={cn(
        "flex-1 transition-all duration-300 w-full",
        // Add bottom padding for mobile to account for bottom navigation
        "pb-[88px] lg:pb-0",
        // No left padding on mobile, adjust for desktop
        "pl-0",
        // Desktop padding based on sidebar state
        isExpanded ? "lg:pl-56" : "lg:pl-20"
      )}>
        <div className={cn(
          "fixed inset-0 transition-all duration-300",
          // Add bottom padding for mobile to account for bottom navigation
          "pb-[88px] lg:pb-0",
          // No left padding on mobile, adjust for desktop
          "pl-0",
          // Desktop padding based on sidebar state
          isExpanded ? "lg:pl-56" : "lg:pl-20"
        )}>
          <div className={cn(
            "h-screen lg:h-[calc(100vh-24px)]",
            "bg-light-primary dark:bg-dark-primary",
            // Mobile: full width, no margins
            "m-0",
            // Desktop: margins and rounded corners
            "lg:m-3 lg:ml-0 lg:rounded-xl"
          )}>
            <div className="h-full overflow-y-auto scrollbar-hide" id="main-scroll-container">
              <div className="w-full max-w-none mx-auto">
                {children}
              </div>
              
              {/* Footer avec lien vers les préférences de consentement Termly */}
              <div className="px-4 py-2 border-t border-gray-200 dark:border-gray-700 text-center">
                <a href="#" className="termly-display-preferences text-sm text-gray-500 dark:text-gray-400 hover:underline">
                  Préférences de consentement
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Info bubble - hidden on mobile, visible from desktop up */}
      <div className="hidden lg:block">
        <InfoBubble />
      </div>
    </div>
  );
};

// Composant Layout qui encapsule le contenu avec NavVisibilityProvider
const Layout = ({ children }: LayoutProps) => {
  return (
    <NavVisibilityProvider>
      <LayoutContent>{children}</LayoutContent>
    </NavVisibilityProvider>
  );
};

export default Layout;