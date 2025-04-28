import { RunnableSequence, RunnableMap } from '@langchain/core/runnables';
import ListLineOutputParser from '../lib/outputParsers/listLineOutputParser';
import { PromptTemplate } from '@langchain/core/prompts';
import formatChatHistoryAsString from '../utils/formatHistory';
import { BaseMessage } from '@langchain/core/messages';
import { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { ChatOpenAI } from '@langchain/openai';
import logger from '../utils/logger';

// Suggestions par domaine d'activité pour enrichir le contexte selon le sujet détecté
const DOMAIN_SPECIFIC_SUGGESTIONS = {
  cgv: [
    "Quelles clauses spécifiques devrais-je inclure pour me protéger contre les impayés ?",
    "Comment puis-je adapter mes CGV pour la vente en ligne internationale ?",
    "Quelles mentions sont légalement obligatoires pour mes CGV ?",
    "Comment puis-je intégrer les règles RGPD dans mes conditions générales ?",
    "Quelle est la durée de validité recommandée pour mes CGV ?"
  ],
  creation_entreprise: [
    "Quelles sont les démarches administratives pour immatriculer mon entreprise ?",
    "Comment choisir entre le statut de micro-entrepreneur et celui de SASU ?",
    "Quels sont les frais de création d'entreprise à prévoir dans mon budget ?",
    "Comment protéger ma marque et mon concept business ?",
    "Quelles sont les aides à la création d'entreprise auxquelles je pourrais prétendre ?"
  ],
  financement: [
    "Comment puis-je calculer précisément mon besoin en financement initial ?",
    "Quelles sont les alternatives au prêt bancaire pour mon projet ?",
    "Comment structurer mon dossier pour maximiser mes chances d'obtenir un financement ?",
    "Quels dispositifs d'aides publiques correspondent à mon secteur d'activité ?",
    "Comment valoriser mon entreprise pour une levée de fonds ?"
  ],
  marketing: [
    "Comment définir ma stratégie de contenu pour attirer plus de clients ?",
    "Quels KPIs devrais-je suivre pour mesurer l'efficacité de mes actions marketing ?",
    "Comment optimiser mon budget marketing pour obtenir le meilleur ROI ?",
    "Quelles sont les tendances actuelles dans mon secteur d'activité ?",
    "Comment adapter ma communication pour chaque canal (réseaux sociaux, site web, etc.) ?"
  ],
  juridique: [
    "Quelles sont les implications juridiques de mon modèle d'affaires ?",
    "Comment protéger ma propriété intellectuelle efficacement ?",
    "Quels types de contrats sont essentiels pour sécuriser mes relations commerciales ?",
    "Quelles sont mes obligations légales en matière de conformité ?",
    "Comment structurer juridiquement mon entreprise pour optimiser ma fiscalité ?"
  ]
};

const suggestionGeneratorPrompt = `
Vous êtes un expert en génération de suggestions pertinentes pour une IA d'assistance aux entrepreneurs et professionnels.

CONTEXTE:
L'utilisateur est engagé dans une conversation avec une IA d'assistance professionnelle. Votre rôle est de proposer des questions de suivi particulièrement pertinentes que l'utilisateur pourrait poser pour approfondir sa démarche initiale.

CONVERSATION PRÉCÉDENTE:
{chat_history}

INSTRUCTIONS:
- Analysez le domaine d'activité, le secteur et les préoccupations principales qui ressortent de cette conversation.
- Générez 4-5 suggestions de questions formulées à la 1ère personne (comme si l'utilisateur les posait).
- Les suggestions doivent se terminer par un point d'interrogation.
- Privilégiez des questions précises, techniques et à haute valeur ajoutée professionnelle.
- Adaptez les suggestions au niveau de maturité du projet/de l'entreprise que vous détectez.
- Intégrez des termes et concepts spécifiques au domaine d'activité identifié.
- Proposez des questions qui explorent différents aspects du sujet principal (aspects financiers, juridiques, opérationnels, etc.).

IMPORTANT: Retournez uniquement les questions, une par ligne, sans numérotation ni explications complémentaires, entre les balises <suggestions> et </suggestions>.

<suggestions>
Comment puis-je calculer précisément mon besoin en fonds de roulement pour les 6 premiers mois ?
Quelles sont les options de protection juridique pour mon concept innovant ?
Comment structurer ma politique tarifaire pour maximiser ma rentabilité ?
Quelles compétences clés devrais-je prioriser pour mes premiers recrutements ?
</suggestions>
`;

export type SuggestionGeneratorInput = {
  chat_history: BaseMessage[];
  existingExperts?: any[];
};

// Type pour le résultat du parser
type SuggestionResult = string[] | { suggestions?: string[] } | Record<string, any>;

const outputParser = new ListLineOutputParser({
  key: 'suggestions',
});

const createSuggestionGeneratorChain = (llm: BaseChatModel) => {
  return RunnableSequence.from([
    RunnableMap.from({
      chat_history: (input: SuggestionGeneratorInput) =>
        formatChatHistoryAsString(input.chat_history),
    }),
    PromptTemplate.fromTemplate(suggestionGeneratorPrompt),
    llm,
    outputParser,
  ]);
};

/**
 * Détecte le domaine d'activité principal basé sur le contenu de la conversation
 * @param chatHistory Historique de la conversation
 * @returns Le domaine détecté ou undefined
 */
const detectDomain = (chatHistory: BaseMessage[]): string | undefined => {
  // Concaténer tout le contenu de la conversation pour l'analyse
  const fullContent = chatHistory
    .map(msg => msg.content?.toString() || '')
    .join(' ')
    .toLowerCase();
  
  // Détection simple basée sur des mots-clés
  if (fullContent.includes('cgv') || 
      fullContent.includes('conditions générales') || 
      fullContent.includes('conditions de vente')) {
    return 'cgv';
  }
  
  if (fullContent.includes('créer une entreprise') || 
      fullContent.includes('création d\'entreprise') || 
      fullContent.includes('immatriculation') ||
      fullContent.includes('statut juridique')) {
    return 'creation_entreprise';
  }
  
  if (fullContent.includes('financement') || 
      fullContent.includes('investissement') || 
      fullContent.includes('levée de fond') ||
      fullContent.includes('prêt bancaire')) {
    return 'financement';
  }
  
  if (fullContent.includes('marketing') || 
      fullContent.includes('communication') || 
      fullContent.includes('publicité') ||
      fullContent.includes('client') ||
      fullContent.includes('vente')) {
    return 'marketing';
  }
  
  if (fullContent.includes('juridique') || 
      fullContent.includes('contrat') || 
      fullContent.includes('droit') ||
      fullContent.includes('légal')) {
    return 'juridique';
  }
  
  return undefined;
};

/**
 * Enrichit les suggestions générées avec des suggestions spécifiques au domaine
 * @param generatedSuggestions Suggestions générées par l'IA
 * @param domain Domaine détecté
 * @returns Suggestions enrichies
 */
const enrichSuggestionsWithDomain = (
  generatedSuggestions: string[], 
  domain?: string
): string[] => {
  if (!domain || !DOMAIN_SPECIFIC_SUGGESTIONS[domain]) {
    return generatedSuggestions;
  }
  
  const domainSuggestions = DOMAIN_SPECIFIC_SUGGESTIONS[domain];
  
  // Combiner les suggestions générées avec les suggestions spécifiques au domaine
  const combined = [...generatedSuggestions];
  
  // Ajouter jusqu'à 2 suggestions spécifiques au domaine si nous n'avons pas assez de suggestions
  if (combined.length < 5) {
    const needed = 5 - combined.length;
    const additional = domainSuggestions
      .filter(sugg => !combined.some(s => s.toLowerCase().includes(sugg.toLowerCase().substring(0, 10))))
      .slice(0, needed);
    
    combined.push(...additional);
  }
  
  // Limiter à 5 suggestions maximum
  return combined.slice(0, 5);
};

const generateSuggestions = async (
  input: SuggestionGeneratorInput,
  llm: BaseChatModel,
) => {
  try {
    logger.info(`🔍 SuggestionGenerator - Démarrage de la génération de suggestions`);
    logger.info(`📋 SuggestionGenerator - Historique: ${input.chat_history.length} messages, Experts: ${input.existingExperts?.length || 0}`);
    
    // Configurer le modèle LLM
    (llm as unknown as ChatOpenAI).temperature = 0.1; // Température basse pour des suggestions plus précises
    const suggestionGeneratorChain = createSuggestionGeneratorChain(llm);
    
    // Détecter le domaine d'activité
    const detectedDomain = detectDomain(input.chat_history);
    logger.info(`🔍 SuggestionGenerator - Domaine détecté: ${detectedDomain || 'aucun'}`);

    // Cas avec experts existants
    if (input.existingExperts && input.existingExperts.length > 0) {
      logger.info(`👥 SuggestionGenerator - Utilisation de ${input.existingExperts.length} experts existants`);
      
      try {
        const result = await suggestionGeneratorChain.invoke(input) as SuggestionResult;
        // Extraire les suggestions du résultat
        let suggestions: string[] = [];
        
        if (Array.isArray(result)) {
          suggestions = result;
        } else if (typeof result === 'object' && result !== null) {
          if ('suggestions' in result && Array.isArray(result.suggestions)) {
            suggestions = result.suggestions;
          }
        }
        
        // Enrichir avec des suggestions spécifiques au domaine
        const enrichedSuggestions = enrichSuggestionsWithDomain(suggestions, detectedDomain);
        
        logger.info(`✅ SuggestionGenerator - Généré ${enrichedSuggestions.length} suggestions avec experts (${detectedDomain || 'domaine général'})`);
        return enrichedSuggestions;
      } catch (chainError) {
        logger.error(`❌ SuggestionGenerator - Erreur lors de la génération avec experts: ${chainError.message}`);
        console.error('Erreur détaillée:', chainError);
        return [];
      }
    }
    
    // Cas sans experts (défaut)
    try {
      const result = await suggestionGeneratorChain.invoke(input) as SuggestionResult;
      // Extraire les suggestions du résultat
      let suggestions: string[] = [];
      
      if (Array.isArray(result)) {
        suggestions = result;
      } else if (typeof result === 'object' && result !== null) {
        if ('suggestions' in result && Array.isArray(result.suggestions)) {
          suggestions = result.suggestions;
        }
      }
      
      // Enrichir avec des suggestions spécifiques au domaine
      const enrichedSuggestions = enrichSuggestionsWithDomain(suggestions, detectedDomain);
      
      logger.info(`✅ SuggestionGenerator - Généré ${enrichedSuggestions.length} suggestions sans experts (${detectedDomain || 'domaine général'})`);
      return enrichedSuggestions;
    } catch (chainError) {
      logger.error(`❌ SuggestionGenerator - Erreur lors de la génération sans experts: ${chainError.message}`);
      console.error('Erreur détaillée:', chainError);
      return [];
    }
  } catch (error) {
    logger.error(`❌ SuggestionGenerator - Erreur générale: ${error.message}`);
    console.error('Erreur détaillée:', error);
    return [];
  }
};

export default generateSuggestions;