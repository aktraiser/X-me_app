export interface ExpertService {
  description?: string;
  price?: number;
  duration?: string;
  format?: string;
  services_proposes?: string[];
  valeur_ajoutee?: {
    description?: string;
    points_forts?: string[];
  };
  resultats_apportes?: string[];
  benefits?: string[];
}

export interface ExpertServiceData {
  services_proposes?: string[];
  valeur_ajoutee?: {
    description?: string;
    points_forts?: string[];
  };
  resultats_apportes?: string[];
  tarif?: number;
  domaine?: string;
  service?: string;
  price?: number;
  description?: string;
  duration?: string;
  format?: string;
  benefits?: string[];
}

export interface Expert {
  id: number;
  id_expert: string;
  nom: string;
  prenom: string;
  adresse: string;
  telephone: number;
  pays: string;
  ville: string;
  expertises: string;
  biographie: string;
  tarif: number;
  services: any; // On garde le type any pour supporter tous les formats possibles
  created_at: string;
  image_url: string;
  logo?: string;
  url: string;
  activité?: string;
  email: string;
  reseau: string;
  site_web: string;
}

export interface Location {
  pays: string;
  villes: string[];
}

export interface Expertise {
  id: string;
  name: string;
}

export interface Message {
  id: string;
  content: string;
  sender_id: string;
  receiver_id: string;
  created_at: string;
  read: boolean;
} 