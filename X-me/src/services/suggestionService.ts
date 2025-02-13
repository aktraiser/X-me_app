import OpenAI from 'openai';
import { cache } from '../utils/cache';
import { getOpenaiApiKey } from '../config';

interface SuggestionSource {
  type: 'static' | 'dynamic' | 'ai';
  priority: number;
  data?: string[];
}

const BUSINESS_QUESTIONS = {
  creation: [
    "Quel statut juridique convient le mieux à mon activité (EI, SASU, SARL, etc.) ?",
    "Quelles sont les démarches administratives pour immatriculer mon entreprise ?",
    "Quels documents sont nécessaires pour créer une entreprise ?",
    "Comment réaliser une étude de marché pour valider mon idée ?",
    "Comment structurer mon business plan ?",
    "Comment protéger mon idée ou ma marque (dépôt à l'INPI, brevet) ?",
    "Quels sont les organismes publics ou privés qui peuvent m'accompagner ?",
    "Comment établir une stratégie pour capter mes premiers clients ?"
  ],
  financement: [
    "Quels types de financements sont adaptés à mon projet ?",
    "Comment maximiser mes chances de réussite pour une levée de fonds ?",
    "Quelles aides publiques ou subventions sont disponibles pour mon secteur d'activité ?",
    "Comment estimer mon besoin en fonds de roulement (BFR) ?",
    "Comment présenter mon prévisionnel financier de manière convaincante ?"
  ],
  fiscal: [
    "Quels sont les régimes fiscaux disponibles et lequel choisir ?",
    "Comment facturer et déclarer la TVA selon mon activité ?",
    "Quelles charges sociales dois-je prévoir selon mon statut ?",
    "Comment calculer mon impôt sur le revenu ou sur les sociétés ?",
    "Quelles sont les exonérations ou crédits d'impôt disponibles ?"
  ],
  commercial: [
    "Comment trouver mes premiers clients ?",
    "Quelles stratégies pour attirer des prospects qualifiés ?",
    "Comment élaborer une offre qui répond aux attentes des clients ?",
    "Quel prix fixer pour mes produits ou services ?",
    "Comment construire une image de marque forte ?"
  ],
  organisation: [
    "Comment organiser mon emploi du temps pour être plus productif ?",
    "Quand et comment recruter mon premier salarié ?",
    "Comment structurer et documenter mes processus internes ?",
    "Comment gérer mon temps entre la gestion quotidienne et le développement ?",
    "Comment anticiper et gérer les périodes creuses ou d'activité intense ?"
  ]
};

export class SuggestionService {
  private static instance: SuggestionService;
  private openai: OpenAI;
  private sources: SuggestionSource[] = [];

  private constructor() {
    this.openai = new OpenAI({
      apiKey: getOpenaiApiKey(),
    });
    // Source statique regroupant l'ensemble des questions business
    this.sources.push({
      type: 'static',
      priority: 1,
      data: Object.values(BUSINESS_QUESTIONS).flat()
    });
  }

  public static getInstance(): SuggestionService {
    if (!SuggestionService.instance) {
      SuggestionService.instance = new SuggestionService();
    }
    return SuggestionService.instance;
  }

  // Appel à l'API OpenAI pour générer des suggestions
  private async getAISuggestions(input: string): Promise<string[]> {
    try {
      const completion = await this.openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [{
          role: "system",
          content: `Vous êtes un expert en business et accompagnement d'entreprise. 
          À partir du début de la phrase de l'utilisateur, fournissez une liste d'au maximum 5 suggestions de questions que l'utilisateur pourrait poser.
          Les questions doivent être formulées à la première personne, comme si l'utilisateur les posait lui-même. Par exemple :
          - "Comment puis-je réaliser une étude de marché ?" (et non pas "Avez-vous réalisé une étude de marché ?")
          - "Quel statut juridique dois-je choisir ?" (et non pas "Quel statut juridique envisagez-vous ?")
          
          Les suggestions doivent être pertinentes, concises et directement utilisables par l'utilisateur pour obtenir des informations.
          Chaque suggestion doit être une question complète se terminant par un point d'interrogation.`
        }, {
          role: "user",
          content: input
        }],
        temperature: 0.7,
        max_tokens: 60
      });

      const rawSuggestions = completion.choices[0].message.content
        .split('\n')
        .map(s => s.trim())
        .filter(s => s.length > 0);

      // Nettoyer et filtrer les suggestions afin de ne garder que des questions concises
      const aiSuggestions = rawSuggestions
        .map(s => s.replace(/^\d+\.\s*/, ''))
        .filter(s => s.endsWith('?') && s.length < 150)
        .slice(0, 5);

      return aiSuggestions;
    } catch (error) {
      console.error('Erreur lors de la génération AI:', error);
      return [];
    }
  }

  // Récupère les suggestions en combinant les sources statiques et, si nécessaire, l'IA
  public async getSuggestions(input: string): Promise<string[]> {
    if (!input || input.trim().length === 0) {
      return [];
    }
    const cacheKey = `suggestions:${input}`;
    const cachedSuggestions = cache.get<string[]>(cacheKey);
    if (cachedSuggestions) {
      return cachedSuggestions;
    }

    const inputLower = input.toLowerCase().trim();
    let suggestions: string[] = [];

    // Filtrer les suggestions statiques et vérifier qu'elles correspondent bien à une question concise
    suggestions = this.sources
      .find(s => s.type === 'static')
      ?.data
      ?.filter(s => {
        const cleanedSuggestion = s.replace(/^(entreprise|création|financement|fiscal|commercial|organisation)\s*:\s*/i, '').trim();
        return cleanedSuggestion.toLowerCase().startsWith(inputLower) &&
               cleanedSuggestion.endsWith('?') &&
               cleanedSuggestion.length < 150;
      }) || [];

    // Si le nombre de suggestions statiques est insuffisant ou pour certains débuts spécifiques, on complète avec l'IA
    if (
      suggestions.length < 5 ||
      inputLower.startsWith('comment') ||
      inputLower.startsWith('quelles') ||
      inputLower.startsWith('quels') ||
      inputLower.startsWith('pourquoi')
    ) {
      const aiSuggestions = await this.getAISuggestions(input);
      suggestions = [...suggestions, ...aiSuggestions];
    }

    const uniqueSuggestions = [...new Set(suggestions)]
      .filter(s => s && s.length > 0)
      .slice(0, 6);

    // Mise en cache pendant 5 minutes
    cache.set(cacheKey, uniqueSuggestions, 300);
    return uniqueSuggestions;
  }
}

export const suggestionService = SuggestionService.getInstance();