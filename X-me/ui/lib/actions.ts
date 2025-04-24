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

export const getSuggestions = async (chatHisory: Message[]) => {
  const chatModel = localStorage.getItem('chatModel');
  const chatModelProvider = localStorage.getItem('chatModelProvider');

  const customOpenAIKey = localStorage.getItem('openAIApiKey');
  const customOpenAIBaseURL = localStorage.getItem('openAIBaseURL');

  try {
    // Faire les deux appels en parallèle
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

    if (!suggestionsResponse.ok || !expertsResponse.ok) {
      console.error('Error in responses:', {
        suggestions: suggestionsResponse.status,
        experts: expertsResponse.status
      });
      return { suggestions: [], suggestedExperts: [] };
    }

    const [suggestionsData, expertsData] = await Promise.all([
      suggestionsResponse.json(),
      expertsResponse.json()
    ]);

    console.log('Debug - Suggestions Response:', suggestionsData);
    console.log('Debug - Experts Response:', expertsData);
    
    // Extraire les suggestions
    const suggestions = Array.isArray(suggestionsData?.suggestions) 
      ? suggestionsData.suggestions 
      : [];

    // Extraire et transformer les experts
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
  } catch (error) {
    console.error('Error fetching suggestions and experts:', error);
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