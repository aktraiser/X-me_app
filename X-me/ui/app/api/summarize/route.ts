import { NextResponse } from 'next/server';
import OpenAI from 'openai';

// Initialiser le client OpenAI avec la clé d'API seulement si elle existe
let openai: OpenAI | null = null;
if (process.env.OPENAI_API_KEY) {
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
}

// Type pour la requête
interface SummarizeRequest {
  content: string;  // Le contenu à résumer
  title?: string;   // Le titre de la source (optionnel)
  type?: string;    // Le type de source (document, webpage, etc.)
}

// En-tête pour autoriser les requêtes CORS
export async function OPTIONS() {
  return NextResponse.json(
    {},
    {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    }
  );
}

export async function POST(request: Request) {
  try {
    // Analyser le corps de la requête
    const body = await request.json() as SummarizeRequest;
    const { content, title, type } = body;

    // Vérifier si le contenu est fourni
    if (!content || content.length === 0) {
      return NextResponse.json(
        { error: 'Le contenu à résumer est requis' },
        { status: 400 }
      );
    }

    // Limiter la taille du contenu pour éviter de dépasser les limites de l'API
    const truncatedContent = content.slice(0, 5000);

    // Vérifier si OpenAI est configuré
    if (!openai) {
      // Fallback: retourner un extrait du contenu au lieu d'un résumé généré
      const excerpt = truncatedContent.slice(0, 150).trim() + '...';
      return NextResponse.json({ summary: excerpt });
    }

    // Générer un résumé du contenu en utilisant OpenAI
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: `Tu es un assistant spécialisé qui produit des résumés concis et informatifs.
            Résume le contenu suivant en 2-3 phrases qui capturent les points clés.
            Contexte - Titre: ${title || 'Non spécifié'}, Type: ${type || 'document'}
            Ton résumé doit être clair, précis et facile à comprendre.`
        },
        {
          role: "user",
          content: truncatedContent
        }
      ],
      temperature: 0.7,
      max_tokens: 150
    });

    // Extraire et retourner le résumé
    const summary = completion.choices[0].message.content || "Impossible de générer un résumé.";

    return NextResponse.json({ summary });
  } catch (error) {
    console.error('Erreur lors de la génération du résumé:', error);
    // En cas d'erreur, retourner un extrait du texte
    try {
      const body = await request.json() as SummarizeRequest;
      const excerpt = body.content?.slice(0, 150).trim() + '...' || "Impossible de générer un résumé.";
      return NextResponse.json({ summary: excerpt });
    } catch {
      return NextResponse.json({ summary: "Impossible de générer un résumé." });
    }
  }
} 