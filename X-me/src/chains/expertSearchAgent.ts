import { ChatPromptTemplate, PromptTemplate } from '@langchain/core/prompts';
import { BaseChatModel } from '@langchain/core/language_models/chat_models';
import {
  RunnableLambda,
  RunnableMap,
  RunnableSequence,
} from '@langchain/core/runnables';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { BaseMessage } from '@langchain/core/messages';
import { supabase } from '../db/supabase';
import formatChatHistoryAsString from '../utils/formatHistory';
import { Expert, ExpertSearchRequest, ExpertSearchResponse } from '../types/types';

type ExpertSearchChainInput = {
  chat_history: BaseMessage[];
  query: string;
};

const ExpertSearchChainPrompt = `
Vous êtes un agent spécialisé dans l'analyse et la recherche d'experts professionnels. Votre rôle est d'interpréter les demandes des utilisateurs et d'extraire les informations essentielles pour trouver l'expert le plus pertinent.

OBJECTIF :
Analyser la requête pour identifier précisément :
1. Le domaine d'expertise recherché
2. La localisation souhaitée (si mentionnée)
3. Le service spécifique demandé (si mentionné)

RÈGLES D'EXTRACTION :
- Pour l'EXPERTISE :
  * Identifier le domaine principal (comptabilité, droit, marketing, etc.)
  * Reconnaître les spécialisations (droit des affaires, marketing digital, etc.)
  * Nettoyer les mots parasites (expert, spécialiste, professionnel, etc.)
  * Extraire les mots-clés pertinents pour la recherche
  * Prendre en compte les synonymes et variations

- Pour la VILLE :
  * Si mentionnée, extraire la ville mentionnée
  * Laisser vide si non spécifiée
  * Ne jamais ajouter d'autres informations dans ce champ
  * Standardiser le format (tout en minuscules)

- Pour le SERVICE :
  * Identifier le type de service demandé (conseil, accompagnement, formation, etc.)
  * Reconnaître les besoins spécifiques (création d'entreprise, fiscalité, etc.)
  * Extraire les mots-clés liés aux services
  * Ne pas confondre avec la ville

FORMAT DE RÉPONSE STRICT :
Répondre EXACTEMENT avec ce format, chaque élément sur sa propre ligne :
expertise: [domaine d'expertise]
ville: [ville si mentionnée, sinon laisser vide]
service: [service si mentionné, sinon laisser vide]

EXEMPLES D'ANALYSE :

1. "Je cherche un expert comptable sur Paris pour m'aider avec ma déclaration fiscale"
expertise: comptabilité
ville: paris
service: déclaration fiscale

2. "Il me faudrait un avocat spécialisé en droit des affaires à Lyon pour créer ma société"
expertise: droit des affaires
ville: lyon
service: création de société

3. "Qui peut m'aider avec le marketing digital pour ma boutique en ligne ?"
expertise: marketing digital
ville: 
service: stratégie e-commerce

4. "Je cherche quelqu'un pour m'aider à créer mon entreprise"
expertise: création d'entreprise
ville: 
service: accompagnement entrepreneurial

Conversation précédente :
{chat_history}

Requête actuelle : {query}

Principe de recherche d'expert :
- Pour toute recherche d'expert, extraire :
  * L'expertise demandée (avec ses variations et synonymes)
  * La ville (si mentionnée, sinon laisser vide)
  * Le service spécifique (si mentionné, sinon laisser vide)

- Mots déclencheurs à reconnaître :
  * "cherche un expert/spécialiste/consultant"
  * "besoin d'un professionnel"
  * "recherche quelqu'un pour"
  * "qui peut m'aider avec"
  * "conseil en"
  * "assistance pour"
  * "accompagnement dans"

- Domaines d'expertise à reconnaître :
  * Création d'entreprise (entrepreneuriat, lancement d'activité, etc.)
  * Comptabilité (gestion comptable, fiscalité, etc.)
  * Marketing (digital, traditionnel, stratégie, etc.)
  * Droit (des affaires, commercial, fiscal, etc.)
  * Finance (gestion financière, investissement, etc.)
  * Stratégie (développement, business plan, etc.)
  * RH (ressources humaines, recrutement, etc.)
  * Communication (relations publiques, médias, etc.)

<example>
\`<query>
Je cherche un expert comptable pour ma déclaration d'impôts
</query>
expertise: comptabilité
ville: 
service: déclaration d'impôts
\`

\`<query>
J'ai besoin d'un spécialiste en droit des sociétés à Lyon pour un accompagnement juridique
</query>
expertise: droit des sociétés
ville: lyon
service: accompagnement juridique
\`

\`<query>
Qui peut m'aider avec ma comptabilité sur Paris ?
</query>
expertise: comptabilité
ville: paris
service: 
\`
</example>
`;

