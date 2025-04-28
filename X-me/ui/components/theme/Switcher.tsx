'use client';
import { useTheme } from 'next-themes';
import { SunIcon, MoonIcon, MonitorIcon } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';


type Theme = 'sombre' | 'lumière' | 'system';

const ThemeSwitcher = ({ className }: { className?: string }) => {
  const [mounted, setMounted] = useState(false);

  const { theme, setTheme } = useTheme();

  const isTheme = useCallback((t: Theme) => t === theme, [theme]);

  const handleThemeSwitch = (theme: Theme) => {
    setTheme(theme);
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isTheme('system')) {
      const preferDarkScheme = window.matchMedia(
        '(prefers-color-scheme: sombre)',
      );

      const detectThemeChange = (event: MediaQueryListEvent) => {
        const theme: Theme = event.matches ? 'sombre' : 'lumière';
        setTheme(theme);
      };

      preferDarkScheme.addEventListener('change', detectThemeChange);

      return () => {
        preferDarkScheme.removeEventListener('change', detectThemeChange);
      };
    }
  }, [isTheme, setTheme, theme]);

  // Avoid Hydration Mismatch
  if (!mounted) {
    return null;
  }

  return (
    <select
      className={`${className} p-2 rounded bg-light-primary dark:bg-dark-primary text-black dark:text-white border border-black/10 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-indigo-500`}
      value={theme}
      onChange={(e) => handleThemeSwitch(e.target.value as Theme)}
    >
      <option value="lumière">Lumière</option>
      <option value="sombre">Sombre</option>
      <option value="system">Système</option>
    </select>
  );
};

export default ThemeSwitcher;
