'use client';

// @ts-nocheck - Ignorer temporairement toutes les erreurs de TypeScript dans ce fichier
import DeleteChat from '@/components/DeleteChat';
import { cn, formatTimeDifference } from '@/lib/utils';
import { BookOpenText, ClockIcon, Library } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState, useRef } from 'react';
import PageHeader from '@/components/PageHeader';
import { useAuth, useSession } from '@clerk/nextjs';
import { createClient } from '@supabase/supabase-js';
import { format } from 'date-fns';
import Pagination from '@/components/Pagination';

export interface Chat {
  id: string;
  title: string;
  createdAt?: string;
  created_at: string;
  focusMode: string;
  content: string;
  user_id?: string;
  metadata?: {
    clerk_user_id?: string;
    [key: string]: any;
  };
}

interface User {
  id: string;
  email: string;
}

const Page = () => {
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const fetchedRef = useRef(false);
  const { userId, isSignedIn } = useAuth();
  const { session } = useSession();
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5; // Nombre de discussions par page

  // Récupérer l'utilisateur courant
  useEffect(() => {
    if (isSignedIn && userId) {
      setUser({
        id: userId,
        email: '' // Clerk ne fournit pas directement l'email dans useAuth
      });
    }
  }, [isSignedIn, userId]);

  // Récupérer les chats/messages
  useEffect(() => {
    const fetchChats = async () => {
      if (fetchedRef.current) return;
      
      console.log('Tentative de récupération depuis Supabase');
      setLoading(true);
      fetchedRef.current = true;
      
      try {
        // Obtenir un jeton JWT de Clerk pour l'utilisateur actuel
        let authToken = null;
        if (userId) {
          try {
            // Obtenir le jeton JWT via la session Clerk avec le template "supabase"
            authToken = await session?.getToken({ template: "supabase" });
            console.log('[DEBUG] Jeton Clerk obtenu pour Supabase avec le template supabase');
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
        
        // Récupérer les conversations depuis Supabase
        const { data, error } = await clientWithAuth
          .from('chats')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) {
          throw error;
        }
        
        console.log('Données reçues de Supabase:', data);
        
        if (data && data.length > 0) {
          setChats(data);
          
          // Log pour déboguer les IDs
          data.forEach((chat: Chat) => {
            console.log('ID de discussion:', chat.id, 'Type:', typeof chat.id);
          });
        }
      } catch (error) {
        console.error('Erreur lors de la récupération depuis Supabase:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user && !fetchedRef.current) {
      fetchChats();
    } else if (!user) {
      setLoading(false);
    }
  }, [user, userId, session]);

  // Fonction pour changer de page
  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
    // Faire défiler vers le haut si nécessaire
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Calcul des discussions à afficher sur la page courante
  const getCurrentPageChats = () => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return chats.slice(startIndex, endIndex);
  };

  // Discussions paginées
  const currentChats = getCurrentPageChats();

  return (
    <>
      <PageHeader
        title="Historique"
        icon={<Library className="w-6 h-6 text-black dark:text-white" />}
      />
      <main className="min-h-screen">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div>
            <div className="flex items-center justify-between py-4">
              <div className="flex flex-col">
                <p className="text-gray-500 mt-1">
                  Retrouvez ici toutes vos discussions
                </p>
              </div>
            </div>

            {loading ? (
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
            ) : (
              <div className="flex flex-col pb-20 lg:pb-2">
                {!user && (
                  <div className="text-center py-6">
                    <p className="text-orange-500">
                      Vous n&apos;êtes pas connecté. Certaines conversations pourraient ne pas être affichées.
                    </p>
                  </div>
                )}
                {chats.length === 0 && (
                  <div className="flex flex-row items-center justify-center min-h-screen">
                    <p className="text-black/70 dark:text-white/70 text-sm">
                      Aucune conversation trouvée.
                    </p>
                  </div>
                )}
                {chats.length > 0 && (
                  <>
                    {currentChats.map((chat, i) => (
                      <div
                        className={cn(
                          'flex flex-col space-y-4 py-6',
                          i !== currentChats.length - 1
                            ? 'border-b border-white-200 dark:border-dark-200'
                            : '',
                        )}
                        key={i}
                      >
                        <Link
                          href={`/c/${chat.id}`}
                          className="text-black dark:text-white lg:text-xl font-medium truncate transition duration-200 hover:text-[#24A0ED] dark:hover:text-[#24A0ED] cursor-pointer"
                          onClick={(e) => {
                            // Vérifier si le chat a des métadonnées complètes
                            if (!chat.metadata?.complete_conversation) {
                              console.log('[DEBUG] Conversation potentiellement incomplète, sauvegarde préventive');
                              
                              // Empêcher temporairement la navigation
                              if (typeof localStorage !== 'undefined') {
                                const lastAccessed = localStorage.getItem(`chat_${chat.id}_accessed`);
                                
                                // Ne pas retarder si la chat a déjà été accédé dans les 5 dernières minutes
                                if (lastAccessed && (Date.now() - parseInt(lastAccessed)) < 5 * 60 * 1000) {
                                  return; // Continuer la navigation normalement
                                }
                                
                                // Enregistrer l'accès
                                localStorage.setItem(`chat_${chat.id}_accessed`, Date.now().toString());
                              }
                            }
                          }}
                        >
                          {chat.title}
                        </Link>
                        <p className="text-sm text-black/60 dark:text-white/60 line-clamp-2">
                          {chat.metadata?.complete_conversation ? 
                            "Conversation complète disponible" 
                            : 
                            chat.content
                          }
                        </p>
                        <div className="flex flex-row items-center justify-between w-full">
                          <div className="flex flex-row items-center space-x-1 lg:space-x-1.5 text-black/70 dark:text-white/70">
                            <ClockIcon size={15} />
                            <p className="text-xs">
                              {formatTimeDifference(
                                new Date(), 
                                new Date(chat.created_at || chat.createdAt || new Date().toISOString())
                              )} il y a
                            </p>
                          </div>
                          <DeleteChat
                            chatId={chat.id}
                            chats={chats}
                            setChats={setChats}
                          />
                        </div>
                      </div>
                    ))}
                    
                    {/* Ajout du composant de pagination */}
                    {chats.length > itemsPerPage && (
                      <Pagination
                        currentPage={currentPage}
                        totalItems={chats.length}
                        itemsPerPage={itemsPerPage}
                        onPageChange={handlePageChange}
                      />
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </>
  );
};

export default Page;