const ExpertAnalysisPrompt = `
Vous devez générer une synthèse des experts trouvés en vous basant UNIQUEMENT sur les données fournies.

Contexte de la recherche : {query}

Experts trouvés (à utiliser EXCLUSIVEMENT) :
{experts}

Format de la synthèse :
🎯 Synthèse de la recherche
[Résumé bref de la demande]

💫 Experts disponibles :
[Pour chaque expert trouvé dans les données :]
- [Prénom Nom] à [Ville]
  Expertise : [expertises]
  Services : [services pertinents en lien avec la recherche]
  Tarif : [tarif]€
  [Point clé de la biographie en lien avec la demande]

⚠️ IMPORTANT : N'inventez PAS d'experts. Utilisez UNIQUEMENT les données fournies.
`;

const strParser = new StringOutputParser();

// Fonction pour convertir les données de l'expert
const convertToExpert = (data: any): Expert => {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  return {
    id: data.id || 0,
    id_expert: data.id_expert || '',
    nom: data.nom || '',
    prenom: data.prenom || '',
    adresse: data.adresse || '',
    pays: data.pays || '',
    ville: data.ville || '',
    expertises: data.expertises || '',
    specialite: data.specialite,
    biographie: data.biographie || '',
    tarif: data.tarif || 0,
    services: data.services || {},
    created_at: data.created_at || new Date().toISOString(),
    image_url: data.image_url || '',
    url: `${baseUrl}/expert/${data.prenom.toLowerCase()}-${data.nom.toLowerCase()}-${data.id_expert}`.replace(/\s+/g, '-')
  };
};

