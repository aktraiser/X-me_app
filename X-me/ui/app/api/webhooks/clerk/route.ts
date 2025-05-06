import { IncomingHttpHeaders } from 'http';
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { Webhook, WebhookRequiredHeaders } from 'svix';
import { createClient } from '@supabase/supabase-js';

// Types pour les événements Clerk
type EventType = 
  | 'user.created' 
  | 'user.updated' 
  | 'user.deleted'
  | 'session.created'
  | 'session.removed'
  | 'organization.created'
  | 'organization.updated'
  | 'organization.deleted';

type Event = {
  data: Record<string, any>;
  object: 'event';
  type: EventType;
};

// Initialiser le client Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Cette fonction gère les webhooks venant de Clerk
 * 
 * Elle vérifie l'authenticité de la requête avec le secret de webhook
 * et traite l'événement en fonction de son type
 */
export async function POST(req: Request) {
  // Récupérer le corps de la requête
  const payload = await req.text();
  const headersList = headers();
  
  // Récupérer les en-têtes spécifiques à Svix
  const svixHeaders = {
    'svix-id': headersList.get('svix-id'),
    'svix-timestamp': headersList.get('svix-timestamp'),
    'svix-signature': headersList.get('svix-signature'),
  } as WebhookRequiredHeaders;
  
  // Vérifier que tous les en-têtes requis sont présents
  const missingHeaders = Object.entries(svixHeaders)
    .filter(([_, value]) => !value)
    .map(([key]) => key);

  if (missingHeaders.length > 0) {
    return NextResponse.json(
      { error: `En-têtes manquants: ${missingHeaders.join(', ')}` },
      { status: 400 }
    );
  }

  // Récupérer le webhook secret depuis les variables d'environnement
  const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;
  
  if (!webhookSecret) {
    console.error("CLERK_WEBHOOK_SECRET manquant dans les variables d'environnement");
    return NextResponse.json(
      { error: "Erreur de configuration du serveur" },
      { status: 500 }
    );
  }

  // Vérifier la signature du webhook
  let event: Event;
  
  try {
    const wh = new Webhook(webhookSecret);
    event = wh.verify(payload, svixHeaders) as Event;
  } catch (err) {
    console.error('Erreur lors de la vérification du webhook:', err);
    return NextResponse.json(
      { error: 'Signature du webhook invalide' },
      { status: 400 }
    );
  }

  // Traiter l'événement en fonction de son type
  try {
    const eventType: EventType = event.type;
    
    // Exemple de traitement d'événements
    switch (eventType) {
      case 'user.created':
        // Traiter la création d'un utilisateur
        console.log('Nouvel utilisateur créé:', event.data);
        // Synchroniser avec Supabase
        await syncUserToSupabase(event.data);
        break;
        
      case 'user.updated':
        // Traiter la mise à jour d'un utilisateur
        console.log('Utilisateur mis à jour:', event.data);
        // Mettre à jour dans Supabase
        await updateUserInSupabase(event.data);
        break;
        
      case 'user.deleted':
        // Traiter la suppression d'un utilisateur
        console.log('Utilisateur supprimé:', event.data);
        // Supprimer de Supabase
        await deleteUserFromSupabase(event.data.id);
        break;
        
      case 'organization.created':
      case 'organization.updated':
      case 'organization.deleted':
        // Traiter les événements liés aux organisations
        console.log(`Organisation ${eventType.split('.')[1]}:`, event.data);
        break;
        
      default:
        // Événement non traité spécifiquement
        console.log(`Événement reçu (${eventType}):`, event.data);
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Erreur lors du traitement de l\'événement:', err);
    return NextResponse.json(
      { error: 'Erreur lors du traitement de l\'événement' },
      { status: 500 }
    );
  }
}

/**
 * Synchronise un utilisateur Clerk avec Supabase
 */
async function syncUserToSupabase(userData: Record<string, any>) {
  try {
    // Extraire les données pertinentes de l'utilisateur Clerk
    const { id, email_addresses, phone_numbers, created_at } = userData;
    
    // Prendre la première adresse email vérifiée ou non
    const primaryEmail = email_addresses?.[0]?.email_address || '';
    
    // Prendre le premier numéro de téléphone s'il existe
    const phone = phone_numbers?.[0]?.phone_number || null;
    
    // Insérer l'utilisateur dans Supabase
    const { data, error } = await supabase
      .from('users')
      .upsert({
        id,
        email: primaryEmail,
        phone,
        created_at: created_at || new Date().toISOString(),
        // Valeurs par défaut pour les autres champs
        language: 'fr',
        theme: 'light',
        semi_auto_complete: true,
        ai_data_retention: false,
        ai_model: 'gpt-3.5-turbo',
        image_model: 'default'
      })
      .select();
    
    if (error) {
      console.error('Erreur lors de la synchronisation avec Supabase:', error);
    } else {
      console.log('Utilisateur synchronisé avec Supabase:', data);
    }
  } catch (err) {
    console.error('Erreur lors de la synchronisation avec Supabase:', err);
  }
}

/**
 * Met à jour un utilisateur existant dans Supabase
 */
async function updateUserInSupabase(userData: Record<string, any>) {
  try {
    // Extraire les données pertinentes de l'utilisateur Clerk
    const { id, email_addresses, phone_numbers } = userData;
    
    // Préparer les données à mettre à jour
    const updateData: Record<string, any> = {};
    
    // Mettre à jour l'email s'il est disponible
    if (email_addresses?.[0]?.email_address) {
      updateData.email = email_addresses[0].email_address;
    }
    
    // Mettre à jour le téléphone s'il est disponible
    if (phone_numbers?.[0]?.phone_number) {
      updateData.phone = phone_numbers[0].phone_number;
    }
    
    // Ne mettre à jour que si nous avons des données
    if (Object.keys(updateData).length > 0) {
      const { data, error } = await supabase
        .from('users')
        .update(updateData)
        .eq('id', id)
        .select();
      
      if (error) {
        console.error('Erreur lors de la mise à jour dans Supabase:', error);
      } else {
        console.log('Utilisateur mis à jour dans Supabase:', data);
      }
    }
  } catch (err) {
    console.error('Erreur lors de la mise à jour dans Supabase:', err);
  }
}

/**
 * Supprime un utilisateur de Supabase
 */
async function deleteUserFromSupabase(userId: string) {
  try {
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', userId);
    
    if (error) {
      console.error('Erreur lors de la suppression dans Supabase:', error);
    } else {
      console.log('Utilisateur supprimé de Supabase');
    }
  } catch (err) {
    console.error('Erreur lors de la suppression dans Supabase:', err);
  }
} 