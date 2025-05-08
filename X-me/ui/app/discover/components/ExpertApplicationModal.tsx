import { Fragment, useEffect, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { X, Briefcase, Info } from 'lucide-react';
import { useNavVisibility } from '@/hooks/useNavVisibility';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

interface ExpertApplicationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ExpertApplicationModal({ isOpen, onClose }: ExpertApplicationModalProps) {
  const { setNavVisible } = useNavVisibility();
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState({
    nom: '',
    prenom: '',
    email: '',
    telephone: '',
    expertises: '',
    message: '',
    ville: ''
  });
  
  // Masquer la navigation mobile lorsque la modale est ouverte
  useEffect(() => {
    if (isOpen) {
      setNavVisible(false);
    } else {
      setNavVisible(true);
    }
    
    // Nettoyer en restaurant la navigation lorsque le composant est démonté
    return () => {
      setNavVisible(true);
    };
  }, [isOpen, setNavVisible]);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Effacer l'erreur lorsque l'utilisateur modifie le champ
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.prenom.trim()) {
      newErrors.prenom = 'Le prénom est requis';
    }
    
    if (!formData.nom.trim()) {
      newErrors.nom = 'Le nom est requis';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'L\'email est requis';
    } else if (!/^\S+@\S+\.\S+$/.test(formData.email)) {
      newErrors.email = 'Format d\'email invalide';
    }
    
    if (!formData.expertises.trim()) {
      newErrors.expertises = 'Veuillez indiquer au moins une expertise';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Veuillez corriger les erreurs dans le formulaire');
      return;
    }
    
    setLoading(true);

    try {
      // Préparer les données à envoyer
      const donneesPourEnvoi = {
        nom: formData.nom,
        prenom: formData.prenom,
        email: formData.email,
        telephone: formData.telephone ? `+33 ${formData.telephone}` : '',
        expertises: formData.expertises,
        message: formData.message,
        ville: formData.ville,
        pays: 'France' // Définir France par défaut
      };

      // Envoi des données à Supabase
      const { error } = await supabase
        .from('expert_applications')
        .insert([donneesPourEnvoi]);

      if (error) throw error;

      setSubmitted(true);
      toast.success('Votre demande a été envoyée avec succès!');
    } catch (error: any) {
      console.error('Erreur lors de l\'envoi de la demande:', error.message);
      toast.error('Une erreur est survenue. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    onClose();
    // Reset form state after modal is closed
    setTimeout(() => {
      setSubmitted(false);
      setFormData({
        nom: '',
        prenom: '',
        email: '',
        telephone: '',
        expertises: '',
        message: '',
        ville: ''
      });
      setErrors({});
    }, 300);
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
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

        <div className="fixed inset-0 overflow-y-auto">
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
              <Dialog.Panel className="relative transform overflow-x-hidden rounded-none md:rounded-lg bg-white dark:bg-gray-800 px-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:p-6 pb-6 flex flex-col w-full sm:max-w-2xl">
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
                
                {!submitted ? (
                  <div className="sm:flex sm:items-start">
                    <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                      <form onSubmit={handleSubmit} className="w-full">
                        <div className="flex items-center gap-x-5">
                          <div className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-white dark:border-gray-800 shadow-sm flex-shrink-0">
                            <div className="w-full h-full bg-gradient-to-br from-indigo-400 to-indigo-600 flex items-center justify-center">
                              <Briefcase className="w-8 h-8 text-white" />
                            </div>
                          </div>
                          <div>
                            <Dialog.Title as="h3" className="text-lg font-semibold leading-6 text-gray-900 dark:text-white">
                              Devenez Expert Xandme
                            </Dialog.Title>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              Rejoignez notre réseau d&apos;experts et partagez votre expertise avec notre communauté.
                            </p>
                          </div>
                        </div>

                        <div className="mt-8">
                          <div className="flex items-start mb-4">
                            <Info className="h-5 w-5 text-blue-500 mr-2 flex-shrink-0 mt-0.5" />
                            <p className="text-sm text-gray-600 dark:text-gray-300">
                              Ces informations nous permettront d'évaluer votre candidature et de vous contacter.
                            </p>
                          </div>
                          <p className="text-sm text-gray-500 dark:text-gray-400 italic mb-4">Les champs marqués d'un <span className="text-red-500">*</span> sont obligatoires</p>
                        </div>

                        <div className="my-6 border-t border-gray-200 dark:border-gray-700"></div>

                        <div className="mb-6">
                          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                            Informations personnelles
                          </h4>
                          
                          <div className="space-y-6">
                            <div className="sm:grid sm:grid-cols-2 sm:gap-4">
                              <div className="relative">
                                <label
                                  htmlFor="prenom"
                                  className="absolute -top-2 left-2 inline-block rounded-lg bg-white dark:bg-gray-800 px-1 text-xs font-medium text-gray-900 dark:text-white"
                                >
                                  Prénom <span className="text-red-500">*</span>
                                </label>
                                <input
                                  id="prenom"
                                  name="prenom"
                                  type="text"
                                  value={formData.prenom}
                                  onChange={handleChange}
                                  required
                                  autoComplete="given-name"
                                  placeholder="Votre prénom"
                                  className="block w-full rounded-md bg-white dark:bg-white/5 px-3 py-1.5 text-gray-900 dark:text-white outline outline-1 -outline-offset-1 outline-gray-300 dark:outline-white/10 placeholder:text-gray-400 focus:outline focus:outline-2 focus:-outline-offset-2 focus:outline-amber-600 sm:text-sm/6"
                                />
                                {errors.prenom && (
                                  <p className="mt-2 text-sm text-red-600 dark:text-red-400">
                                    {errors.prenom}
                                  </p>
                                )}
                              </div>

                              <div className="relative">
                                <label
                                  htmlFor="nom"
                                  className="absolute -top-2 left-2 inline-block rounded-lg bg-white dark:bg-gray-800 px-1 text-xs font-medium text-gray-900 dark:text-white"
                                >
                                  Nom <span className="text-red-500">*</span>
                                </label>
                                <input
                                  id="nom"
                                  name="nom"
                                  type="text"
                                  value={formData.nom}
                                  onChange={handleChange}
                                  required
                                  autoComplete="family-name"
                                  placeholder="Votre nom"
                                  className="block w-full rounded-md bg-white dark:bg-white/5 px-3 py-1.5 text-gray-900 dark:text-white outline outline-1 -outline-offset-1 outline-gray-300 dark:outline-white/10 placeholder:text-gray-400 focus:outline focus:outline-2 focus:-outline-offset-2 focus:outline-amber-600 sm:text-sm/6"
                                />
                                {errors.nom && (
                                  <p className="mt-2 text-sm text-red-600 dark:text-red-400">
                                    {errors.nom}
                                  </p>
                                )}
                              </div>
                            </div>

                            <div className="relative">
                              <label
                                htmlFor="email"
                                className="absolute -top-2 left-2 inline-block rounded-lg bg-white dark:bg-gray-800 px-1 text-xs font-medium text-gray-900 dark:text-white"
                              >
                                Email <span className="text-red-500">*</span>
                              </label>
                              <input
                                id="email"
                                name="email"
                                type="email"
                                value={formData.email}
                                onChange={handleChange}
                                required
                                autoComplete="email"
                                placeholder="votre.email@exemple.com"
                                className="block w-full rounded-md bg-white dark:bg-white/5 px-3 py-1.5 text-gray-900 dark:text-white outline outline-1 -outline-offset-1 outline-gray-300 dark:outline-white/10 placeholder:text-gray-400 focus:outline focus:outline-2 focus:-outline-offset-2 focus:outline-amber-600 sm:text-sm/6"
                              />
                              {errors.email && (
                                <p className="mt-2 text-sm text-red-600 dark:text-red-400">
                                  {errors.email}
                                </p>
                              )}
                            </div>

                            <div className="relative">
                              <label
                                htmlFor="telephone"
                                className="absolute -top-2 left-2 inline-block rounded-lg bg-white dark:bg-gray-800 px-1 text-xs font-medium text-gray-900 dark:text-white"
                              >
                                Téléphone
                              </label>
                              <input
                                id="telephone"
                                name="telephone"
                                type="tel"
                                value={formData.telephone}
                                onChange={handleChange}
                                placeholder="06 12 34 56 78"
                                className="block w-full rounded-md bg-white dark:bg-white/5 px-3 py-1.5 text-gray-900 dark:text-white outline outline-1 -outline-offset-1 outline-gray-300 dark:outline-white/10 placeholder:text-gray-400 focus:outline focus:outline-2 focus:-outline-offset-2 focus:outline-amber-600 sm:text-sm/6"
                              />
                            </div>

                            <div className="relative">
                              <label
                                htmlFor="ville"
                                className="absolute -top-2 left-2 inline-block rounded-lg bg-white dark:bg-gray-800 px-1 text-xs font-medium text-gray-900 dark:text-white"
                              >
                                Ville
                              </label>
                              <input
                                id="ville"
                                name="ville"
                                type="text"
                                value={formData.ville}
                                onChange={handleChange}
                                placeholder="Votre ville"
                                className="block w-full rounded-md bg-white dark:bg-white/5 px-3 py-1.5 text-gray-900 dark:text-white outline outline-1 -outline-offset-1 outline-gray-300 dark:outline-white/10 placeholder:text-gray-400 focus:outline focus:outline-2 focus:-outline-offset-2 focus:outline-amber-600 sm:text-sm/6"
                              />
                            </div>
                          </div>
                        </div>

                        <div className="my-6 border-t border-gray-200 dark:border-gray-700"></div>

                        <div className="mb-6">
                          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                            Expertise professionnelle
                          </h4>

                          <div className="space-y-6">
                            <div className="relative">
                              <label
                                htmlFor="expertises"
                                className="absolute -top-2 left-2 inline-block rounded-lg bg-white dark:bg-gray-800 px-1 text-xs font-medium text-gray-900 dark:text-white"
                              >
                                Domaines d&apos;expertise <span className="text-red-500">*</span>
                              </label>
                              <input
                                id="expertises"
                                name="expertises"
                                value={formData.expertises}
                                onChange={handleChange}
                                required
                                placeholder="Ex: Comptable, Avocat, Juriste..."
                                className="block w-full rounded-md bg-white dark:bg-white/5 px-3 py-1.5 text-gray-900 dark:text-white outline outline-1 -outline-offset-1 outline-gray-300 dark:outline-white/10 placeholder:text-gray-400 focus:outline focus:outline-2 focus:-outline-offset-2 focus:outline-amber-600 sm:text-sm/6"
                              />
                              {errors.expertises ? (
                                <p className="mt-2 text-sm text-red-600 dark:text-red-400">
                                  {errors.expertises}
                                </p>
                              ) : (
                                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                                  Séparez vos différentes expertises par des virgules
                                </p>
                              )}
                            </div>

                            <div className="relative">
                              <label
                                htmlFor="message"
                                className="absolute -top-2 left-2 inline-block rounded-lg bg-white dark:bg-gray-800 px-1 text-xs font-medium text-gray-900 dark:text-white"
                              >
                                Message ou informations complémentaires
                              </label>
                              <textarea
                                id="message"
                                name="message"
                                rows={4}
                                value={formData.message}
                                onChange={handleChange}
                                placeholder="Partagez-nous votre parcours, vos qualifications ou toute autre information pertinente..."
                                className="block w-full rounded-md bg-white dark:bg-white/5 px-3 py-1.5 text-gray-900 dark:text-white outline outline-1 -outline-offset-1 outline-gray-300 dark:outline-white/10 placeholder:text-gray-400 focus:outline focus:outline-2 focus:-outline-offset-2 focus:outline-amber-600 sm:text-sm/6"
                              />
                              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                Plus votre demande sera détaillée, mieux nous pourrons évaluer votre candidature.
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="mt-6 border-t border-gray-200 dark:border-gray-700 pt-6">
                          <div className="sm:flex sm:flex-row-reverse">
                            <button
                              type="submit"
                              disabled={loading}
                              className="inline-flex w-full justify-center rounded-md bg-amber-600 hover:bg-amber-700 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors sm:ml-3 sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {loading ? (
                                <span className="flex items-center">
                                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                  </svg>
                                  Envoi en cours...
                                </span>
                              ) : 'Envoyer ma demande'}
                            </button>
                            <button
                              type="button"
                              onClick={handleClose}
                              disabled={loading}
                              className="mt-3 inline-flex w-full justify-center rounded-md bg-white dark:bg-gray-700 px-3 py-2 text-sm font-semibold text-gray-900 dark:text-gray-200 shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 sm:mt-0 sm:w-auto"
                            >
                              Annuler
                            </button>
                          </div>
                        </div>
                      </form>
                    </div>
                  </div>
                ) : (
                  <div className="sm:flex sm:items-start">
                    <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
                        <svg className="h-6 w-6 text-green-600 dark:text-green-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <div className="mt-3 text-center">
                        <Dialog.Title as="h3" className="text-lg font-semibold leading-6 text-gray-900 dark:text-white">
                          Demande envoyée avec succès
                        </Dialog.Title>
                        <div className="mt-4">
                          <p className="text-sm text-gray-600 dark:text-gray-300">
                            Merci pour votre intérêt ! Nous étudierons votre candidature et reviendrons vers vous très prochainement.
                          </p>
                        </div>
                      </div>
                      <div className="mt-6 flex justify-center">
                        <button
                          type="button"
                          onClick={handleClose}
                          className="inline-flex justify-center rounded-md bg-amber-600 hover:bg-amber-700 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors"
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
    </Transition>
  );
} 