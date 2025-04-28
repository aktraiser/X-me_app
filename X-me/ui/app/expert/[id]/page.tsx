'use client';

import { Expert } from '@/types/index';
import { Fragment, useEffect, useState } from 'react';
import { User, MapPin, Clock, Briefcase, Star } from 'lucide-react';
import { getExpertById } from '@/lib/supabase';
import Image from 'next/image';
import { Tab } from '@headlessui/react';

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ')
}

export default function ExpertPage({ params }: { params: { id: string } }) {
  const [expert, setExpert] = useState<Expert | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchExpert = async () => {
      try {
        const urlParts = params.id.split('-');
        if (urlParts.length < 5) throw new Error('ID expert invalide');
        
        const uuidParts = urlParts.slice(-5);
        const expertId = uuidParts.join('-');
        
        console.log('Fetching expert with ID:', expertId);
        const expertData = await getExpertById(expertId);
        
        if (!expertData) {
          throw new Error('Expert non trouvé');
        }
        setExpert(expertData);
      } catch (err) {
        console.error('Error fetching expert:', err);
        setError(err instanceof Error ? err.message : 'Une erreur est survenue');
      } finally {
        setLoading(false);
      }
    };

    fetchExpert();
  }, [params.id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 p-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="lg:grid lg:grid-cols-3 lg:gap-x-8">
              <div className="lg:col-span-1">
                <div className="aspect-[1/1] bg-gray-200 dark:bg-gray-800 rounded-full" />
              </div>
              <div className="lg:col-span-2 mt-8 lg:mt-0">
                <div className="h-8 bg-gray-200 dark:bg-gray-800 rounded w-2/3 mb-4" />
                <div className="space-y-3">
                  <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-1/3" />
                  <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-1/2" />
                  <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-1/4" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !expert) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 p-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-2xl font-bold text-red-500 mb-4">
            {error || 'Expert non trouvé'}
          </h1>
          <p className="text-black/70 dark:text-white/70">
            Impossible de charger les informations de l&apos;expert.
          </p>
        </div>
      </div>
    );
  }

  // Extraire la première expertise comme spécialité principale
  const mainExpertise = expert.expertises.split(',')[0].trim();
  // Formatage pour les nombres de missions (exemple)
  const missionCount = 2;
  const rating = 4.5;

  return (
    <div className="min-h-screen bg-white dark:bg-gray-50">
      {/* En-tête de profil */}
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row gap-8 md:gap-16 items-start">
          {/* Photo de profil */}
          <div className="flex-shrink-0">
            <div className="relative w-32 h-32 md:w-40 md:h-40">
              {expert.image_url ? (
                <Image
                  src={expert.image_url}
                  alt={`${expert.prenom} ${expert.nom}`}
                  width={160}
                  height={160}
                  className="rounded-full object-cover border-2 border-gray-100 shadow"
                />
              ) : (
                <div className="w-full h-full rounded-full bg-gray-200 flex items-center justify-center">
                  <User className="w-1/2 h-1/2 text-gray-400" />
                </div>
              )}
            </div>
          </div>

          {/* Informations principales */}
          <div className="flex-grow">
            <h1 className="text-3xl font-bold text-gray-900 mb-1">{expert.prenom} {expert.nom}</h1>
            <p className="text-lg text-gray-700 mb-3">{mainExpertise}</p>
            
            <div className="flex items-center gap-2 mb-4">
              <div className="text-sm text-gray-600">{missionCount} missions</div>
              <div className="flex items-center text-amber-400">
                {[...Array(5)].map((_, i) => (
                  <Star 
                    key={i} 
                    fill={i < Math.floor(rating) ? "currentColor" : "none"} 
                    className="w-4 h-4" 
                  />
                ))}
                {rating % 1 > 0 && (
                  <Star 
                    fill="currentColor" 
                    className="w-4 h-4" 
                    strokeWidth={0} 
                    style={{ clipPath: `inset(0 ${100 - (rating % 1) * 100}% 0 0)` }} 
                  />
                )}
              </div>
              <span className="text-sm text-gray-600">({rating})</span>
            </div>

            {/* Bouton principal */}
            <div className="mt-6">
              <button
                type="button"
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-[#f15959] hover:bg-[#e54545] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#f15959]"
              >
                Contacter
              </button>
            </div>
          </div>
        </div>
        
        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-2 mt-8 border-t border-b border-gray-200 py-6">
          <div className="p-4">
            <h3 className="text-sm font-medium text-gray-500">Tarif indicatif</h3>
            <p className="mt-1 text-2xl font-semibold text-gray-900">{expert.tarif} €<span className="text-sm font-normal text-gray-500">/heure</span></p>
          </div>
          
          <div className="p-4">
            <h3 className="text-sm font-medium text-gray-500">Expérience</h3>
            <p className="mt-1 text-2xl font-semibold text-gray-900">3-7 ans</p>
          </div>
          
          <div className="p-4">
            <h3 className="text-sm font-medium text-gray-500">Taux de réponse</h3>
            <p className="mt-1 text-2xl font-semibold text-gray-900">100%</p>
          </div>
          
          <div className="p-4">
            <h3 className="text-sm font-medium text-gray-500">Temps de réponse</h3>
            <p className="mt-1 text-2xl font-semibold text-gray-900">2h</p>
          </div>
        </div>
      </div>

      {/* Contenu principal en colonnes */}
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Colonne de gauche - Localisation et vérifications */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Localisation et déplacement</h2>
              
              <div className="space-y-4">
                <div>
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <h3 className="font-medium text-gray-700">Localisation</h3>
                      <p className="text-gray-600">{expert.ville}, {expert.pays}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Vérifications</h2>
              
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className="h-5 w-5 rounded-full bg-green-100 flex items-center justify-center">
                    <span className="text-green-600 text-xs">✓</span>
                  </div>
                  <p className="text-gray-600">E-mail vérifié</p>
                </div>
                
                <div className="flex items-center gap-2">
                  <div className="h-5 w-5 rounded-full bg-green-100 flex items-center justify-center">
                    <span className="text-green-600 text-xs">✓</span>
                  </div>
                  <p className="text-gray-600">Charte du freelance Malt signée</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Colonne de droite - Compétences et expertises */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Compétences</h2>
              
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">Compétences clés</h3>
                <div className="flex flex-wrap gap-2 mb-6">
                  {expert.expertises.split(',').map((expertise, index) => (
                    <span
                      key={index}
                      className="bg-gray-100 px-3 py-1 rounded-full text-sm text-gray-700"
                    >
                      {expertise.trim()}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Domaines d&apos;expertise</h2>
              
              <div className="flex flex-wrap gap-2">
                <span className="bg-gray-100 px-3 py-1 rounded-full text-sm text-gray-700">
                  Télécommunications
                </span>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">{expert.prenom} en quelques mots</h2>
              
              <div className="text-gray-600 whitespace-pre-line">
                {expert.biographie}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 