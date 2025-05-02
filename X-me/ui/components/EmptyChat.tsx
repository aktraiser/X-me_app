import { Settings } from 'lucide-react';
import EmptyChatMessageInput from './EmptyChatMessageInput';

import { useState, useEffect } from 'react';
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
            Ici, c&apos;est vous le <strong className="animate-gradient-x bg-gradient-to-r from-blue-500 via-black dark:via-white to-red-500 text-transparent bg-clip-text">patron</strong>.
          </h2>
          <h3 className="text-black/70 dark:text-white/70 font-medium text-center">
            Posez vos questions, trouvez votre expert : je suis là pour vous aider dans vos ambitions entrepreneuriales.
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
      <style jsx global>{`
        @keyframes gradient-x {
          0% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
          100% {
            background-position: 0% 50%;
          }
        }
        .animate-gradient-x {
          background-size: 200% 100%;
          animation: gradient-x 3s ease infinite;
        }
      `}</style>
    </div>
  );
};

export default EmptyChat;