const createExpertSearchChain = (llm: BaseChatModel) => {
  // Créer le prompt pour l'analyse de la requête
  const searchAnalysisPrompt = ChatPromptTemplate.fromTemplate(ExpertSearchChainPrompt);

  return RunnableSequence.from([
    // 1. Préparer les inputs
    RunnableMap.from({
      query: (input: ExpertSearchChainInput) => input.query || '',
      chat_history: (input: ExpertSearchChainInput) => 
        formatChatHistoryAsString(input.chat_history || []),
    }),
    // 2. Analyser la requête avec le LLM
    RunnableSequence.from([
      searchAnalysisPrompt,
      llm,
      strParser,
    ]),
    // 3. Extraire les critères de recherche
    RunnableLambda.from(async (llmOutput: string) => {
      console.log('🤖 Analyse LLM:', llmOutput);
      
      // Extraire expertise, ville et service du résultat LLM
      const expertiseMatch = llmOutput.match(/expertise:\s*(.+)/i);
      const villeMatch = llmOutput.match(/ville:\s*(.+)/i);
      const serviceMatch = llmOutput.match(/service:\s*(.+)/i);
      
      const expertise = expertiseMatch?.[1]?.trim() || '';
      
      // Vérifier si la valeur de la ville est vide ou contient le mot "service"
      let ville = '';
      if (villeMatch?.[1]) {
        const villeValue = villeMatch[1].trim();
        if (villeValue && !villeValue.toLowerCase().includes('service:')) {
          ville = villeValue;
        }
      }
      
      const service = serviceMatch?.[1]?.trim() || '';
      
      console.log('📊 Critères extraits:', { expertise, ville, service });
      
      return { expertise, ville, service };
    }),
    // 4. Rechercher les experts
    RunnableLambda.from(async (criteria: { expertise: string, ville: string, service: string }) => {
      try {
        console.log('🔍 Recherche avec critères:', criteria);

        // Construire la requête de base Supabase
        let query = supabase
          .from('experts')
          .select('*');

        // Accumuler les conditions OR pour expertise et biographie
        const expertiseBioConditions = [];
        if (criteria.expertise) {
          const keywords = criteria.expertise.toLowerCase().split(/\s+/);
          keywords.forEach(keyword => {
            if (keyword.length >= 3) { // Éviter les mots trop courts
              expertiseBioConditions.push(`expertises.ilike.%${keyword}%`);
              expertiseBioConditions.push(`biographie.ilike.%${keyword}%`);
            }
          });
        }
        
        // Appliquer les filtres OR pour expertise et biographie
        if (expertiseBioConditions.length > 0) {
          query = query.or(expertiseBioConditions.join(','));
        }
        
        // Appliquer le filtre de ville en AND
        if (criteria.ville && criteria.ville.length > 0) {
          query = query.ilike('ville', `%${criteria.ville}%`);
        }
        
        // Log de la requête finale
        let queryStringLog = 'Requête initiale';
        if (expertiseBioConditions.length > 0) queryStringLog += ` OR (${expertiseBioConditions.join(',')})`;
        if (criteria.ville) queryStringLog += ` AND ville.ilike.%${criteria.ville}%`;
        console.log('🔍 Exécution de la requête Supabase avec filtre:', queryStringLog);

        // Exécuter la requête
        const { data: expertsData, error } = await query.limit(5);

        if (error) {
          console.error('❌ Erreur Supabase:', error);
          throw error;
        }
        
        console.log('🔍 Résultat de la requête experts:', {
          criteres: criteria,
          nbExperts: expertsData?.length || 0
        });

        // Recherche complémentaire dans la table activité si aucun résultat n'a été trouvé
        if (!expertsData || expertsData.length === 0) {
          try {
            if (criteria.expertise) {
              console.log('🔍 Tentative de recherche secondaire dans la table activité');
              const keywords = criteria.expertise.toLowerCase().split(/\s+/);
              
              // Préparer une requête distincte pour la table activité
              let activiteQuery = supabase.from('activité').select('*, experts(*)');
              
              // Filtrer par keywords dans le nom d'activité
              const activiteConditions = keywords
                .filter(k => k.length >= 3)
                .map(k => `name.ilike.%${k}%`);
                
              if (activiteConditions.length > 0) {
                activiteQuery = activiteQuery.or(activiteConditions.join(','));
                
                // Ajouter le filtre de ville si nécessaire
                if (criteria.ville && criteria.ville.length > 0) {
                  activiteQuery = activiteQuery.eq('experts.ville', criteria.ville);
                }
                
                const { data: activiteResults, error: activiteError } = await activiteQuery.limit(5);
                
                if (!activiteError && activiteResults && activiteResults.length > 0) {
                  console.log('✅ Experts trouvés via la table activité:', activiteResults.length);
                  
                  // Extraire les experts des résultats de l'activité
                  const expertsFromActivite = activiteResults
                    .filter(act => act.experts)
                    .map(act => act.experts);
                  
                  return {
                    experts: expertsFromActivite.map(convertToExpert),
                    synthese: `J'ai trouvé ${expertsFromActivite.length} experts en ${criteria.expertise}${criteria.ville ? ` à ${criteria.ville}` : ''}${criteria.service ? ` pour ${criteria.service}` : ''}.`
                  } as ExpertSearchResponse;
                }
              }
            }
          } catch (activiteError) {
            console.error('❌ Erreur lors de la recherche secondaire:', activiteError);
          }
          
          // Si nous arrivons ici, aucun résultat n'a été trouvé
          return {
            experts: [],
            synthese: `Désolé, je n'ai pas trouvé d'experts en ${criteria.expertise}${criteria.ville ? ` à ${criteria.ville}` : ''}${criteria.service ? ` pour ${criteria.service}` : ''}.`
          } as ExpertSearchResponse;
        }

        // Filtrage post-requête pour les services si nécessaire
        let experts = expertsData;
        if (criteria.service && experts && experts.length > 0) {
          console.log(`🔍 Application du filtre service post-requête pour "${criteria.service}"`);
          const serviceKeywords = criteria.service.toLowerCase().split(/\s+/).filter(k => k.length >= 3);
          console.log(`🔍 Mots-clés de service: ${serviceKeywords.join(', ')}`);
          
          // Garder une trace des experts originaux avant filtrage
          const originalExperts = [...experts];
          
          // Appliquer le filtre par service
          const filteredExperts = experts.filter(expert => {
            if (!expert.services) return false;
            const servicesText = JSON.stringify(expert.services).toLowerCase();
            return serviceKeywords.some(keyword => servicesText.includes(keyword));
          });
          
          // Si on a des experts après filtrage, utiliser ceux-là
          if (filteredExperts.length > 0) {
            console.log(`🔍 ${filteredExperts.length} experts trouvés après filtrage par service`);
            experts = filteredExperts;
          } else {
            // Sinon, conserver tous les experts d'origine, mais limiter à 3
            console.log(`⚠️ Aucun expert trouvé avec les critères de service, retour aux experts d'origine`);
            experts = originalExperts.slice(0, 3);
          }
          
          console.log(`🔍 ${experts.length} experts restants après filtre service post-requête.`);
        }

        // Trier les experts par pertinence
        const sortedExperts = experts.sort((a, b) => {
          // Calcul du score de pertinence pour chaque expert
          let scoreA = calculateRelevanceScore(a, criteria);
          let scoreB = calculateRelevanceScore(b, criteria);
          
          // Tri décroissant par score
          return scoreB - scoreA;
        });

        // Générer la synthèse avec le LLM
        const synthesePrompt = PromptTemplate.fromTemplate(ExpertAnalysisPrompt);
        const formattedPrompt = await synthesePrompt.format({
          query: `Recherche d'expert en ${criteria.expertise}${criteria.ville ? ` à ${criteria.ville}` : ''}${criteria.service ? ` pour ${criteria.service}` : ''}`,
          experts: JSON.stringify(sortedExperts, null, 2)
        });

        const syntheseResponse = await llm.invoke(formattedPrompt);
        const syntheseString = typeof syntheseResponse.content === 'string' 
          ? syntheseResponse.content 
          : JSON.stringify(syntheseResponse.content);

        return {
          experts: sortedExperts.map(convertToExpert),
          synthese: syntheseString
        } as ExpertSearchResponse;

      } catch (error) {
        console.error('❌ Erreur dans la recherche:', error);
        return {
          experts: [],
          synthese: "Une erreur est survenue lors de la recherche d'experts."
        } as ExpertSearchResponse;
      }
    }),
  ]);
};

