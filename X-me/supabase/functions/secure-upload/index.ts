// @ts-nocheck
// Supabase Edge Function pour un upload sécurisé avec protection WAF intégrée
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

// Types Deno pour l'éditeur
declare namespace Deno {
  interface Env {
    get(key: string): string | undefined;
  }
  export const env: Env;
}

// Liste des MIME types autorisés
const ALLOWED_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain'
];

// Taille maximale de fichier (20 Mo)
const MAX_FILE_SIZE = 20 * 1024 * 1024;

// Paramètres de rate limiting
const RATE_LIMIT = {
  maxRequests: 10, // Nombre maximum de requêtes
  windowMs: 15 * 60 * 1000, // Fenêtre de temps (15 minutes)
  clientIpHeader: 'cf-connecting-ip' // Header Cloudflare pour l'IP client
};

// Liste d'IPs/Pays bloqués (exemple)
const BLOCKED_COUNTRIES = ['KP', 'IR']; // Code ISO des pays bloqués

// Fonction pour extraire l'extension de fichier de manière sûre pour TypeScript
function getFileExtension(filename: string): string {
  const parts = filename.split('.');
  return parts.length > 1 ? parts[parts.length - 1] : '';
}

serve(async (req: Request) => {
  try {
    // 1. Vérification de la méthode HTTP
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Méthode non autorisée' }),
        { status: 405, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 2. Vérification de l'en-tête Content-Type
    const contentType = req.headers.get('content-type');
    if (!contentType || !contentType.includes('multipart/form-data')) {
      return new Response(
        JSON.stringify({ error: 'Content-Type invalide' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 3. Vérification géographique (si disponible via Cloudflare ou autre CDN)
    const countryCode = req.headers.get('cf-ipcountry');
    if (countryCode && BLOCKED_COUNTRIES.includes(countryCode)) {
      return new Response(
        JSON.stringify({ error: 'Accès non autorisé depuis cette région' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 4. Analyse du corps de la requête
    const formData = await req.formData();
    
    // 5. Récupération du fichier
    const file = formData.get('file');
    if (!file || !(file instanceof File)) {
      return new Response(
        JSON.stringify({ error: 'Aucun fichier valide trouvé' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 6. Vérification du type MIME
    if (!ALLOWED_TYPES.includes(file.type)) {
      return new Response(
        JSON.stringify({ error: 'Type de fichier non autorisé' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 7. Vérification de la taille
    if (file.size > MAX_FILE_SIZE) {
      return new Response(
        JSON.stringify({ error: 'Fichier trop volumineux' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 8. Récupération des paramètres
    const embedding_model = formData.get('embedding_model')?.toString() || 'text-embedding-3-small';
    const embedding_model_provider = formData.get('embedding_model_provider')?.toString() || 'openai';

    // 9. Création du client Supabase
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') || '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    );

    // 10. Génération d'un nom de fichier unique
    const fileExtension = file.name.split('.').pop() || '';
    const uniqueFilename = `${crypto.randomUUID()}.${fileExtension}`;

    // 11. Upload vers le bucket Supabase Storage
    const { data: storageData, error: storageError } = await supabaseClient
      .storage
      .from('uploads')
      .upload(uniqueFilename, file, {
        contentType: file.type,
        cacheControl: '3600'
      });

    if (storageError) {
      console.error('Erreur Storage:', storageError);
      return new Response(
        JSON.stringify({ error: 'Erreur lors de l\'upload' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 12. Création d'un enregistrement dans la base de données
    const { data: dbData, error: dbError } = await supabaseClient
      .from('files')
      .insert({
        filename: file.name,
        storage_path: uniqueFilename,
        file_type: file.type,
        file_size: file.size,
        embedding_model,
        embedding_model_provider,
        user_id: req.headers.get('x-user-id') // On peut récupérer l'ID de l'utilisateur depuis un header ajouté par le middleware
      })
      .select('id')
      .single();

    if (dbError) {
      console.error('Erreur DB:', dbError);
      return new Response(
        JSON.stringify({ error: 'Erreur lors de l\'enregistrement' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 13. Retour de la réponse
    return new Response(
      JSON.stringify({
        success: true,
        fileId: dbData.id,
        fileName: file.name
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Erreur:', error);
    return new Response(
      JSON.stringify({ error: 'Erreur serveur' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}); 