'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LanguageSwitcher() {
  const [currentLocale, setCurrentLocale] = useState('fr');
  const router = useRouter();

  useEffect(() => {
    // Récupérer la locale du localStorage au chargement
    const savedLocale = localStorage.getItem('locale') || 'fr';
    setCurrentLocale(savedLocale);
  }, []);

  const changeLanguage = (locale: string) => {
    // Sauvegarder la locale dans le localStorage
    localStorage.setItem('locale', locale);
    setCurrentLocale(locale);
    
    // Recharger la page pour appliquer la nouvelle langue
    window.location.reload();
  };

  return (
    <div className="flex items-center space-x-2">
      <button
        onClick={() => changeLanguage('fr')}
        className={`px-2 py-1 text-sm rounded ${
          currentLocale === 'fr' 
            ? 'bg-primary text-white' 
            : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
        }`}
      >
        FR
      </button>
      <button
        onClick={() => changeLanguage('en')}
        className={`px-2 py-1 text-sm rounded ${
          currentLocale === 'en' 
            ? 'bg-primary text-white' 
            : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
        }`}
      >
        EN
      </button>
    </div>
  );
} 