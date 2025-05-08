import { Clock, Edit, Share, Trash } from 'lucide-react';
import { Message } from './ChatWindow';
import { useEffect, useState } from 'react';
import { formatTimeDifference } from '@/lib/utils';
import DeleteChat from './DeleteChat';
import { usePathname } from 'next/navigation';

const Navbar = ({
  chatId,
  messages,
}: {
  messages: Message[];
  chatId: string;
}) => {
  const [title, setTitle] = useState<string>('');
  const [timeAgo, setTimeAgo] = useState<string>('');
  const pathname = usePathname();
  
  // Vérifier si on est sur la page d'accueil
  const isHomePage = pathname === '/';
  
  // Vérifier si une discussion est en cours (s'il y a des messages)
  const hasMessages = messages && messages.length > 0;

  useEffect(() => {
    if (messages.length > 0) {
      const newTitle =
        messages[0].content.length > 20
          ? `${messages[0].content.substring(0, 20).trim()}...`
          : messages[0].content;
      setTitle(newTitle);
      const newTimeAgo = formatTimeDifference(
        new Date(),
        messages[0].createdAt,
      );
      setTimeAgo(newTimeAgo);
    }
  }, [messages]);

  useEffect(() => {
    const intervalId = setInterval(() => {
      if (messages.length > 0) {
        const newTimeAgo = formatTimeDifference(
          new Date(),
          messages[0].createdAt,
        );
        setTimeAgo(newTimeAgo);
      }
    }, 1000);

    return () => clearInterval(intervalId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Effet pour masquer la navigation mobile de Sidebar lorsque la Navbar est présente
  useEffect(() => {
    // Sélectionnez l'élément de navigation mobile
    const mobileNavElement = document.querySelector('.fixed.top-0.left-0.right-0.w-full.z-\\[100\\].lg\\:hidden');
    
    if (mobileNavElement) {
      // Masquer l'élément de navigation mobile
      mobileNavElement.classList.add('hidden');
      
      // Restaurer l'élément lorsque ce composant est démonté
      return () => {
        if (mobileNavElement) {
          mobileNavElement.classList.remove('hidden');
        }
      };
    }
  }, []);

  // Si ce n'est pas la page d'accueil OU si une discussion est en cours, ne pas afficher la Navbar
  if (!isHomePage || hasMessages) {
    return null;
  }

  return (
    <div className="sticky top-0 z-50 w-full border-b border-dark-200 bg-light-secondary dark:bg-dark-primary rounded-t-xl">
      <div className="w-full px-4 flex items-center justify-between py-4">
        <div className="flex items-center space-x-4">
          <a
            href="/"
            className="active:scale-95 transition duration-100 cursor-pointer lg:hidden text-black/70 dark:text-white/70"
          >
            <Edit size={17} />
          </a>
          <div className="hidden lg:flex items-center space-x-2">
            <Clock size={17} className="text-black/70 dark:text-white/70" />
            <p className="text-xs text-black/70 dark:text-white/70">Il y a {timeAgo}</p>
          </div>
          <span className="hidden lg:block text-black/30 dark:text-white/30">|</span>
          <p className="hidden lg:block text-xs text-black/70 dark:text-white/70">{title}</p>
        </div>

        <div className="flex items-center space-x-4">
          <Share
            size={17}
            className="active:scale-95 transition duration-100 cursor-pointer text-black/70 dark:text-white/70"
          />
          <DeleteChat redirect chatId={chatId} chats={[]} setChats={() => {}} />
        </div>
      </div>
    </div>
  );
};

export default Navbar;
