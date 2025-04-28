import { Message } from '@/components/ChatWindow';
import { ExpertService, ExpertServiceData } from '@/types';

export interface Expert {
  id: number;
  id_expert: string;
  nom: string;
  prenom: string;
  adresse: string;
  telephone?: number;
  pays: string;
  ville: string;
  expertises: string;
  biographie: string;
  tarif: number;
  services: any;
  created_at: string;
  image_url: string;
  logo?: string;
  url: string;
  activité?: string;
  email?: string;
  reseau?: string;
  site_web?: string;
  recommandations_count?: number;
  missions_vérifiées?: number;
  peut_venir_sur_site?: boolean;
}

export const getSuggestions = async (chatHisory: Message[], existingExperts?: Expert[]) => {
  const chatModel = localStorage.getItem('chatModel');
  const chatModelProvider = localStorage.getItem('chatModelProvider');

  const customOpenAIKey = localStorage.getItem('openAIApiKey');
  const customOpenAIBaseURL = localStorage.getItem('openAIBaseURL');
  
  // Vérifier l'URL de l'API
  console.log("🌐 Actions - URL de l'API pour /suggestions:", process.env.NEXT_PUBLIC_API_URL);

  try {
    console.log('getSuggestions appelé:', {
      chatHistoryLength: chatHisory.length,
      hasExistingExperts: !!existingExperts,
      expertsCount: existingExperts?.length || 0
    });

    // Si nous avons déjà des experts, faire seulement la requête pour les suggestions
    if (existingExperts && existingExperts.length > 0) {
      console.log('⚙️ Appel API /suggestions avec existingExperts:', existingExperts.length);
      
      try {
        const suggestionsResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/suggestions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            chatHistory: chatHisory,
            chatModel: {
              provider: chatModelProvider,
              model: chatModel,
              ...(chatModelProvider === 'custom_openai' && {
                customOpenAIKey,
                customOpenAIBaseURL,
              }),
            },
            existingExperts: existingExperts
          }),
        });

        if (!suggestionsResponse.ok) {
          console.error('❌ Erreur dans suggestionsResponse:', 
            suggestionsResponse.status, 
            suggestionsResponse.statusText
          );
          
          // Essayer de lire le corps de l'erreur
          try {
            const errorBody = await suggestionsResponse.text();
            console.error('❌ Détails de l\'erreur:', errorBody);
          } catch (e) {
            console.error('❌ Impossible de lire le corps de l\'erreur');
          }
          
          return { suggestions: [], suggestedExperts: existingExperts };
        }

        const suggestionsData = await suggestionsResponse.json();
        
        console.log('✅ Succès - Suggestions avec experts existants:', suggestionsData);
        
        const suggestions = Array.isArray(suggestionsData?.suggestions) 
          ? suggestionsData.suggestions 
          : (Array.isArray(suggestionsData?.data?.suggestions) 
              ? suggestionsData.data.suggestions 
              : []);

        console.log('🔍 Suggestions extraites:', suggestions);

        return {
          suggestions,
          suggestedExperts: existingExperts
        };
      } catch (fetchError) {
        console.error('❌ Exception lors de l\'appel API /suggestions:', fetchError);
        return { suggestions: [], suggestedExperts: existingExperts };
      }
    } 
    // Sinon, faire les deux requêtes comme avant
    else {
      console.log('⚙️ Appels API parallèles à /suggestions et /experts/suggestionexperts');
      
      try {
        const [suggestionsResponse, expertsResponse] = await Promise.all([
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/suggestions`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              chatHistory: chatHisory,
              chatModel: {
                provider: chatModelProvider,
                model: chatModel,
                ...(chatModelProvider === 'custom_openai' && {
                  customOpenAIKey,
                  customOpenAIBaseURL,
                }),
              },
            }),
          }),
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/experts/suggestionexperts`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              chatHistory: chatHisory,
              chatModel: {
                provider: chatModelProvider,
                model: chatModel,
                ...(chatModelProvider === 'custom_openai' && {
                  customOpenAIKey,
                  customOpenAIBaseURL,
                }),
              },
            }),
          })
        ]);

        // Vérification et logs détaillés pour chaque réponse
        if (!suggestionsResponse.ok) {
          console.error('❌ Erreur dans suggestionsResponse:', 
            suggestionsResponse.status, 
            suggestionsResponse.statusText
          );
          
          try {
            const errorBody = await suggestionsResponse.text();
            console.error('❌ Détails de l\'erreur suggestions:', errorBody);
          } catch (e) {
            console.error('❌ Impossible de lire le corps de l\'erreur suggestions');
          }
        }
        
        if (!expertsResponse.ok) {
          console.error('❌ Erreur dans expertsResponse:', 
            expertsResponse.status, 
            expertsResponse.statusText
          );
          
          try {
            const errorBody = await expertsResponse.text();
            console.error('❌ Détails de l\'erreur experts:', errorBody);
          } catch (e) {
            console.error('❌ Impossible de lire le corps de l\'erreur experts');
          }
        }

        if (!suggestionsResponse.ok || !expertsResponse.ok) {
          return { suggestions: [], suggestedExperts: [] };
        }

        const [suggestionsData, expertsData] = await Promise.all([
          suggestionsResponse.json(),
          expertsResponse.json()
        ]);

        console.log('✅ Succès - Réponse suggestions:', suggestionsData);
        console.log('✅ Succès - Réponse experts:', expertsData);
        
        const suggestions = Array.isArray(suggestionsData?.suggestions) 
          ? suggestionsData.suggestions 
          : (Array.isArray(suggestionsData?.data?.suggestions) 
              ? suggestionsData.data.suggestions 
              : []);

        console.log('🔍 Suggestions extraites:', suggestions);

        // Extraire et transformer les experts de la réponse API
        const suggestedExperts = Array.isArray(expertsData?.suggestedExperts) 
          ? expertsData.suggestedExperts.map((expert: any): Expert => ({
              id: expert.id || 0,
              id_expert: expert.id_expert || '',
              nom: expert.nom || '',
              prenom: expert.prenom || '',
              adresse: expert.adresse || '',
              telephone: expert.telephone || null,
              pays: expert.pays || '',
              ville: expert.ville || '',
              expertises: expert.expertises || '',
              biographie: expert.biographie || '',
              tarif: expert.tarif || 0,
              services: expert.services || {},
              created_at: expert.created_at || '',
              image_url: expert.image_url || '',
              logo: expert.logo || '',
              url: expert.url || '',
              activité: expert.activité || '',
              email: expert.email || '',
              reseau: expert.reseau || '',
              site_web: expert.site_web || ''
            }))
          : [];

        return {
          suggestions,
          suggestedExperts
        };
      } catch (fetchError) {
        console.error('❌ Exception lors des appels API parallèles:', fetchError);
        return { suggestions: [], suggestedExperts: [] };
      }
    }
  } catch (error) {
    console.error('❌ Erreur générale dans getSuggestions:', error);
    return {
      suggestions: [],
      suggestedExperts: []
    };
  }
};

