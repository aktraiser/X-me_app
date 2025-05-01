import { Settings } from 'lucide-react';
import EmptyChatMessageInput from './EmptyChatMessageInput';

import { useState } from 'react';
import { File } from './ChatWindow';
import { useUser } from '@clerk/nextjs';

const EmptyChat = ({
  sendMessage,
  focusMode,
  setFocusMode,
  optimizationMode,
  setOptimizationMode,
  fileIds,
  setFileIds,
  files,
  setFiles,
}: {
  sendMessage: (message: string) => void;
  focusMode: string;
  setFocusMode: (mode: string) => void;
  optimizationMode: string;
  setOptimizationMode: (mode: string) => void;
  fileIds: string[];
  setFileIds: (fileIds: string[]) => void;
  files: File[];
  setFiles: (files: File[]) => void;
}) => {
  // Suppression de la gestion d'état pour le dialogue de réglages
  // const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const { user } = useUser();

  return (
    <div className="relative h-screen flex flex-col">

      <div className="absolute w-full flex flex-row items-center justify-end p-5">
        {/* Suppression du bouton de réglages */}
        {/*
        <Settings
          className="cursor-pointer lg:hidden"
          onClick={() => setIsSettingsOpen(true)}
        />
        */}
      </div>
      <div className="flex-1 flex items-center justify-center px-6 md:px-2">
        <div className="max-w-screen-sm w-full space-y-4 md:space-y-8 -mt-16">
          <h2 className="text-black/90 dark:text-white text-3xl font-medium text-center">
            {user?.firstName ? `${user.firstName}` : ''}{user?.firstName && <br />}Ici, c&apos;est vous le <strong><span className="text-blue-500">pa</span><span className="dark:text-white text-black">tr</span><span className="text-red-500">on</span></strong>.
          </h2>
          <h3 className="text-black/70 dark:text-white/70 font-medium text-center">
            Posez des questions, recherchez un expert, je suis là pour répondre à vos besoins entrepreneuriaux
          </h3>
          <EmptyChatMessageInput
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
        </div>
      </div>
    </div>
  );
};

export default EmptyChat;
