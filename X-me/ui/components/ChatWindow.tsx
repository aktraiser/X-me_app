'use client';

import { useEffect, useRef, useState } from 'react';
import { Document } from '@langchain/core/documents';
import Navbar from './Navbar';
import Chat from './Chat';
import EmptyChat from './EmptyChat';
import crypto from 'crypto';
import { toast } from 'sonner';
import { useSearchParams } from 'next/navigation';
import { getSuggestions, Expert } from '@/lib/actions';
import Error from 'next/error';
import { useAuth, useSession } from '@clerk/nextjs';
import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';

// Logs de débogage
console.log('[DEBUG ChatWindow] Composant chargé');
console.log('[DEBUG ChatWindow] URL WebSocket:', process.env.NEXT_PUBLIC_WS_URL);
console.log('[DEBUG ChatWindow] URL API:', process.env.NEXT_PUBLIC_API_URL);

export type Message = {
  messageId: string;
  chatId: string;
  createdAt: Date;
  content: string;
  role: 'user' | 'assistant';
  suggestions?: string[];
  suggestedExperts?: Expert[];
  sources?: Document[];
};

export interface File {
  fileName: string;
  fileExtension: string;
  fileId: string;
}

export interface ResearchActivity {
  type: string;
  status: string;
  message: string;
  timestamp: string;
  depth: number;
  maxDepth?: number;
}

// Ajouter une déclaration d'interface pour étendre la définition de Window
interface ExtendedWindow extends Window {
  Clerk?: {
    session: {
      getToken: (options: { template: string }) => Promise<string>;
    };
  };
}

// Fonction pour obtenir le jeton JWT Clerk pour Supabase
const getSupabaseSession = async () => {
  try {
    // Utiliser la méthode window.Clerk si disponible
    if (typeof window !== 'undefined' && (window as ExtendedWindow).Clerk) {
      const token = await (window as ExtendedWindow).Clerk!.session.getToken({ template: "supabase" });
      return token;
    }
    
    // Sinon essayer via une API
    const session = await fetch('/api/clerk/session').then(r => r.json());
    if (session && session.getToken) {
      return await session.getToken({ template: "supabase" });
    }
    
    return null;
  } catch (error) {
    console.error('[DEBUG] Impossible d\'obtenir le jeton Clerk:', error);
    return null;
  }
};

