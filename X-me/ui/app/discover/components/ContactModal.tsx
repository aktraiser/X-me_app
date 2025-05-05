'use client';

import { useState, useEffect } from 'react';
import { Dialog, Transition, RadioGroup, Radio } from '@headlessui/react';
import { Fragment } from 'react';
import { X, Check, Info, Phone } from 'lucide-react';
import { Expert } from '@/types/index';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { useUser } from '@clerk/nextjs';
import { useNavVisibility } from '@/hooks/useNavVisibility';

interface CallbackOption {
  id: string;
  title: string;
  description: string;
}

interface RequestTypeOption {
  id: string;
  title: string;
  description: string;
}

interface ContactModalProps {
  expert: Expert | null;
  open: boolean;
  setOpen: (open: boolean) => void;
}

const ContactModal = ({ expert, open, setOpen }: ContactModalProps) => {
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [callbackOption, setCallbackOption] = useState('no');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [userProfile, setUserProfile] = useState<any>(null);
  const { user } = useUser();
  const { setNavVisible } = useNavVisibility();

  const requestTypeOptions: RequestTypeOption[] = [
    { 
      id: 'urgence', 
      title: 'Urgence', 
      description: 'Besoin d\'une réponse dans les 24h' 
    },
    { 
      id: 'conseil', 
      title: 'Demande de conseil', 
      description: 'Consultation pour avis professionnel' 
    },
    { 
      id: 'contact', 
      title: 'Prise de contact', 
      description: 'Simple prise de contact avec l\'expert' 
    },
  ];
  
  const [selectedRequestType, setSelectedRequestType] = useState<RequestTypeOption>(requestTypeOptions[1]);

  const callbackOptions: CallbackOption[] = [
    { 
      id: 'yes', 
      title: 'Oui, je souhaite être rappelé', 
      description: 'Un expert vous contactera par téléphone dans les meilleurs délais' 
    },
    { 
      id: 'no', 
      title: 'Non, pas besoin', 
      description: 'Nous vous répondrons par email' 
    },
  ];

  // Récupérer le numéro de téléphone de l'utilisateur depuis Clerk
  useEffect(() => {
    if (user && open) {
      // Récupérer le numéro de téléphone depuis Clerk
      const primaryPhoneNumber = user.primaryPhoneNumber?.phoneNumber || '';
      if (primaryPhoneNumber) {
        setPhoneNumber(primaryPhoneNumber);
        console.log('Numéro de téléphone récupéré depuis Clerk:', primaryPhoneNumber);
      } else {
        console.log('Aucun numéro de téléphone trouvé dans Clerk');
        // Récupérer le numéro depuis Supabase en fallback
        fetchPhoneNumberFromSupabase();
      }
    }
  }, [user, open]);

  // Récupérer le numéro de téléphone depuis Supabase (fallback)
  const fetchPhoneNumberFromSupabase = async () => {
    try {
      if (!user?.id) return;
      
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('phone')
        .eq('id', user.id)
        .single();
        
      if (profile?.phone) {
        setPhoneNumber(profile.phone);
        console.log('Numéro de téléphone récupéré depuis Supabase:', profile.phone);
      }
    } catch (error) {
      console.error("Erreur lors de la récupération du numéro de téléphone:", error);
    }
  };

  useEffect(() => {
    // Log l'état isSuccess chaque fois qu'il change
    console.log('État isSuccess:', isSuccess);
  }, [isSuccess]);

  // Masquer la navigation mobile lorsque la modale est ouverte
  useEffect(() => {
    if (open) {
      setNavVisible(false);
    } else {
      setNavVisible(true);
    }
  }, [open, setNavVisible]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Formulaire soumis');
    
    if (!reason.trim()) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      console.log('Erreur: champ raison vide');
      return;
    }

    // Vérifier que le numéro de téléphone est fourni si l'option de rappel est activée
    if (callbackOption === 'yes' && !phoneNumber.trim()) {
      toast.error('Veuillez fournir votre numéro de téléphone pour être rappelé');
      console.log('Erreur: numéro de téléphone manquant pour rappel');
      return;
    }

    setIsSubmitting(true);
    console.log('Début de soumission, isSubmitting =', true);

    try {
      // Vérifier que l'utilisateur est connecté avec Clerk
      console.log('Vérification de l\'utilisateur Clerk...');
      if (!user || !user.id) {
        toast.error('Vous devez être connecté pour contacter un expert');
        console.log('Erreur: utilisateur non connecté via Clerk');
        setIsSubmitting(false);
        return;
      }
      
      console.log('Utilisateur Clerk connecté:', user.id);
      
      // Mettre à jour le profil utilisateur avec le numéro de téléphone s'il a été fourni
      if (callbackOption === 'yes' && phoneNumber) {
        console.log('Mise à jour du numéro de téléphone dans le profil');
        try {
          const { error: profileError } = await supabase
            .from('profiles')
            .upsert({ 
              id: user.id,
              phone: phoneNumber,
              // S'assurer que ces champs requis sont présents lors de l'insertion
              email: user.primaryEmailAddress?.emailAddress || '',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }, { 
              onConflict: 'id', 
              ignoreDuplicates: false 
            });
            
          if (profileError) {
            console.warn(`Erreur lors de la mise à jour du profil: ${profileError.message}`);
          }
        } catch (error) {
          console.error("Erreur lors de la mise à jour du profil:", error);
        }
      }

      // S'assurer que expert.id est bien un nombre
      console.log('Expert ID avant conversion:', expert?.id, typeof expert?.id);
      const expertId = typeof expert?.id === 'number' 
        ? expert.id 
        : expert?.id 
          ? parseInt(String(expert.id), 10) 
          : null;
          
      console.log('Expert ID après conversion:', expertId);
      
      if (!expertId) {
        throw new Error("ID d'expert invalide");
      }

      // Préparer les données à insérer
      const requestData = {
        expert_id: expertId,
        user_id: user.id,
        reason: reason,
        request_type: selectedRequestType.id,
        want_callback: callbackOption === 'yes',
        phone_number: callbackOption === 'yes' ? phoneNumber : null,
        status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      console.log('Données à insérer:', requestData);

      // Enregistrer la demande dans Supabase
      const { error } = await supabase
        .from('contact_requests_new')
        .insert(requestData);

      if (error) {
        console.error('Erreur Supabase lors de l\'insertion:', error);
        throw error;
      }

      console.log('Demande envoyée avec succès');
      setIsSuccess(true);
      toast.success('Votre demande a été envoyée avec succès');
    } catch (err: any) {
      console.error('Erreur lors de l\'envoi de la demande:', err);
      toast.error(`Une erreur est survenue: ${err.message || 'Erreur inconnue'}`);
    } finally {
      setIsSubmitting(false);
      console.log('Fin de soumission, isSubmitting =', false);
    }
  };

  const handleClose = () => {
    setOpen(false);
    // Reset state after modal is closed
    setTimeout(() => {
      setIsSuccess(false);
      setReason('');
      setCallbackOption('no');
      setSelectedRequestType(requestTypeOptions[1]); // Réinitialiser à "Demande de conseil"
      // Ne pas réinitialiser le numéro de téléphone car il vient du profil utilisateur
    }, 300);
  };

  // Render null early if expert is null (outside of useEffect)
  if (!expert) return null;

  return (
    <Transition.Root show={open} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={handleClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-500 dark:bg-gray-900 bg-opacity-75 dark:bg-opacity-80 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-0 text-center sm:items-center sm:p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative transform overflow-x-hidden rounded-none md:rounded-lg bg-white dark:bg-gray-800 px-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:p-6 
                pb-6 flex flex-col w-full sm:max-w-2xl">
                <div className="absolute right-0 top-0 pr-4 pt-4">
                  <button
                    type="button"
                    className="rounded-md bg-white dark:bg-transparent text-gray-400 hover:text-gray-500 dark:text-gray-400 dark:hover:text-gray-300 focus:outline-none"
                    onClick={handleClose}
                  >
                    <span className="sr-only">Fermer</span>
                    <X className="h-6 w-6" aria-hidden="true" />
                  </button>
                </div>
                
                {!isSuccess ? (
                  <div className="sm:flex sm:items-start">
                    <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                      <Dialog.Title as="h3" className="text-lg font-semibold leading-6 text-gray-900 dark:text-white">
                        Contacter {expert.prenom} {expert.nom}
                      </Dialog.Title>
                      <div className="mt-4">
                        <div className="flex items-start mb-4">
                          <Info className="h-5 w-5 text-blue-500 mr-2 flex-shrink-0 mt-0.5" />
                          <p className="text-sm text-gray-600 dark:text-gray-300">
                            Avant de vous donner les coordonnées de notre expert, nous avons besoin de comprendre votre demande. 
                            Ces informations seront transmise à notre expert.
                          </p>
                          <div className="my-4 border-t border-gray-200 dark:border-gray-700"></div>
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 italic mb-4">Tous les champs sont obligatoires</p>
                        <form onSubmit={handleSubmit} className="mt-4">
                          <div className="mb-6">
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                              Type de demande
                            </label>
                            <RadioGroup value={selectedRequestType} onChange={setSelectedRequestType} className="space-y-3">
                              {requestTypeOptions.map((option) => (
                                <Radio
                                  key={option.id}
                                  value={option}
                                  aria-label={option.title}
                                  aria-description={option.description}
                                  className="group relative block cursor-pointer rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-5 py-3 shadow-sm focus:outline-none data-[focus]:border-blue-600 dark:data-[focus]:border-blue-500 data-[focus]:ring-2 data-[focus]:ring-blue-600 dark:data-[focus]:ring-blue-500"
                                >
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center">
                                      <div className="flex flex-col text-sm">
                                        <span className="font-medium text-gray-900 dark:text-white">{option.title}</span>
                                        <span className="text-gray-500 dark:text-gray-400">
                                          {option.description}
                                        </span>
                                      </div>
                                    </div>
                                    {option.id === selectedRequestType.id && (
                                      <div className="text-blue-600 dark:text-blue-500">
                                        <Check className="h-5 w-5" />
                                      </div>
                                    )}
                                  </div>
                                  <span
                                    aria-hidden="true"
                                    className="pointer-events-none absolute -inset-px rounded-lg border-2 border-transparent group-data-[focus]:border group-data-[checked]:border-blue-600 dark:group-data-[checked]:border-blue-500"
                                  />
                                </Radio>
                              ))}
                            </RadioGroup>
                          </div>
                          
                          <div className="my-6 border-t border-gray-200 dark:border-gray-700"></div>
                          
                          <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                              Souhaitez-vous être rappelé?
                            </label>
                            <RadioGroup value={callbackOption} onChange={setCallbackOption} className="space-y-3">
                              {callbackOptions.map((option) => (
                                <RadioGroup.Option
                                  key={option.id}
                                  value={option.id}
                                  className={({ active, checked }) =>
                                    `${active ? 'ring-2 ring-blue-600 ring-offset-2' : ''}
                                    ${checked ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-600 dark:border-blue-500' : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600'}
                                    relative block cursor-pointer rounded-lg border px-5 py-3 shadow-sm focus:outline-none`
                                  }
                                >
                                  {({ checked }) => (
                                    <>
                                      <div className="flex items-center justify-between">
                                        <div className="flex items-center">
                                          <div className="text-sm">
                                            <RadioGroup.Label
                                              as="p"
                                              className={`font-medium ${checked ? 'text-blue-900 dark:text-blue-200' : 'text-gray-900 dark:text-white'}`}
                                            >
                                              {option.title}
                                            </RadioGroup.Label>
                                            <RadioGroup.Description
                                              as="span"
                                              className={`inline ${checked ? 'text-blue-700 dark:text-blue-300' : 'text-gray-500 dark:text-gray-400'}`}
                                            >
                                              {option.description}
                                            </RadioGroup.Description>
                                          </div>
                                        </div>
                                        {checked && (
                                          <div className="shrink-0 text-blue-600 dark:text-blue-500">
                                            <Check className="h-5 w-5" />
                                          </div>
                                        )}
                                      </div>
                                    </>
                                  )}
                                </RadioGroup.Option>
                              ))}
                            </RadioGroup>
                          </div>
                          
                          {callbackOption === 'yes' && (
                            <div className="mb-6 mt-4">
                              <div className="flex items-start mb-3">
                                <Phone className="h-5 w-5 text-amber-600 dark:text-amber-500 mr-2 flex-shrink-0 mt-0.5" />
                                <div>
                                  <p className="text-sm text-gray-700 dark:text-gray-300 mb-1 font-medium">
                                    Votre numéro de téléphone <span className="text-red-500">*</span>
                                  </p>
                                  <p className="text-sm text-gray-500 dark:text-gray-400">
                                    Notre expert vous rappellera sur ce numéro
                                  </p>
                                </div>
                              </div>
                              <input
                                type="tel"
                                id="phone-number"
                                name="phone-number"
                                className="block w-full rounded-md border border-gray-300 dark:border-gray-600 shadow-sm focus:border-amber-500 dark:focus:border-amber-500 focus:ring-amber-500 dark:focus:ring-amber-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                placeholder="Ex: +33 6 12 34 56 78"
                                value={phoneNumber}
                                onChange={(e) => setPhoneNumber(e.target.value)}
                                required
                              />
                            </div>
                          )}
                          
                          <div className="my-6 border-t border-gray-200 dark:border-gray-700"></div>
                          
                          <div className="mb-6">
                            <label htmlFor="reason" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                              Détail de ma demande <span className="text-red-500">*</span>
                            </label>
                            <textarea
                              id="reason"
                              name="reason"
                              rows={4}
                              className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 dark:focus:border-blue-500 focus:ring-blue-500 dark:focus:ring-blue-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                              placeholder="Décrivez le contexte de votre demande en détail..."
                              value={reason}
                              onChange={(e) => setReason(e.target.value)}
                              required
                            />
                            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                              Plus votre demande sera détaillée, mieux nous pourrons vous aider.
                            </p>
                          </div>
                          
                          <div className="mt-6 border-t border-gray-200 dark:border-gray-700 pt-6">
                            <div className="sm:flex sm:flex-row-reverse">
                              <button
                                type="submit"
                                className="inline-flex w-full justify-center rounded-md bg-amber-600 hover:bg-amber-700 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors sm:ml-3 sm:w-auto"
                                disabled={isSubmitting}
                              >
                                {isSubmitting ? (
                                  <span className="flex items-center">
                                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Envoi en cours...
                                  </span>
                                ) : 'Envoyer la demande'}
                              </button>
                              <button
                                type="button"
                                className="mt-3 inline-flex w-full justify-center rounded-md bg-white dark:bg-gray-700 px-3 py-2 text-sm font-semibold text-gray-900 dark:text-gray-200 shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 sm:mt-0 sm:w-auto"
                                onClick={handleClose}
                                disabled={isSubmitting}
                              >
                                Annuler
                              </button>
                            </div>
                          </div>
                        </form>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="sm:flex sm:items-start">
                    <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
                        <Check className="h-6 w-6 text-green-600 dark:text-green-200" aria-hidden="true" />
                      </div>
                      <div className="mt-3 text-center">
                        <Dialog.Title as="h3" className="text-lg font-semibold leading-6 text-gray-900 dark:text-white">
                          Demande envoyée avec succès
                        </Dialog.Title>
                        <div className="mt-4">
                          <p className="text-sm text-gray-600 dark:text-gray-300">
                            Votre demande a été transmise à {expert.prenom} {expert.nom}.
                          </p>
                          <div className="mt-6 bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                            <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Coordonnées de l&apos;expert :</h4>
                            {expert.email && (
                              <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">
                                <strong>Email :</strong> {expert.email}
                              </p>
                            )}
                            {expert.telephone && (
                              <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">
                                <strong>Téléphone :</strong> {typeof expert.telephone === 'number' ? expert.telephone.toString() : expert.telephone}
                              </p>
                            )}
                            {expert.site_web && (
                              <p className="text-sm text-gray-600 dark:text-gray-300">
                                <strong>Site web :</strong>{' '}
                                <a 
                                  href={expert.site_web.startsWith('http') ? expert.site_web : `https://${expert.site_web}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 dark:text-blue-400 hover:underline"
                                >
                                  {expert.site_web}
                                </a>
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="mt-5 sm:mt-6">
                        <button
                          type="button"
                          className="inline-flex w-full justify-center rounded-md bg-amber-600 hover:bg-amber-700 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors"
                          onClick={handleClose}
                        >
                          Fermer
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
};

export default ContactModal; 