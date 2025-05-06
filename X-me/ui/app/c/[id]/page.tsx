import ChatWindow from '@/components/ChatWindow';
import { Metadata } from 'next';
import { Suspense } from 'react';

export const metadata: Metadata = {
  title: 'Xandme',
  description: 'Xandme est une plateforme de mise en relation avec des experts.',
};

const Page = ({ params }: { params: { id: string } }) => {
  const { id } = params;
  
  return (
    <div>
      <Suspense>
        <ChatWindow id={id} />
      </Suspense>
    </div>
  );
};

export default Page; 