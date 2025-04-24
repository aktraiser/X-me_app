import { Trash } from 'lucide-react';
import {
  Description,
  Dialog,
  DialogBackdrop,
  DialogPanel,
  DialogTitle,
  Transition,
  TransitionChild,
} from '@headlessui/react';
import { Fragment, useState } from 'react';
import { toast } from 'sonner';
import { Chat } from '@/app/library/page';
import { createClient } from '@supabase/supabase-js';
import { useAuth, useSession } from '@clerk/nextjs';
import { v4 as uuidv4 } from 'uuid';

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

const DeleteChat = ({
  chatId,
  chats,
  setChats,
  redirect = false,
}: {
  chatId: string;
  chats: Chat[];
  setChats: (chats: Chat[]) => void;
  redirect?: boolean;
}) => {
  const [confirmationDialogOpen, setConfirmationDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { userId } = useAuth();
  const { session } = useSession();

  const handleDelete = async () => {
    setLoading(true);
    try {
      // Supprimer de l'API
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/chats/${chatId}`,
        {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
        },
      );

      if (res.status != 200) {
        throw new Error('Échec de la suppression depuis l\'API');
      }

      // Supprimer également de Supabase avec JWT auth
      try {
        // Obtenir un jeton JWT de Clerk pour l'utilisateur actuel
        const authToken = await getSupabaseSession();
        if (authToken) {
          console.log('[DEBUG] Jeton Clerk obtenu pour Supabase (suppression)');
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

        const { error } = await clientWithAuth
          .from('chats')
          .delete()
          .eq('id', chatId);

        if (error) {
          console.error('Erreur lors de la suppression dans Supabase:', error);
          // Ne pas bloquer le processus si la suppression dans Supabase échoue
        } else {
          console.log('Conversation supprimée avec succès de Supabase');
        }
      } catch (supabaseError) {
        console.error('Exception lors de la suppression dans Supabase:', supabaseError);
        // Ne pas bloquer le processus si la suppression dans Supabase échoue
      }

      const newChats = chats.filter((chat) => chat.id !== chatId);
      setChats(newChats);

      if (redirect) {
        window.location.href = '/';
      }
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setConfirmationDialogOpen(false);
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => {
          setConfirmationDialogOpen(true);
        }}
        className="bg-transparent text-red-400 hover:scale-105 transition duration-200"
      >
        <Trash size={17} />
      </button>
      <Transition appear show={confirmationDialogOpen} as={Fragment}>
        <Dialog
          as="div"
          className="relative z-50"
          onClose={() => {
            if (!loading) {
              setConfirmationDialogOpen(false);
            }
          }}
        >
          <DialogBackdrop className="fixed inset-0 bg-black/30" />
          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <TransitionChild
                as={Fragment}
                enter="ease-out duration-200"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-100"
                leaveFrom="opacity-100 scale-200"
                leaveTo="opacity-0 scale-95"
              >
                <DialogPanel className="w-full max-w-md transform rounded-2xl bg-light-secondary dark:bg-dark-secondary border border-light-200 dark:border-dark-200 p-6 text-left align-middle shadow-xl transition-all">
                  <DialogTitle className="text-lg font-medium leading-6 dark:text-white">
                    Confirmation de suppression
                  </DialogTitle>
                  <Description className="text-sm dark:text-white/70 text-black/70">
                    Êtes-vous sûr de vouloir supprimer cette conversation ?
                  </Description>
                  <div className="flex flex-row items-end justify-end space-x-4 mt-6">
                    <button
                      onClick={() => {
                        if (!loading) {
                          setConfirmationDialogOpen(false);
                        }
                      }}
                      className="text-black/50 dark:text-white/50 text-sm hover:text-black/70 hover:dark:text-white/70 transition duration-200"
                    >
                      Annuler
                    </button>
                    <button
                      onClick={handleDelete}
                      className="text-red-400 text-sm hover:text-red-500 transition duration200"
                    >
                      Supprimer
                    </button>
                  </div>
                </DialogPanel>
              </TransitionChild>
            </div>
          </div>
        </Dialog>
      </Transition>
    </>
  );
};

export default DeleteChat;