const useSocket = (
  url: string,
  setIsWSReady: (ready: boolean) => void,
  setError: (error: boolean) => void,
) => {
  const [ws, setWs] = useState<WebSocket | null>(null);

  useEffect(() => {
    if (!ws) {
      const connectWs = async () => {
        console.log('[DEBUG WebSocket] Tentative de connexion à:', url);
        let chatModel = localStorage.getItem('chatModel');
        let chatModelProvider = localStorage.getItem('chatModelProvider');
        let embeddingModel = localStorage.getItem('embeddingModel');
        let embeddingModelProvider = localStorage.getItem(
          'embeddingModelProvider',
        );

        try {
          console.log('[DEBUG WebSocket] Récupération des modèles depuis:', `${process.env.NEXT_PUBLIC_API_URL}/models`);
          const providers = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/models`,
            {
              headers: {
                'Content-Type': 'application/json',
              },
            },
          ).then(async (res) => await res.json());
          
          console.log('[DEBUG WebSocket] Modèles récupérés:', providers);

          if (
            !chatModel ||
            !chatModelProvider ||
            !embeddingModel ||
            !embeddingModelProvider
          ) {
            if (!chatModel || !chatModelProvider) {
              const chatModelProviders = providers.chatModelProviders;

              // Forcer l'utilisation de 'openai' au lieu de custom_openai
              chatModelProvider = 'openai';
              console.log('[DEBUG WebSocket] Fournisseur forcé à:', chatModelProvider);

              // Sélectionner un modèle disponible
              chatModel = Object.keys(chatModelProviders[chatModelProvider])[0];
              console.log('[DEBUG WebSocket] Modèle forcé à:', chatModel);
              
              if (
                !chatModelProviders ||
                Object.keys(chatModelProviders).length === 0
              )
                return toast.error('No chat models available');
            }

            if (!embeddingModel || !embeddingModelProvider) {
              const embeddingModelProviders = providers.embeddingModelProviders;

              if (
                !embeddingModelProviders ||
                Object.keys(embeddingModelProviders).length === 0
              )
                return toast.error('No embedding models available');

              embeddingModelProvider = Object.keys(embeddingModelProviders)[0];
              embeddingModel = Object.keys(
                embeddingModelProviders[embeddingModelProvider],
              )[0];
            }

            localStorage.setItem('chatModel', chatModel!);
            localStorage.setItem('chatModelProvider', chatModelProvider);
            localStorage.setItem('embeddingModel', embeddingModel!);
            localStorage.setItem(
              'embeddingModelProvider',
              embeddingModelProvider,
            );
          } else {
            const chatModelProviders = providers.chatModelProviders;
            const embeddingModelProviders = providers.embeddingModelProviders;

            if (
              Object.keys(chatModelProviders).length > 0 &&
              !chatModelProviders[chatModelProvider]
            ) {
              chatModelProvider = Object.keys(chatModelProviders)[0];
              localStorage.setItem('chatModelProvider', chatModelProvider);
            }

            if (
              chatModelProvider &&
              chatModelProvider != 'custom_openai' &&
              !chatModelProviders[chatModelProvider][chatModel]
            ) {
              chatModel = Object.keys(chatModelProviders[chatModelProvider])[0];
              localStorage.setItem('chatModel', chatModel);
            }

            if (
              Object.keys(embeddingModelProviders).length > 0 &&
              !embeddingModelProviders[embeddingModelProvider]
            ) {
              embeddingModelProvider = Object.keys(embeddingModelProviders)[0];
              localStorage.setItem(
                'embeddingModelProvider',
                embeddingModelProvider,
              );
            }

            if (
              embeddingModelProvider &&
              !embeddingModelProviders[embeddingModelProvider][embeddingModel]
            ) {
              embeddingModel = Object.keys(
                embeddingModelProviders[embeddingModelProvider],
              )[0];
              localStorage.setItem('embeddingModel', embeddingModel);
            }
          }

          const wsURL = new URL(url);
          const searchParams = new URLSearchParams({});

          searchParams.append('chatModel', chatModel!);
          searchParams.append('chatModelProvider', chatModelProvider);

          if (chatModelProvider === 'custom_openai') {
            searchParams.append(
              'openAIApiKey',
              localStorage.getItem('openAIApiKey')!,
            );
            searchParams.append(
              'openAIBaseURL',
              localStorage.getItem('openAIBaseURL')!,
            );
          }

          searchParams.append('embeddingModel', embeddingModel!);
          searchParams.append('embeddingModelProvider', embeddingModelProvider);

          wsURL.search = searchParams.toString();
          
          console.log('[DEBUG WebSocket] URL finale:', wsURL.toString());

          const ws = new WebSocket(wsURL.toString());

          // Augmentation du timeout à 30 secondes
          const timeoutId = setTimeout(() => {
            if (ws.readyState !== 1) {
              console.error('[DEBUG WebSocket] Échec de connexion après 30 secondes');
              toast.error(
                'Failed to connect to the server. Please try again later.',
              );
            }
          }, 30000);

          ws.addEventListener('message', (e) => {
            const data = JSON.parse(e.data);
            console.log('[DEBUG WebSocket] Message reçu:', data);
            if (data.type === 'signal' && data.data === 'open') {
              const interval = setInterval(() => {
                if (ws.readyState === 1) {
                  console.log('[DEBUG WebSocket] Connexion établie avec succès');
                  setIsWSReady(true);
                  clearInterval(interval);
                }
              }, 5);
              clearTimeout(timeoutId);
              console.log('[DEBUG] opened');
            }
            if (data.type === 'error') {
              console.error('[DEBUG WebSocket] Erreur reçue:', data.data);
              toast.error(data.data);
            }
          });

          ws.onerror = (event) => {
            console.error('[DEBUG WebSocket] Erreur de connexion:', event);
            clearTimeout(timeoutId);
            setError(true);
            toast.error('WebSocket connection error.');
          };

          ws.onopen = () => {
            console.log('[DEBUG WebSocket] Connexion ouverte');
          };

          ws.onclose = (event) => {
            console.error('[DEBUG WebSocket] Connexion fermée:', event.code, event.reason);
            clearTimeout(timeoutId);
            setError(true);
            console.log('[DEBUG] closed');
          };

          setWs(ws);
        } catch (error: any) {
          console.error('[DEBUG WebSocket] Erreur lors de la configuration:', error);
          setError(true);
          toast.error(`Error setting up WebSocket: ${error.message}`);
        }
      };

      connectWs();
    }
  }, [ws, url, setIsWSReady, setError]);

  return ws;
};

const loadMessages = async (
  chatId: string,
  setMessages: (messages: Message[]) => void,
  setIsMessagesLoaded: (loaded: boolean) => void,
  setChatHistory: (history: [string, string][]) => void,
  setFocusMode: (mode: string) => void,
  setNotFound: (notFound: boolean) => void,
  setFiles: (files: File[]) => void,
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

  // Obtenir un jeton JWT pour Supabase
  const authToken = await getSupabaseSession();

  // Vérifier si une version complète de la conversation existe dans Supabase
  try {
    // Créer un client Supabase
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false,
        },
        global: {
          headers: authToken ? {
            Authorization: `Bearer ${authToken}`
          } : {},
        },
      }
    );

    // Récupérer la conversation complète depuis Supabase
    const { data: supabaseData, error } = await supabase
      .from('chats')
      .select('*')
      .eq('id', chatId)
      .single();

    if (!error && supabaseData && supabaseData.metadata?.complete_conversation) {
      console.log('[DEBUG] Conversation complète récupérée depuis Supabase');
      
      // Utiliser la conversation complète depuis Supabase
      const completeMessages = supabaseData.metadata.complete_conversation.map((msg: any) => {
        // S'assurer que les propriétés cruciales sont présentes
        const message = {
          ...msg,
          chatId: chatId,
          createdAt: msg.createdAt ? new Date(msg.createdAt) : new Date(),
          // Garantir que les sources sont correctement formatées
          sources: Array.isArray(msg.sources) ? msg.sources.map((source: any) => {
            // Assurer la structure correcte de chaque source
            if (typeof source === 'object') {
              return {
                pageContent: source.pageContent || '',
                metadata: source.metadata || {}
              };
            }
            return source;
          }) : undefined,
          // Garantir que les suggestions sont présentes
          suggestions: msg.suggestions || [],
          // Garantir que les experts suggérés sont présents
          suggestedExperts: msg.suggestedExperts || []
        };
        
        console.log("[DEBUG] Message restauré avec sources:", message);
        return message as Message;
      });

      setMessages(completeMessages);

      const history = completeMessages.map((msg: Message) => {
        return [msg.role === 'user' ? 'human' : 'assistant', msg.content];
      }) as [string, string][];

      setChatHistory(history);
      setFocusMode(supabaseData.metadata?.focus_mode || 'webSearch');
      document.title = completeMessages[0]?.content?.slice(0, 100) || 'Conversation';
      setIsMessagesLoaded(true);
      
      // Charger les fichiers s'ils existent
      if (data.chat && data.chat.files) {
        const files = data.chat.files.map((file: any) => {
          return {
            fileName: file.name,
            fileExtension: file.name.split('.').pop(),
            fileId: file.fileId,
          };
        });

        setFiles(files);
        setFileIds(files.map((file: File) => file.fileId));
      }
      
      return;
    }
  } catch (error) {
    console.error('[DEBUG] Erreur lors de la récupération depuis Supabase:', error);
    // Continuer avec l'approche standard si la récupération depuis Supabase échoue
  }

  // Fallback à l'approche standard si les données Supabase ne sont pas disponibles
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

  console.log('[DEBUG] messages loaded');

  document.title = messages[0].content;

  const files = data.chat.files.map((file: any) => {
    return {
      fileName: file.name,
      fileExtension: file.name.split('.').pop(),
      fileId: file.fileId,
    };
  });

  setFiles(files);
  setFileIds(files.map((file: File) => file.fileId));

  setChatHistory(history);
  setFocusMode(data.chat.focusMode);
  setIsMessagesLoaded(true);
};

const ChatWindow = ({ id, defaultFocusMode }: { id?: string; defaultFocusMode?: string }) => {
  console.log('[DEBUG ChatWindow] Exécution du composant avec les props:', { id, defaultFocusMode });
  
  const searchParams = useSearchParams();
  const initialMessage = searchParams.get('q');
  const { userId } = useAuth();
  const { session } = useSession();

  // Initialisation du client Supabase - création d'une seule instance
  const supabase = useRef(
    createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
    )
  ).current;

  const [chatId, setChatId] = useState<string | undefined>(id);
  const [newChatCreated, setNewChatCreated] = useState(false);

  const [hasError, setHasError] = useState(false);
  const [isReady, setIsReady] = useState(false);

  const [isWSReady, setIsWSReady] = useState(false);
  const ws = useSocket(
    process.env.NEXT_PUBLIC_WS_URL!,
    setIsWSReady,
    setHasError,
  );

  const [loading, setLoading] = useState(false);
  const [messageAppeared, setMessageAppeared] = useState(false);
  const [researchActivities, setResearchActivities] = useState<ResearchActivity[]>([]);

  const [chatHistory, setChatHistory] = useState<[string, string][]>([]);
  const [messages, setMessages] = useState<Message[]>([]);

  const [files, setFiles] = useState<File[]>([]);
  const [fileIds, setFileIds] = useState<string[]>([]);

  const [focusMode, setFocusMode] = useState(defaultFocusMode || 'webSearch');
  const [optimizationMode, setOptimizationMode] = useState('speed');

  const [isMessagesLoaded, setIsMessagesLoaded] = useState(false);

  const [notFound, setNotFound] = useState(false);

  // Sauvegarder la conversation dans Supabase
  const saveConversationToSupabase = async (chatData: any) => {
    try {
      if (!chatData || !chatData.id) return;
      
      console.log('[DEBUG] Sauvegarde de la conversation dans Supabase:', chatData);
      
      // Extraire le contenu du premier message utilisateur pour le titre
      let title = "Nouvelle conversation";
      let content = "";
      
      if (messages.length > 0) {
        const userMessages = messages.filter(msg => msg.role === 'user');
        if (userMessages.length > 0) {
          // Utiliser le premier message de l'utilisateur comme titre
          title = userMessages[0].content.slice(0, 100);
          
          // Extraire le contenu du dernier message assistant pour le résumé
          const assistantMessages = messages.filter(msg => msg.role === 'assistant');
          if (assistantMessages.length > 0) {
            content = assistantMessages[assistantMessages.length - 1].content.slice(0, 200);
          }
        }
      }

      // Préparer la liste complète des messages pour le stockage
      const completeConversation = messages.map(msg => {
        // Log pour vérifier les sources avant de les sauvegarder
        if (msg.sources && msg.sources.length > 0) {
          console.log('[DEBUG] Sources trouvées pour le message', msg.messageId, ':', msg.sources);
        }
        
        return {
          role: msg.role,
          content: msg.content,
          messageId: msg.messageId,
          createdAt: msg.createdAt,
          sources: msg.sources,
          suggestions: msg.suggestions,
          suggestedExperts: msg.suggestedExperts
        };
      });
      
      // Obtenir un jeton JWT de Clerk pour l'utilisateur actuel
      let authToken = null;
      if (userId) {
        try {
          // Obtenir le jeton JWT via la session Clerk avec le template "supabase"
          authToken = await session?.getToken({ template: "supabase" });
          console.log('[DEBUG] Jeton Clerk obtenu pour Supabase');
        } catch (error) {
          console.error('[DEBUG] Impossible d\'obtenir le jeton Clerk:', error);
        }
      }
      
      // Créer un client Supabase avec authentification JWT
      const clientWithAuth = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL || '',
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
        {
          auth: {
            persistSession: false,
            autoRefreshToken: false,
            detectSessionInUrl: false,
          },
          global: {
            headers: authToken ? {
              Authorization: `Bearer ${authToken}`
            } : {},
          },
        }
      );
      
      // Préparer les données à sauvegarder
      const chatToSave = {
        id: chatData.id,
        title: title,
        created_at: new Date().toISOString(),
        user_id: uuidv4(),
        content: content || '',
        metadata: {
          clerk_user_id: userId,
          focus_mode: focusMode,
          complete_conversation: completeConversation
        }
      };
      
      // Sauvegarder ou mettre à jour dans Supabase
      const { error } = await clientWithAuth
        .from('chats')
        .upsert(chatToSave, { onConflict: 'id' });
      
      if (error) throw error;
      
      console.log('[DEBUG] Conversation sauvegardée avec succès dans Supabase');
    } catch (error) {
      console.error('[DEBUG] Erreur lors de la sauvegarde dans Supabase:', error);
    }
  };

  useEffect(() => {
    if (
      chatId &&
      !newChatCreated &&
      !isMessagesLoaded &&
      messages.length === 0
    ) {
      loadMessages(
        chatId,
        setMessages,
        setIsMessagesLoaded,
        setChatHistory,
        setFocusMode,
        setNotFound,
        setFiles,
        setFileIds,
      );
    } else if (!chatId) {
      setNewChatCreated(true);
      setIsMessagesLoaded(true);
      // Utiliser uuidv4() au lieu de crypto.randomBytes
      const newChatId = uuidv4();
      setChatId(newChatId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sauvegarder la conversation dans Supabase quand les messages changent
  useEffect(() => {
    if (chatId && messages.length > 0) {
      saveConversationToSupabase({
        id: chatId,
        focusMode: focusMode
      });
    }
  }, [messages, chatId, focusMode]);

  useEffect(() => {
    return () => {
      if (ws?.readyState === 1) {
        ws.close();
        console.log('[DEBUG] closed');
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const messagesRef = useRef<Message[]>([]);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    if (isMessagesLoaded && isWSReady) {
      setIsReady(true);
      console.log('[DEBUG] ready');
    }
  }, [isMessagesLoaded, isWSReady]);

  const sendMessage = async (message: string, messageId?: string) => {
    if (loading) return;

    setLoading(true);
    setMessageAppeared(false);
    setResearchActivities([]);

    let sources: Document[] | undefined = undefined;
    let recievedMessage = '';
    let added = false;

    // Utiliser uuidv4 pour générer un ID valide au format UUID
    messageId = messageId ?? uuidv4();

    ws?.send(
      JSON.stringify({
        type: 'message',
        message: {
          messageId: messageId,
          chatId: chatId!,
          content: message,
          user_id: userId
        },
        files: fileIds,
        focusMode: focusMode,
        optimizationMode: optimizationMode,
        history: [...chatHistory, ['human', message]],
      }),
    );

    setMessages((prevMessages) => [
      ...prevMessages,
      {
        content: message,
        messageId: messageId,
        chatId: chatId!,
        role: 'user',
        createdAt: new Date(),
      },
    ]);

    const messageHandler = async (e: MessageEvent) => {
      const data = JSON.parse(e.data);

      if (data.type === 'error') {
        toast.error(data.data);
        setLoading(false);
        return;
      }

      if (data.type === 'images') {
        if (!added) {
          setMessages((prevMessages) => [
            ...prevMessages,
            {
              content: '',
              messageId: data.messageId,
              chatId: chatId!,
              role: 'assistant',
              sources: [{ 
                pageContent: '',
                metadata: { 
                  illustrationImage: data.data[0]?.src,
                  title: data.data[0]?.title
                }
              }],
              createdAt: new Date(),
            },
          ]);
          added = true;
        }
        setMessageAppeared(true);
      }

      if (data.type === 'sources') {
        if (!added) {
          setMessages((prevMessages) => [
            ...prevMessages,
            {
              content: '',
              messageId: data.messageId,
              chatId: chatId!,
              role: 'assistant',
              sources: data.data,
              createdAt: new Date(),
            },
          ]);
          added = true;
        } else {
          setMessages((prev) =>
            prev.map((message) => {
              if (message.messageId === data.messageId) {
                return { ...message, sources: data.data };
              }
              return message;
            }),
          );
        }
        setMessageAppeared(true);
      }

      if (data.type === 'message') {
        if (!added) {
          setMessages((prevMessages) => [
            ...prevMessages,
            {
              content: data.data,
              messageId: data.messageId,
              chatId: chatId!,
              role: 'assistant',
              sources: sources,
              createdAt: new Date(),
            },
          ]);
          added = true;
        }

        setMessages((prev) =>
          prev.map((message) => {
            if (message.messageId === data.messageId) {
              return { ...message, content: message.content + data.data };
            }

            return message;
          }),
        );

        recievedMessage += data.data;
        setMessageAppeared(true);
      }

      if (data.type === 'messageEnd') {
        setChatHistory((prevHistory) => [
          ...prevHistory,
          ['human', message],
          ['assistant', recievedMessage],
        ]);

        ws?.removeEventListener('message', messageHandler);
        setLoading(false);

        const lastMsg = messagesRef.current[messagesRef.current.length - 1];

        if (
          lastMsg.role === 'assistant' &&
          lastMsg.sources &&
          lastMsg.sources.length > 0 &&
          !lastMsg.suggestions
        ) {
          const { suggestions, suggestedExperts } = await getSuggestions(messagesRef.current);
          setMessages((prev) =>
            prev.map((msg) => {
              if (msg.messageId === lastMsg.messageId) {
                return { 
                  ...msg, 
                  suggestions: suggestions,
                  suggestedExperts: suggestedExperts
                };
              }
              return msg;
            }),
          );
        }
      }

      if (data.type === 'researchActivity') {
        console.log('🔍🔍 ChatWindow - Activité de recherche reçue:', data.data);
        setResearchActivities(prev => {
          const newActivities = [...prev, data.data];
          console.log('🔍🔍 Total activités après mise à jour:', newActivities.length);
          return newActivities;
        });
        setMessageAppeared(true);
      }
    };

    ws?.addEventListener('message', messageHandler);
  };

  const rewrite = (messageId: string) => {
    const index = messages.findIndex((msg) => msg.messageId === messageId);

    if (index === -1) return;

    const message = messages[index - 1];

    setMessages((prev) => {
      return [...prev.slice(0, messages.length > 2 ? index - 1 : 0)];
    });
    setChatHistory((prev) => {
      return [...prev.slice(0, messages.length > 2 ? index - 1 : 0)];
    });

    sendMessage(message.content, message.messageId);
  };

  useEffect(() => {
    if (isReady && initialMessage && ws?.readyState === 1) {
      sendMessage(initialMessage);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ws?.readyState, isReady, initialMessage, isWSReady]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const event = new CustomEvent('firecrawlActivitiesUpdate', { 
        detail: { 
          activities: researchActivities,
          isSearching: loading && researchActivities.length > 0
        } 
      });
      window.dispatchEvent(event);
    }
  }, [researchActivities, loading]);

  if (hasError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <p className="dark:text-white/70 text-black/70 text-sm">
          Failed to connect to the server. Please try again later.
        </p>
      </div>
    );
  }

  return isReady ? (
    notFound ? (
      <Error statusCode={404} />
    ) : (
      <div>
        {messages.length > 0 ? (
          <>
            <Navbar chatId={chatId!} messages={messages} />
            <Chat
              loading={loading}
              messages={messages}
              sendMessage={sendMessage}
              messageAppeared={messageAppeared}
              rewrite={rewrite}
              fileIds={fileIds}
              setFileIds={setFileIds}
              files={files}
              setFiles={setFiles}
              researchActivities={researchActivities}
            />
          </>
        ) : (
          <EmptyChat
            sendMessage={sendMessage}
            focusMode={focusMode}
            setFocusMode={setFocusMode}
            optimizationMode={optimizationMode}
            setOptimizationMode={setOptimizationMode}
            fileIds={fileIds}
            setFileIds={setFileIds}
            files={files}
            setFiles={setFiles}
          />
        )}
      </div>
    )
  ) : (
    <div className="flex flex-row items-center justify-center min-h-screen">
      <svg
        aria-hidden="true"
        className="w-8 h-8 text-light-200 fill-light-secondary dark:text-[#202020] animate-spin dark:fill-[#ffffff3b]"
        viewBox="0 0 100 101"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M100 50.5908C100.003 78.2051 78.1951 100.003 50.5908 100C22.9765 99.9972 0.997224 78.018 1 50.4037C1.00281 22.7993 22.8108 0.997224 50.4251 1C78.0395 1.00281 100.018 22.8108 100 50.4251ZM9.08164 50.594C9.06312 73.3997 27.7909 92.1272 50.5966 92.1457C73.4023 92.1642 92.1298 73.4365 92.1483 50.6308C92.1669 27.8251 73.4392 9.0973 50.6335 9.07878C27.8278 9.06026 9.10003 27.787 9.08164 50.594Z"
          fill="currentColor"
        />
        <path
          d="M93.9676 39.0409C96.393 38.4037 97.8624 35.9116 96.9801 33.5533C95.1945 28.8227 92.871 24.3692 90.0681 20.348C85.6237 14.1775 79.4473 9.36872 72.0454 6.45794C64.6435 3.54717 56.3134 2.65431 48.3133 3.89319C45.869 4.27179 44.3768 6.77534 45.014 9.20079C45.6512 11.6262 48.1343 13.0956 50.5786 12.717C56.5073 11.8281 62.5542 12.5399 68.0406 14.7911C73.527 17.0422 78.2187 20.7487 81.5841 25.4923C83.7976 28.5886 85.4467 32.059 86.4416 35.7474C87.1273 38.1189 89.5423 39.6781 91.9676 39.0409Z"
          fill="currentFill"
        />
      </svg>
    </div>
  );
};

export default ChatWindow;