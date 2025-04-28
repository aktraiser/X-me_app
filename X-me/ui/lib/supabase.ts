import { createClient } from '@supabase/supabase-js';
import { getSupabaseUrl, getSupabaseKey } from '@/lib/config';
import { Expert } from '@/types/index';
import { ExpertService } from '@/types';

const supabaseUrl = getSupabaseUrl();
const supabaseKey = getSupabaseKey();

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase credentials');
}

// Client supabase temporaire pendant la migration vers Clerk
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

// Fonction pour formater l'URL de l'expert
export const formatExpertUrl = (expert: any): Expert => {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://xandme-frontend.onrender.com';
  
  // Corriger l'URL de l'image si elle existe
  let imageUrl = expert.image_url;
  if (imageUrl) {
    // Remplacer les doubles slashes (sauf dans le protocole http://)
    imageUrl = imageUrl.replace(/([^:]\/)\/+/g, "$1");
  }
  
  // Corriger l'URL du logo si elle existe
  let logoUrl = expert.logo;
  if (logoUrl) {
    // Remplacer les doubles slashes (sauf dans le protocole http://)
    logoUrl = logoUrl.replace(/([^:]\/)\/+/g, "$1");
  }
  
  return {
    ...expert,
    image_url: imageUrl,
    logo: logoUrl,
    url: `${baseUrl}/expert/${expert.prenom.toLowerCase()}-${expert.nom.toLowerCase()}-${expert.id_expert}`.replace(/\s+/g, '-')
  };
};

// Fonction pour récupérer les experts avec l'URL formatée
export async function getExperts(query?: any) {
  try {
    const { data, error } = await supabase
      .from('experts')
      .select('*')
      .match(query || {});

    if (error) throw error;

    // Formater les URLs pour chaque expert
    return data?.map(formatExpertUrl) || [];
  } catch (error) {
    console.error('Error fetching experts:', error);
    return [];
  }
}

// Fonction de test de connexion
export async function checkSupabaseConnection() {
  try {
    const { data, error } = await supabase
      .from('experts')
      .select('*')
      .limit(1);

    if (error) throw error;
    console.log('✅ Frontend Supabase connection successful');
    return true;
  } catch (error) {
    console.error('❌ Frontend Supabase connection error:', error);
    return false;
  }
}

export async function uploadExpertImage(file: File, expertId: string) {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${expertId}-main.${fileExt}`;
    const filePath = `experts/${fileName}`.replace(/^\/+/, '');

    const { error: uploadError } = await supabase.storage
      .from('expert-images')  // Créez ce bucket dans Supabase
      .upload(filePath, file, {
        upsert: true
      });

    if (uploadError) throw uploadError;

    // Obtenir l'URL publique
    const { data: { publicUrl } } = supabase.storage
      .from('expert-images')
      .getPublicUrl(filePath);

    // S'assurer que l'URL ne contient pas de doubles slashes avant de la stocker
    const cleanedUrl = publicUrl.replace(/([^:]\/)\/+/g, "$1");

    // Mettre à jour l'expert avec l'URL de l'image
    const { error: updateError } = await supabase
      .from('experts')
      .update({ image_url: cleanedUrl })
      .eq('id_expert', expertId);

    if (updateError) throw updateError;

    return cleanedUrl;
  } catch (error) {
    console.error('Error uploading image:', error);
    throw error;
  }
}

// Fonction pour récupérer un expert par son ID
export async function getExpertById(expertId: string) {
  try {
    const { data, error } = await supabase
      .from('experts')
      .select('*')
      .eq('id_expert', expertId)
      .single();

    if (error) throw error;
    if (!data) return null;

    // Formater l'URL de l'expert
    return formatExpertUrl(data);
  } catch (error) {
    console.error('Error fetching expert:', error);
    return null;
  }
}

// Fonction pour mettre à jour directement les services d'un expert
export async function updateExpertServices(
  expertId: string, 
  services: any
) {
  try {
    // Mettre à jour dans la base de données
    const { error: updateError } = await supabase
      .from('experts')
      .update({ services: services })
      .eq('id_expert', expertId);
    
    if (updateError) throw updateError;
    
    return true;
  } catch (error) {
    console.error('Error updating expert services:', error);
    return false;
  }
}

// Fonction pour supprimer un service d'un expert
export async function deleteExpertService(expertId: string, serviceName: string) {
  try {
    // Récupérer les services actuels de l'expert
    const { data: expert, error: fetchError } = await supabase
      .from('experts')
      .select('services')
      .eq('id_expert', expertId)
      .single();

    if (fetchError) throw fetchError;
    
    if (!expert?.services || !expert.services[serviceName]) {
      return false; // Le service n'existe pas
    }
    
    // Créer une copie des services actuels
    const updatedServices = { ...expert.services };
    
    // Supprimer le service spécifié
    delete updatedServices[serviceName];
    
    // Mettre à jour dans la base de données
    const { error: updateError } = await supabase
      .from('experts')
      .update({ services: updatedServices })
      .eq('id_expert', expertId);
    
    if (updateError) throw updateError;
    
    return true;
  } catch (error) {
    console.error('Error deleting expert service:', error);
    return false;
  }
}

// Fonction pour mettre à jour les services d'un expert au format spécifié
export async function updateExpertServicesFormat(
  expertId: string, 
  data: {
    services_proposes?: string[];
    valeur_ajoutee?: {
      description?: string;
      points_forts?: string[];
    };
    resultats_apportes?: string[];
  }
) {
  try {
    // Mettre à jour dans la base de données
    const { error: updateError } = await supabase
      .from('experts')
      .update({ services: data })
      .eq('id_expert', expertId);
    
    if (updateError) throw updateError;
    
    return true;
  } catch (error) {
    console.error('Error updating expert services:', error);
    return false;
  }
}
