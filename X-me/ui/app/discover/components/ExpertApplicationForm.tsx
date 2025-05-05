import { useState } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { ChevronDown, Briefcase } from 'lucide-react';
import { ExclamationCircleIcon } from '@heroicons/react/16/solid';

interface ExpertApplicationFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export default function ExpertApplicationForm({ onSuccess, onCancel }: ExpertApplicationFormProps) {
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState({
    nom: '',
    prenom: '',
    email: '',
    telephone: '',
    indicatif: 'FR',
    expertises: '',
    message: '',
    ville: '',
    pays: ''
  });

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
      // Formater le téléphone avec l'indicatif
      const telephoneComplet = formData.telephone ? 
        `${formData.indicatif} ${formData.telephone}` : '';

      // Préparer les données à envoyer
      const donneesPourEnvoi = {
        nom: formData.nom,
        prenom: formData.prenom,
        email: formData.email,
        telephone: telephoneComplet,
        expertises: formData.expertises,
        message: formData.message,
        ville: formData.ville,
        pays: formData.pays
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

  if (submitted) {
    return (
      <div className="text-center py-10 pb-16 md:pb-10">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
          <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="mt-3 text-base font-semibold text-gray-900 dark:text-white">Demande envoyée avec succès</h3>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          Merci pour votre intérêt ! Nous étudierons votre candidature et reviendrons vers vous très prochainement.
        </p>
        <div className="mt-6">
          <button
            type="button"
            onClick={onSuccess}
            className="rounded-md bg-amber-600 hover:bg-amber-700 px-4 py-2 text-sm font-semibold text-white shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-600"
          >
            Fermer
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-10 pb-16 md:pb-0">
      <div className="border-b border-gray-200 dark:border-gray-700/30 pb-8">
        <div className="mt-8 flex items-center gap-x-5">
          <div className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-white dark:border-gray-800 shadow-sm flex-shrink-0">
            <div className="w-full h-full bg-gradient-to-br from-indigo-400 to-indigo-600 flex items-center justify-center">
              <Briefcase className="w-8 h-8 text-white" />
            </div>
          </div>
          <div>
            <h3 className="text-base font-medium text-gray-900 dark:text-white">Devenez Expert Xandme</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Rejoignez notre réseau d&apos;experts et partagez votre expertise avec notre communauté.
            </p>
          </div>
        </div>
      </div>
      <div className="border-b border-gray-200 dark:border-gray-700/30 pb-10">
        <h2 className="text-base font-semibold text-gray-900 dark:text-white">Informations personnelles</h2>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Ces informations nous permettront de vous contacter au sujet de votre demande.
        </p>

        <div className="mt-8 grid grid-cols-1 gap-x-6 gap-y-6 sm:grid-cols-6">
          <div className="sm:col-span-3">
            <label htmlFor="prenom" className="block text-sm font-medium text-gray-900 dark:text-white">
              Prénom <span className="text-red-500">*</span>
            </label>
            <div className="mt-2 grid grid-cols-1">
              <input
                id="prenom"
                name="prenom"
                type="text"
                value={formData.prenom}
                onChange={handleChange}
                required
                autoComplete="given-name"
                placeholder="Votre prénom"
                aria-invalid={!!errors.prenom}
                aria-describedby={errors.prenom ? "prenom-error" : undefined}
                className={`col-start-1 row-start-1 block w-full rounded-md bg-white dark:bg-white/5 px-3 py-1.5 ${errors.prenom ? 'text-red-900 dark:text-red-300 outline-red-300 dark:outline-red-500 placeholder:text-red-300 dark:placeholder:text-red-400' : 'text-gray-900 dark:text-white outline-gray-300 dark:outline-white/10 placeholder:text-gray-400'} outline outline-1 -outline-offset-1 focus:outline focus:outline-2 focus:-outline-offset-2 ${errors.prenom ? 'focus:outline-red-600' : 'focus:outline-blue-600'} sm:text-sm`}
              />
              {errors.prenom && (
                <ExclamationCircleIcon
                  aria-hidden="true"
                  className="pointer-events-none col-start-1 row-start-1 mr-3 size-5 self-center justify-self-end text-red-500 sm:size-4"
                />
              )}
            </div>
            {errors.prenom && (
              <p id="prenom-error" className="mt-2 text-sm text-red-600 dark:text-red-400">
                {errors.prenom}
              </p>
            )}
          </div>

          <div className="sm:col-span-3">
            <label htmlFor="nom" className="block text-sm font-medium text-gray-900 dark:text-white">
              Nom <span className="text-red-500">*</span>
            </label>
            <div className="mt-2 grid grid-cols-1">
              <input
                id="nom"
                name="nom"
                type="text"
                value={formData.nom}
                onChange={handleChange}
                required
                autoComplete="family-name"
                placeholder="Votre nom"
                aria-invalid={!!errors.nom}
                aria-describedby={errors.nom ? "nom-error" : undefined}
                className={`col-start-1 row-start-1 block w-full rounded-md bg-white dark:bg-white/5 px-3 py-1.5 ${errors.nom ? 'text-red-900 dark:text-red-300 outline-red-300 dark:outline-red-500 placeholder:text-red-300 dark:placeholder:text-red-400' : 'text-gray-900 dark:text-white outline-gray-300 dark:outline-white/10 placeholder:text-gray-400'} outline outline-1 -outline-offset-1 focus:outline focus:outline-2 focus:-outline-offset-2 ${errors.nom ? 'focus:outline-red-600' : 'focus:outline-blue-600'} sm:text-sm`}
              />
              {errors.nom && (
                <ExclamationCircleIcon
                  aria-hidden="true"
                  className="pointer-events-none col-start-1 row-start-1 mr-3 size-5 self-center justify-self-end text-red-500 sm:size-4"
                />
              )}
            </div>
            {errors.nom && (
              <p id="nom-error" className="mt-2 text-sm text-red-600 dark:text-red-400">
                {errors.nom}
              </p>
            )}
          </div>

          <div className="sm:col-span-4">
            <label htmlFor="email" className="block text-sm font-medium text-gray-900 dark:text-white">
              Email <span className="text-red-500">*</span>
            </label>
            <div className="mt-2 grid grid-cols-1">
              <input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                required
                autoComplete="email"
                placeholder="votre.email@exemple.com"
                aria-invalid={!!errors.email}
                aria-describedby={errors.email ? "email-error" : undefined}
                className={`col-start-1 row-start-1 block w-full rounded-md bg-white dark:bg-white/5 px-3 py-1.5 ${errors.email ? 'text-red-900 dark:text-red-300 outline-red-300 dark:outline-red-500 placeholder:text-red-300 dark:placeholder:text-red-400' : 'text-gray-900 dark:text-white outline-gray-300 dark:outline-white/10 placeholder:text-gray-400'} outline outline-1 -outline-offset-1 focus:outline focus:outline-2 focus:-outline-offset-2 ${errors.email ? 'focus:outline-red-600' : 'focus:outline-blue-600'} sm:text-sm`}
              />
              {errors.email && (
                <ExclamationCircleIcon
                  aria-hidden="true"
                  className="pointer-events-none col-start-1 row-start-1 mr-3 size-5 self-center justify-self-end text-red-500 sm:size-4"
                />
              )}
            </div>
            {errors.email && (
              <p id="email-error" className="mt-2 text-sm text-red-600 dark:text-red-400">
                {errors.email}
              </p>
            )}
          </div>

          <div className="sm:col-span-4">
            <label htmlFor="telephone" className="block text-sm font-medium text-gray-900 dark:text-white">
              Téléphone
            </label>
            <div className="mt-2 flex rounded-md bg-white dark:bg-white/5 outline outline-1 -outline-offset-1 outline-gray-300 dark:outline-white/10 focus-within:outline focus-within:outline-2 focus-within:-outline-offset-2 focus-within:outline-blue-600">
              <div className="grid shrink-0 grid-cols-1 focus-within:relative">
                <select
                  id="indicatif"
                  name="indicatif"
                  value={formData.indicatif}
                  onChange={handleChange}
                  aria-label="Indicatif"
                  className="col-start-1 row-start-1 w-full appearance-none rounded-l-md py-1.5 pl-3 pr-7 text-gray-500 dark:text-gray-300 bg-white dark:bg-transparent placeholder:text-gray-400 focus:outline focus:outline-0 sm:text-sm"
                >
                  <option value="FR">FR</option>
                  <option value="BE">BE</option>
                  <option value="CH">CH</option>
                  <option value="CA">CA</option>
                  <option value="US">US</option>
                  <option value="UK">UK</option>
                </select>
                <ChevronDown
                  aria-hidden="true"
                  className="pointer-events-none col-start-1 row-start-1 mr-2 size-4 self-center justify-self-end text-gray-500 dark:text-gray-400"
                />
              </div>
              <input
                id="telephone"
                name="telephone"
                type="tel"
                value={formData.telephone}
                onChange={handleChange}
                placeholder="06 12 34 56 78"
                className="block min-w-0 grow rounded-r-md py-1.5 pl-1 pr-3 text-gray-900 dark:text-white bg-white dark:bg-transparent placeholder:text-gray-400 focus:outline focus:outline-0 sm:text-sm"
              />
            </div>
          </div>

          <div className="sm:col-span-3">
            <label htmlFor="ville" className="block text-sm font-medium text-gray-900 dark:text-white">
              Ville
            </label>
            <div className="mt-2">
              <input
                id="ville"
                name="ville"
                type="text"
                value={formData.ville}
                onChange={handleChange}
                placeholder="Votre ville"
                className="block w-full rounded-md bg-white dark:bg-white/5 px-3 py-1.5 text-gray-900 dark:text-white outline outline-1 -outline-offset-1 outline-gray-300 dark:outline-white/10 placeholder:text-gray-400 focus:outline focus:outline-2 focus:-outline-offset-2 focus:outline-blue-600 sm:text-sm"
              />
            </div>
          </div>

          <div className="sm:col-span-3">
            <label htmlFor="pays" className="block text-sm font-medium text-gray-900 dark:text-white">
              Pays
            </label>
            <div className="mt-2 grid grid-cols-1">
              <select
                id="pays"
                name="pays"
                value={formData.pays}
                onChange={handleChange}
                className="col-start-1 row-start-1 w-full appearance-none rounded-md bg-white dark:bg-white/5 py-1.5 pl-3 pr-8 text-gray-900 dark:text-white outline outline-1 -outline-offset-1 outline-gray-300 dark:outline-white/10 focus:outline focus:outline-2 focus:-outline-offset-2 focus:outline-blue-600 sm:text-sm"
              >
                <option value="">Sélectionnez un pays</option>
                <option value="France">France</option>
                <option value="Belgique">Belgique</option>
                <option value="Suisse">Suisse</option>
                <option value="Canada">Canada</option>
                <option value="États-Unis">États-Unis</option>
                <option value="Royaume-Uni">Royaume-Uni</option>
              </select>
              <ChevronDown
                aria-hidden="true"
                className="pointer-events-none col-start-1 row-start-1 mr-2 size-4 self-center justify-self-end text-gray-500 dark:text-gray-400"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="border-b border-gray-200 dark:border-gray-700/30 pb-10">
        <h2 className="text-base font-semibold text-gray-900 dark:text-white">Expertise professionnelle</h2>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Partagez votre domaine d&apos;expertise et ce que vous pouvez offrir à notre communauté.
        </p>

        <div className="mt-8 grid grid-cols-1 gap-x-6 gap-y-6 sm:grid-cols-6">
          <div className="sm:col-span-full">
            <label htmlFor="expertises" className="block text-sm font-medium text-gray-900 dark:text-white">
              Domaines d&apos;expertise <span className="text-red-500">*</span>
            </label>
            <div className="mt-2 grid grid-cols-1">
              <input
                id="expertises"
                name="expertises"
                value={formData.expertises}
                onChange={handleChange}
                required
                placeholder="Ex: Comptable, Avocat, Juriste..."
                aria-invalid={!!errors.expertises}
                aria-describedby={errors.expertises ? "expertises-error" : undefined}
                className={`col-start-1 row-start-1 block w-full rounded-md bg-white dark:bg-white/5 px-3 py-1.5 ${errors.expertises ? 'text-red-900 dark:text-red-300 outline-red-300 dark:outline-red-500 placeholder:text-red-300 dark:placeholder:text-red-400' : 'text-gray-900 dark:text-white outline-gray-300 dark:outline-white/10 placeholder:text-gray-400'} outline outline-1 -outline-offset-1 focus:outline focus:outline-2 focus:-outline-offset-2 ${errors.expertises ? 'focus:outline-red-600' : 'focus:outline-blue-600'} sm:text-sm`}
              />
              {errors.expertises && (
                <ExclamationCircleIcon
                  aria-hidden="true"
                  className="pointer-events-none col-start-1 row-start-1 mr-3 size-5 self-center justify-self-end text-red-500 sm:size-4"
                />
              )}
            </div>
            {errors.expertises ? (
              <p id="expertises-error" className="mt-2 text-sm text-red-600 dark:text-red-400">
                {errors.expertises}
              </p>
            ) : (
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                Séparez vos différentes expertises par des virgules
              </p>
            )}
          </div>

          <div className="sm:col-span-full">
            <label htmlFor="message" className="block text-sm font-medium text-gray-900 dark:text-white">
              Message ou informations complémentaires
            </label>
            <div className="mt-2">
              <textarea
                id="message"
                name="message"
                rows={4}
                value={formData.message}
                onChange={handleChange}
                placeholder="Partagez-nous votre parcours, vos qualifications ou toute autre information pertinente..."
                className="block w-full rounded-md bg-white dark:bg-white/5 px-3 py-1.5 text-gray-900 dark:text-white outline outline-1 -outline-offset-1 outline-gray-300 dark:outline-white/10 placeholder:text-gray-400 focus:outline focus:outline-2 focus:-outline-offset-2 focus:outline-blue-600 sm:text-sm"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 flex items-center justify-end gap-x-4">
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="text-sm font-semibold text-gray-900 dark:text-white hover:text-gray-600 dark:hover:text-gray-300"
        >
          Annuler
        </button>
        <button
          type="submit"
          disabled={loading}
          className="rounded-md bg-amber-600 hover:bg-amber-700 px-4 py-2 text-sm font-semibold text-white shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <div className="flex items-center">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Envoi en cours...
            </div>
          ) : 'Envoyer ma demande'}
        </button>
      </div>
    </form>
  );
} 