// Fonction pour calculer le score de pertinence d'un expert par rapport aux critères
const calculateRelevanceScore = (expert: any, criteria: { expertise: string, ville: string, service: string }): number => {
  let score = 0;
  
  // Vérifier l'expertise
  if (criteria.expertise && expert.expertises) {
    const expertiseKeywords = criteria.expertise.toLowerCase().split(/\s+/);
    expertiseKeywords.forEach(keyword => {
      // Match exact dans les expertises
      if (expert.expertises.toLowerCase().includes(keyword)) {
        score += 10;
        console.log(`🎯 Match expertise: +10 points pour ${keyword} dans ${expert.prenom} ${expert.nom}`);
      }
      // Match dans la biographie
      if (expert.biographie && expert.biographie.toLowerCase().includes(keyword)) {
        score += 5;
        console.log(`🎯 Match biographie: +5 points pour ${keyword} dans ${expert.prenom} ${expert.nom}`);
      }
      // Match dans activité
      if (expert.activité && expert.activité.name && expert.activité.name.toLowerCase().includes(keyword)) {
        score += 15; // Bonus pour match dans l'activité principale
        console.log(`🎯 Match activité: +15 points pour ${keyword} dans ${expert.prenom} ${expert.nom}`);
      }
    });
  }
  
  // Vérifier la ville
  if (criteria.ville && expert.ville && expert.ville.toLowerCase().includes(criteria.ville.toLowerCase())) {
    score += 20; // Forte priorité au critère géographique
    console.log(`🎯 Match ville: +20 points pour ${criteria.ville} dans ${expert.prenom} ${expert.nom}`);
  }
  
  // Vérifier les services
  if (criteria.service && expert.services) {
    const serviceKeywords = criteria.service.toLowerCase().split(/\s+/);
    const servicesText = JSON.stringify(expert.services).toLowerCase();
    
    console.log(`🔍 Vérification services pour ${expert.prenom} ${expert.nom}:`);
    console.log(`   - Services: ${JSON.stringify(expert.services).substring(0, 100)}...`);
    console.log(`   - Recherche: ${criteria.service}`);
    
    serviceKeywords.forEach(keyword => {
      // Match dans le JSON des services
      if (servicesText.includes(keyword)) {
        score += 15;
        console.log(`🎯 Match services JSON: +15 points pour ${keyword} dans ${expert.prenom} ${expert.nom}`);
        
        // Bonus si le mot-clé correspond exactement à une clé de service
        if (expert.services && typeof expert.services === 'object') {
          Object.keys(expert.services).forEach(serviceKey => {
            if (serviceKey.toLowerCase().includes(keyword)) {
              score += 10; // Bonus supplémentaire pour match exact sur un service
              console.log(`🎯 Match exact service: +10 points pour ${keyword} dans clé ${serviceKey}`);
            }
          });
        }
      }
    });
  }
  
  console.log(`🏆 Score final pour ${expert.prenom} ${expert.nom}: ${score} points`);
  return score;
};

const handleExpertSearch = async (input: ExpertSearchRequest, llm: BaseChatModel) => {
  try {
    // 1. Analyse de la requête via LLM pour extraire l'expertise, la ville et le service
    const expertSearchChain = createExpertSearchChain(llm);
    const result = await expertSearchChain.invoke({
      query: input.query,
      chat_history: input.chat_history || []
    }) as ExpertSearchResponse;

    return result;

  } catch (error) {
    console.error('❌ Erreur dans handleExpertSearch:', error);
    return {
      experts: [],
      synthese: "Une erreur est survenue."
    };
  }
};

export default handleExpertSearch;