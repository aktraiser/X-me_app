import { ArrowRight, ArrowUpRight } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import TextareaAutosize from 'react-textarea-autosize';
import Attach from './MessageInputActions/Attach';
import { File } from './ChatWindow';

const EmptyChatMessageInput = ({
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
  const [message, setMessage] = useState('');
  const inputRef = useRef<HTMLTextAreaElement | null>(null);

  // Focus global sur le champ de saisie avec la touche "/"
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeElement = document.activeElement;
      const isInputFocused =
        activeElement?.tagName === 'INPUT' ||
        activeElement?.tagName === 'TEXTAREA' ||
        activeElement?.hasAttribute('contenteditable');
      if (e.key === '/' && !isInputFocused) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    inputRef.current?.focus();
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return (
    <div className="w-full flex flex-col space-y-6">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (message.trim()) {
            sendMessage(message);
            setMessage('');
          }
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            if (message.trim()) {
              sendMessage(message);
              setMessage('');
            }
          }
        }}
        className="w-full relative"
      >
        <div className={`flex flex-col bg-light-secondary dark:bg-dark-secondary px-5 pt-5 pb-2 w-full border-[0.5px] border-light-700 dark:border-dark-700 rounded-lg`}>
          <TextareaAutosize
            ref={inputRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            minRows={2}
            className="bg-transparent placeholder:text-black/50 dark:placeholder:text-white/50 text-sm sm:text-sm text-black dark:text-white resize-none focus:outline-none w-full max-h-20 sm:max-h-24 lg:max-h-36 xl:max-h-48"
            placeholder="Message à X&me..."
          />

          <div className="flex flex-row items-center justify-between mt-2 sm:mt-4">
            <div className="flex flex-row items-center space-x-1 sm:space-x-2 lg:space-x-4">
              <Attach
                fileIds={fileIds}
                setFileIds={setFileIds}
                files={files}
                setFiles={setFiles}
                showText
              />
            </div>
            <div className="flex flex-row items-center space-x-1 sm:space-x-4">
              <button
                disabled={message.trim().length === 0}
                className="bg-gray-700 hover:bg-dark-200 dark:bg-black dark:hover:bg-dark-800  text-white dark:text-white hover:text-white disabled:text-black/50 dark:disabled:text-white/50 disabled:bg-[#e0e0dc] dark:disabled:bg-black/30 hover:bg-opacity-85 transition duration-100 rounded-full p-1.5 sm:p-2"
              >
                <ArrowRight className="w-4 h-4 sm:w-[17px] sm:h-[17px]" />
              </button>
            </div>
          </div>
          
        </div>
      </form>
      {/* Questions suggérées - à l'extérieur du textarea */}
      <div className="flex flex-col items-center justify-center gap-3 w-full max-w-4xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-4xl">
          <button
            type="button"
            onClick={() => {
              sendMessage("Je cherche de l'aide pour rédiger mes CGV");
            }}
            className="border border-light-700/30 dark:border-white/10 bg-transparent hover:bg-black/10 dark:hover:bg-white/10 text-black dark:text-white text-xs py-3 px-5 rounded-lg text-center transition duration-200"
          >
            Je cherche de l&apos;aide pour rédiger mes CGV
          </button>
          <button
            type="button"
            onClick={() => {
              sendMessage("Comment optimiser ma présence en ligne ?");
            }}
            className="border border-light-700/30 dark:border-white/10 bg-transparent hover:bg-black/10 dark:hover:bg-white/10 text-black dark:text-white text-xs py-3 px-5 rounded-lg text-center transition duration-200"
          >
            Comment optimiser ma présence en ligne ?
          </button>
        </div>
        <div className="w-full sm:w-1/2 max-w-md">
          <button
            type="button"
            onClick={() => {
              sendMessage("Aidez-moi à créer un plan marketing");
            }}
            className="border border-light-700/30 dark:border-white/10 bg-transparent hover:bg-black/10 dark:hover:bg-white/10 text-black dark:text-white text-xs py-3 px-5 rounded-lg text-center transition duration-200 w-full"
          >
            Aidez-moi à créer un plan marketing
          </button>
        </div>
      </div>
    </div>
    
  );
};

export default EmptyChatMessageInput;