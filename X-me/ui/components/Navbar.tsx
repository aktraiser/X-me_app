import { Clock, Edit, Share, Trash } from 'lucide-react';
import { Message } from './ChatWindow';
import { useEffect, useState } from 'react';
import { formatTimeDifference } from '@/lib/utils';
import DeleteChat from './DeleteChat';

const Navbar = ({
  chatId,
  messages,
}: {
  messages: Message[];
  chatId: string;
}) => {
  const [title, setTitle] = useState<string>('');
  const [timeAgo, setTimeAgo] = useState<string>('');

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

  return (
    <div className="sticky top-0 z-50 w-full border-b border-dark-200 bg-dark-primary rounded-t-xl">
      <div className="w-full px-4 flex items-center justify-between py-4">
        <div className="flex items-center space-x-4">
          <a
            href="/"
            className="active:scale-95 transition duration-100 cursor-pointer lg:hidden"
          >
            <Edit size={17} />
          </a>
          <div className="hidden lg:flex items-center space-x-2">
            <Clock size={17} />
            <p className="text-xs text-white/70">Il y a {timeAgo}</p>
          </div>
          <span className="hidden lg:block text-white/30">|</span>
          <p className="hidden lg:block text-xs text-white/70">{title}</p>
        </div>

        <div className="flex items-center space-x-4">
          <Share
            size={17}
            className="active:scale-95 transition duration-100 cursor-pointer text-white/70"
          />
          <DeleteChat redirect chatId={chatId} chats={[]} setChats={() => {}} />
        </div>
      </div>
    </div>
  );
};

export default Navbar;
