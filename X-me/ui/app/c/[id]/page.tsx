import ChatWindow from '@/components/ChatWindow';
import { Metadata } from 'next';
import { Suspense } from 'react';

export const metadata: Metadata = {
  title: 'Chat - X-me',
  description: 'Chat avec X-me.',
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