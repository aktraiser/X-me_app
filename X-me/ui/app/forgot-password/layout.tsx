'use client';

import { Montserrat } from 'next/font/google';
import { Toaster } from 'sonner';
import { cn } from '@/lib/utils';
import ThemeProvider from '@/components/theme/Provider';

const montserrat = Montserrat({
  weight: ['300', '400', '500', '700'],
  subsets: ['latin'],
  display: 'swap',
  fallback: ['Arial', 'sans-serif'],
});

export default function ForgotPasswordLayout({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <div className={cn('min-h-screen bg-[#0F172A]', montserrat.className)}>
      <ThemeProvider>
        {children}
        <Toaster
          toastOptions={{
            unstyled: true,
            classNames: {
              toast:
                'bg-light-primary dark:bg-dark-secondary dark:text-white/70 text-black-70 rounded-lg p-4 flex flex-row items-center space-x-2',
            },
          }}
        />
      </ThemeProvider>
    </div>
  );
} 