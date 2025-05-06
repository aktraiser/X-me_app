import ChatWindow from '@/components/ChatWindow';
import { Metadata } from 'next';
import { Suspense } from 'react';

export const metadata: Metadata = {
  title: 'Xandme - Ici c\'est vous le patron ',
  description: 'Xand&me est une plateforme de mise en relation avec des experts.',
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