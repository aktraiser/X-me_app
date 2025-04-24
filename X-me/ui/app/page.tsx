import ChatWindow from '@/components/ChatWindow';
import { Metadata } from 'next';
import { Suspense } from 'react';

export const metadata: Metadata = {
  title: 'Chat - X-me',
  description: 'Chat with the internet, chat with X-me.',
};

const Home = () => {
  return (
    <div>
      <Suspense fallback={<div className="p-4 text-white">Chargement de ChatWindow...</div>}>
        <ChatWindow />
      </Suspense>
    </div>
  );
};

export default Home;