export const getSuggestedExperts = async (chatHistory: Message[]) => {
  const chatModel = localStorage.getItem('chatModel');
  const chatModelProvider = localStorage.getItem('chatModelProvider');

  const customOpenAIKey = localStorage.getItem('openAIApiKey');
  const customOpenAIBaseURL = localStorage.getItem('openAIBaseURL');

  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/suggestionexperts`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      chatHistory,
      chatModel: {
        provider: chatModelProvider,
        model: chatModel,
        ...(chatModelProvider === 'custom_openai' && {
          customOpenAIKey,
          customOpenAIBaseURL,
        }),
      },
    }),
  });

  const data = await res.json();
  
  return Array.isArray(data.experts) 
    ? data.experts.map((expert: any): Expert => ({
        id: expert.id,
        id_expert: expert.id_expert,
        nom: expert.nom || '',
        prenom: expert.prenom || '',
        adresse: expert.adresse || '',
        telephone: expert.telephone || null,
        pays: expert.pays || '',
        ville: expert.ville || '',
        expertises: expert.expertises || '',
        biographie: expert.biographie || '',
        tarif: expert.tarif || 0,
        services: expert.services || {},
        created_at: expert.created_at || '',
        image_url: expert.image_url || '',
        logo: expert.logo || '',
        url: expert.url || '',
        activité: expert.activité || '',
        email: expert.email || '',
        reseau: expert.reseau || '',
        site_web: expert.site_web || ''
      }))
    : [];
};

export const loadMessages = async (
  chatId: string,
  setMessages: (messages: Message[]) => void,
  setIsMessagesLoaded: (loaded: boolean) => void,
  setChatHistory: (history: [string, string][]) => void,
  setFocusMode: (mode: string) => void,
  setNotFound: (notFound: boolean) => void,
  setFiles: (files: any[]) => void,
  setFileIds: (fileIds: string[]) => void,
) => {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/chats/${chatId}`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    },
  );

  if (res.status === 404) {
    setNotFound(true);
    setIsMessagesLoaded(true);
    return;
  }

  const data = await res.json();

  const messages = data.messages.map((msg: any) => {
    return {
      ...msg,
      ...JSON.parse(msg.metadata),
    };
  }) as Message[];

  setMessages(messages);

  const history = messages.map((msg) => {
    return [msg.role, msg.content];
  }) as [string, string][];

  document.title = messages[0].content;

  const files = data.chat.files.map((file: any) => {
    return {
      fileName: file.name,
      fileExtension: file.name.split('.').pop(),
      fileId: file.fileId,
    };
  });

  setFiles(files);
  setFileIds(files.map((file: any) => file.fileId));

  setChatHistory(history);
  setFocusMode(data.chat.focusMode);
  setIsMessagesLoaded(true);
};

/**
 * Crée un service d'expert au format spécifié
 */
export function createExpertService(
  data: {
    services_proposes?: string[];
    valueAddDescription?: string;
    valueAddPoints?: string[];
    results?: string[];
  }
): ExpertServiceData {
  const service: ExpertServiceData = {};
  
  // Ajouter les services proposés si fournis
  if (data.services_proposes && data.services_proposes.length > 0) {
    service.services_proposes = data.services_proposes;
  }

  // Ajouter la valeur ajoutée si des données sont fournies
  if (data.valueAddDescription || (data.valueAddPoints && data.valueAddPoints.length > 0)) {
    service.valeur_ajoutee = {
      description: data.valueAddDescription,
      points_forts: data.valueAddPoints || []
    };
  }

  // Ajouter les résultats si fournis
  if (data.results && data.results.length > 0) {
    service.resultats_apportes = data.results;
  }

  return service;
}