'use client';

import { usePathname } from 'next/navigation';
import Sidebar from './Sidebar';
import InfoBubble from './InfoBubble';
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const pathname = usePathname();
  const [isExpanded, setIsExpanded] = useState(false);
  const isPublicRoute = ['/login', '/auth', '/register', '/forgot-password'].includes(pathname);

  if (isPublicRoute) {
    return (
      <div className="min-h-screen bg-light-primary dark:bg-dark-primary">
        <main className="max-w-[1200px] w-full mx-auto px-4">
          {children}
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-secondary flex overflow-hidden relative">
      {/* Sidebar - hidden on mobile, visible from tablet up */}
      <div className="hidden md:block">
        <Sidebar onExpandChange={setIsExpanded} />
      </div>
      
      {/* Main content area */}
      <div className={cn(
        "flex-1 transition-all duration-300 w-full",
        // No padding on mobile, adjust for tablet/desktop
        "pl-0",
        // Tablet and desktop padding based on sidebar state
        isExpanded ? "md:pl-56" : "md:pl-20"
      )}>
        <div className={cn(
          "fixed inset-0 transition-all duration-300",
          // No padding on mobile, adjust for tablet/desktop
          "pl-0",
          // Tablet and desktop padding based on sidebar state
          isExpanded ? "md:pl-56" : "md:pl-20"
        )}>
          <div className={cn(
            "h-screen md:h-[calc(100vh-24px)]",
            "bg-dark-primary",
            // Mobile: full width, no margins
            "m-0",
            // Tablet/Desktop: margins and rounded corners
            "md:m-3 md:ml-0 md:rounded-xl"
          )}>
            <div className="h-full overflow-y-auto scrollbar-hide" id="main-scroll-container">
              <div className="w-full max-w-none mx-auto">
                {children}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Info bubble - hidden on mobile, visible from tablet up */}
      <div className="hidden md:block">
        <InfoBubble />
      </div>
    </div>
  );
};

export default Layout;