'use client';

import { usePathname } from 'next/navigation';
import Sidebar from './Sidebar';
import InfoBubble from './InfoBubble';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const pathname = usePathname();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isAuthRoute, setIsAuthRoute] = useState(false);

  // Vérifier si c'est une route d'authentification via les en-têtes
  // ou fallback sur la vérification des chemins
  useEffect(() => {
    // Vérification basée sur les chemins comme fallback
    const isPathAuthRoute = [
      '/login',
      '/auth',
      '/register',
      '/forgot-password',
      '/sign-in',
      '/sign-up'
    ].some(route => pathname.startsWith(route));

    setIsAuthRoute(isPathAuthRoute);

    // On pourrait ajouter ici une vérification d'en-tête avec fetch
    // si nécessaire dans le futur
  }, [pathname]);

  if (isAuthRoute) {
    return (
      <div className="min-h-screen bg-light-secondary dark:bg-dark-secondary">
        <main className="max-w-[1200px] w-full mx-auto px-4">
          {children}
        </main>
      </div>
    );
  }

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

export default Layout;