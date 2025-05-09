'use client';

import { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Expert } from '@/types/index';
import { X, Users, Globe, Linkedin, Image as ImageIcon, MapPin, Clock, Building } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

interface ExpertDrawerProps {
  expert: Expert | null;
  open: boolean;
  setOpen: (open: boolean) => void;
  className?: string;
  onContactClick?: () => void;
}

const ExpertDrawer = ({ expert, open, setOpen, className = "max-w-full sm:max-w-3xl", onContactClick }: ExpertDrawerProps) => {
  if (!expert) return null;

  // Utiliser directement le champ activité s'il existe, sinon prendre la première expertise
  const activité = expert.activité || expert.expertises?.split(',')[0].trim() || "Expert";
  
  return (
    <Transition.Root show={open} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={setOpen}>
        <Transition.Child
          as={Fragment}
          enter="ease-in-out duration-500"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in-out duration-500"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-500 dark:bg-gray-900 bg-opacity-75 dark:bg-opacity-80 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-hidden">
          <div className="absolute inset-0 overflow-hidden">
            <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-0 sm:pl-10 md:pl-16">
              <Transition.Child
                as={Fragment}
                enter="transform transition ease-in-out duration-500 sm:duration-700"
                enterFrom="translate-x-full"
                enterTo="translate-x-0"
                leave="transform transition ease-in-out duration-500 sm:duration-700"
                leaveFrom="translate-x-0"
                leaveTo="translate-x-full"
              >
                <Dialog.Panel className={`pointer-events-auto w-screen ${className}`}>
                  <div className="flex h-full flex-col overflow-y-scroll bg-gray-50 dark:bg-gray-900 shadow-xl">
                    <div className="sticky top-0 z-50 w-full border-b border-dark-200 bg-light-secondary dark:bg-dark-primary rounded-t-xl">
                      <div className="flex items-center justify-between px-4 py-4 sm:px-6 sm:py-6">
                        <div>
                          <button
                            type="button"
                            className="relative text-black dark:text-gray-300 hover:text-gray-700 dark:hover:text-gray-200 focus:outline-none"
                            onClick={() => setOpen(false)}
                          >
                            <span className="absolute -inset-2.5" />
                            <span className="sr-only">Fermer le panel</span>
                            <X className="h-6 w-6" aria-hidden="true" />
                          </button>
                        </div>
                        <div>
                          <button 
                            onClick={onContactClick}
                            className="px-6 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-md text-sm font-medium transition-colors flex items-center gap-2"
                            aria-label={`Contacter ${expert.prenom} ${expert.nom}`}
                          >
                            <span>Contacter l&apos;expert</span>
                          </button>
                        </div>
                      </div>
                    </div>
                    
                    {/* Contenu principal */}
                    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 pb-20 sm:pb-16">
                      {/* Carte profil principal */}
                      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                        {/* Bannière avec image de couverture */}
                        <div className="h-32 bg-gradient-to-r from-amber-500 to-amber-600 dark:from-amber-700 dark:to-amber-800 relative">
                          {/* Photo de profil */}
                          <div className="absolute -bottom-16 left-6 w-32 h-32 rounded-full overflow-hidden border-4 border-white dark:border-gray-800 shadow-md">
                            {expert.image_url ? (
                              <Image
                                src={expert.image_url.replace(/([^:]\/)\/+/g, "$1")}
                                alt={`${expert.prenom} ${expert.nom}`}
                                fill
                                className="object-cover"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.onerror = null;
                                  target.src = '/placeholder-image.jpg';
                                }}
                                unoptimized={true}
                              />
                            ) : (
                              <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
                                <Users className="w-16 h-16 text-gray-400" />
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {/* Infos principales */}
                        <div className="mt-16 px-6 pb-6">
                          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between">
                            <div>
                              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                                {expert.prenom} {expert.nom}
                              </h1>
                              <p className="text-xl font-medium text-gray-600 dark:text-gray-300 mt-1">
                                {activité}
                              </p>
                            </div>
                            {/* Logo de l'entreprise */}
                            <div className="mt-4 sm:mt-0 flex items-center justify-center bg-white dark:bg-white border dark:border-gray-700 rounded-md p-2 h-20 w-20">
                              <div className="relative h-24 w-24 overflow-hidden">
                                <Image 
                                  src={expert.logo || '/placeholder-image.jpg'} 
                                  alt={`Logo de ${expert.prenom} ${expert.nom}`}
                                  fill
                                  style={{ objectFit: 'contain' }}
                                  className=""
                                  unoptimized={true}
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.onerror = null;
                                    target.src = '/placeholder-image.jpg';
                                  }}
                                />
                              </div>
                            </div>
                          </div>
                          
                          {/* Badges */}
                          <div className="flex flex-wrap gap-3 mt-6">
                            {/* Tarif */}
                            <div className="flex items-center gap-2 border rounded-full px-4 py-2 border-gray-200 dark:border-gray-600">
                              <Clock className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                              <span className="text-sm font-medium text-gray-700 dark:text-gray-300"><span className="text-xs font-normal">À partir de </span>{expert.tarif}€ </span>
                            </div>
                            
                            {/* Disponibilité */}
                            <div className="flex items-center gap-2 border rounded-full px-4 py-2 border-gray-200 dark:border-gray-600">
                              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Disponibilité</span>
                            </div>
                            
                            {/* Localisation */}
                            <div className="flex items-center gap-2 border rounded-full px-4 py-2 border-gray-200 dark:border-gray-600">
                              <MapPin className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{expert.ville}, {expert.pays}</span>
                            </div>
                            
                          </div>
                        </div>
                      </div>
                      
                      {/* Carte Expertises */}
                      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Expertises</h3>
                        <div className="flex flex-wrap gap-2">
                          {expert.expertises?.split(',').map((expertise, index) => (
                            <span 
                              key={index}
                              className="inline-flex items-center rounded-md bg-gray-100 dark:bg-gray-700 px-3 py-1 text-sm font-medium text-gray-800 dark:text-gray-200"
                            >
                              {expertise.trim()}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Carte À propos */}
                      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">

                        
                        {/* Introduction / Bio */}
                        <div className="mb-8">
                          <h4 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-3">À propos</h4>
                          {expert.biographie ? (
                            <div className="space-y-4">
                              <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-line">
                                {expert.biographie}
                              </p>
                            </div>
                          ) : (
                            <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                              Aucune biographie disponible
                            </p>
                          )}
                        </div>
                        
                        {/* Liens */}
                        <div>
                          <h4 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-3">Liens</h4>
                          <div className="flex flex-wrap gap-4">
                            {/* LinkedIn */}
                            {expert.reseau && expert.reseau.includes('linkedin') && (
                              <Link 
                                href={expert.reseau} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="inline-flex items-center justify-center bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-md p-3 transition-colors"
                              >
                                <Linkedin className="h-6 w-6" />
                              </Link>
                            )}
                            
                            {/* Site web */}
                            {expert.site_web && (
                              <Link 
                                href={expert.site_web.startsWith('http') ? expert.site_web : `https://${expert.site_web}`} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="inline-flex items-center justify-center bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-md p-3 transition-colors"
                              >
                                <Globe className="h-6 w-6" />
                              </Link>
                            )}
                            
                            {/* Message s'il n'y a aucun lien */}
                            {!expert.reseau && !expert.site_web && (!expert.logo || expert.logo.trim() === '') && (
                              <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                                Aucun lien disponible
                              </p>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Carte Services proposés */}
                      {expert.services && (
                        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Services proposés</h3>
                          <div className="space-y-6">
                            {/* Format 1: Services comme objet complexe directement au niveau racine */}
                            {expert.services.services_proposes && (
                              <div className="pb-4">
                                {/* Services proposés */}
                                <div className="mt-2">
                                  <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Prestations détaillées:</p>
                                  <ul className="list-disc pl-5 mt-2 text-sm text-gray-600 dark:text-gray-400 space-y-1">
                                    {Array.isArray(expert.services.services_proposes) ? (
                                      expert.services.services_proposes.map((service: string, index: number) => (
                                        <li key={index}>{service}</li>
                                      ))
                                    ) : (
                                      <li>{String(expert.services.services_proposes)}</li>
                                    )}
                                  </ul>
                                </div>

                                {/* Valeur ajoutée */}
                                {expert.services.valeur_ajoutee && (
                                  <div className="mt-4">
                                    <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Valeur ajoutée:</p>
                                    {expert.services.valeur_ajoutee.description && (
                                      <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{expert.services.valeur_ajoutee.description}</p>
                                    )}
                                    {expert.services.valeur_ajoutee.points_forts && Array.isArray(expert.services.valeur_ajoutee.points_forts) && (
                                      <ul className="list-disc pl-5 mt-2 text-sm text-gray-600 dark:text-gray-400 space-y-1">
                                        {expert.services.valeur_ajoutee.points_forts.map((point: string, index: number) => (
                                          <li key={index}>{point}</li>
                                        ))}
                                      </ul>
                                    )}
                                  </div>
                                )}
                                
                                {/* Résultats apportés */}
                                {expert.services.resultats_apportes && Array.isArray(expert.services.resultats_apportes) && (
                                  <div className="mt-4">
                                    <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Résultats apportés:</p>
                                    <ul className="list-disc pl-5 mt-2 text-sm text-gray-600 dark:text-gray-400 space-y-1">
                                      {expert.services.resultats_apportes.map((resultat: string, index: number) => (
                                        <li key={index}>{resultat}</li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Format 2: Services comme objet avec clés de service */}
                            {!expert.services.services_proposes && Object.keys(expert.services).length > 0 && 
                             Object.entries(expert.services).map(([serviceName, details]: [string, any]) => (
                              <div key={serviceName} className="pb-4 border-b border-gray-200 dark:border-gray-700">
                                <h4 className="font-medium text-lg text-gray-900 dark:text-white">{serviceName}</h4>
                                
                                {/* Détails basiques */}
                                {details.description && (
                                  <p className="mt-2 text-gray-600 dark:text-gray-300">{details.description}</p>
                                )}
                                
                                {/* Prix et autres infos */}
                                <div className="mt-3 flex flex-wrap gap-3">
                                  {details.price && (
                                    <span className="inline-flex items-center rounded-md bg-red-50 dark:bg-red-900/20 px-2 py-1 text-sm font-medium text-[#f15959] dark:text-[#ff8080]">
                                      À partir de {details.price}€
                                    </span>
                                  )}
                                  {details.duration && (
                                    <span className="inline-flex items-center rounded-md bg-blue-50 dark:bg-blue-900/20 px-2 py-1 text-sm font-medium text-blue-700 dark:text-blue-300">
                                      Durée: {details.duration}
                                    </span>
                                  )}
                                  {details.format && (
                                    <span className="inline-flex items-center rounded-md bg-green-50 dark:bg-green-900/20 px-2 py-1 text-sm font-medium text-green-700 dark:text-green-300">
                                      {details.format}
                                    </span>
                                  )}
                                </div>
                                
                                {/* Services proposés */}
                                {details.services_proposes && (
                                  <div className="mt-4">
                                    <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Prestations détaillées:</p>
                                    <ul className="list-disc pl-5 mt-2 text-sm text-gray-600 dark:text-gray-400 space-y-1">
                                      {Array.isArray(details.services_proposes) ? (
                                        details.services_proposes.map((service: string, index: number) => (
                                          <li key={index}>{service}</li>
                                        ))
                                      ) : (
                                        <li>{String(details.services_proposes)}</li>
                                      )}
                                    </ul>
                                  </div>
                                )}
                                
                                {/* Valeur ajoutée */}
                                {details.valeur_ajoutee && (
                                  <div className="mt-4">
                                    <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Valeur ajoutée:</p>
                                    {details.valeur_ajoutee.description && (
                                      <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{details.valeur_ajoutee.description}</p>
                                    )}
                                    {details.valeur_ajoutee.points_forts && Array.isArray(details.valeur_ajoutee.points_forts) && (
                                      <ul className="list-disc pl-5 mt-2 text-sm text-gray-600 dark:text-gray-400 space-y-1">
                                        {details.valeur_ajoutee.points_forts.map((point: string, index: number) => (
                                          <li key={index}>{point}</li>
                                        ))}
                                      </ul>
                                    )}
                                  </div>
                                )}
                                
                                {/* Résultats apportés */}
                                {details.resultats_apportes && Array.isArray(details.resultats_apportes) && (
                                  <div className="mt-4">
                                    <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Résultats apportés:</p>
                                    <ul className="list-disc pl-5 mt-2 text-sm text-gray-600 dark:text-gray-400 space-y-1">
                                      {details.resultats_apportes.map((resultat: string, index: number) => (
                                        <li key={index}>{resultat}</li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                                
                                {/* Autres avantages ou bénéfices */}
                                {details.benefits && Array.isArray(details.benefits) && (
                                  <div className="mt-4">
                                    <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Autres avantages:</p>
                                    <ul className="list-disc pl-5 mt-2 text-sm text-gray-600 dark:text-gray-400 space-y-1">
                                      {details.benefits.map((benefit: string, index: number) => (
                                        <li key={index}>{benefit}</li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                              </div>
                            ))}
                            
                            {/* Format 3: Services comme tableau */}
                            {!expert.services.services_proposes && Array.isArray(expert.services) && expert.services.length > 0 && (
                              <div className="pb-4">
                                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Prestations détaillées:</p>
                                <div className="mt-3 space-y-2">
                                  {expert.services.map((service: any, index: number) => (
                                    <div key={index} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-md">
                                      <div className="flex justify-between">
                                        <p className="font-medium text-gray-800 dark:text-gray-200">
                                          {service.service} 
                                          {service.domaine && <span className="text-sm text-gray-500 dark:text-gray-400"> ({service.domaine})</span>}
                                        </p>
                                        {service.tarif && (
                                          <span className="text-[#f15959] dark:text-[#ff8080] font-medium">
                                            {service.tarif}€
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
};

export default ExpertDrawer; 