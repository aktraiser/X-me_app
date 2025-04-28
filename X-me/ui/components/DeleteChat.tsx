import { Trash } from 'lucide-react';
import { Fragment, useState } from 'react';
import { toast } from 'sonner';
import { Chat } from '@/app/library/page';
import { createClient } from '@supabase/supabase-js';
import { useAuth, useSession } from '@clerk/nextjs';
import ConfirmationDialog from './ConfirmationDialog';

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
        // Obtenir un jeton JWT de Clerk pour l'utilisateur actuel avec le template spécifique pour Supabase
        const authToken = await session?.getToken({ template: "supabase" });
        if (authToken) {
          console.log('[DEBUG] Jeton Clerk obtenu pour Supabase (suppression) avec template supabase');
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

  const handleConfirmationClose = (confirmed: boolean) => {
    if (confirmed && !loading) {
      handleDelete();
    } else {
      setConfirmationDialogOpen(false);
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
      
      <ConfirmationDialog
        title="Confirmation de suppression"
        description="Êtes-vous sûr de vouloir supprimer cette conversation ?"
        confirmButtonText="Supprimer"
        open={confirmationDialogOpen}
        onClose={handleConfirmationClose}
        isProcessing={loading}
        dangerConfirm={true}
      />
    </>
  );
};

export default DeleteChat;
