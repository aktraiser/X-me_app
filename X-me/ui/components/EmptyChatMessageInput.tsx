import { ArrowRight, ArrowUpRight, Search } from 'lucide-react';
import { useEffect, useRef, useState, useCallback } from 'react';
import TextareaAutosize from 'react-textarea-autosize';
import Attach from './MessageInputActions/Attach';
import { File } from './ChatWindow';
import { useWebSocket } from '../lib/hooks/useWebSocket';
import { v4 as uuidv4 } from 'uuid';

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
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  const [isLoading, setIsLoading] = useState(false);
  const { ws } = useWebSocket();

  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const debounceTimeout = useRef<NodeJS.Timeout | null>(null);

  // Envoi la requête de suggestions via WebSocket
  const updateSuggestions = useCallback(async (input: string) => {
    if (!ws || input.trim() === '') {
      setShowSuggestions(false);
      return;
    }

    // Afficher les suggestions uniquement si l'input commence par un préfixe business
    const businessPrefixes = ['je', 'nous', 'comment', 'quelles', 'pouvez'];
    const inputLower = input.toLowerCase();
    const shouldShowSuggestions = businessPrefixes.some(prefix =>
      inputLower.startsWith(prefix)
    );
    if (!shouldShowSuggestions) {
      setShowSuggestions(false);
      return;
    }

    setIsLoading(true);
    try {
      ws.send(JSON.stringify({
        type: 'suggestions',
        message: {
          content: input,
          messageId: uuidv4(),
          chatId: 'suggestions'
        }
      }));
    } catch (error) {
      console.error('Erreur lors de la récupération des suggestions:', error);
      setShowSuggestions(false);
      setIsLoading(false);
    }
  }, [ws]);

  // Réception des réponses sur le WebSocket
  useEffect(() => {
    if (!ws) return;
    const handleMessage = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'suggestions') {
          setSuggestions(data.suggestions || []);
          setShowSuggestions(data.suggestions?.length > 0);
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Erreur lors du parsing des suggestions:', error);
        setIsLoading(false);
      }
    };
    ws.addEventListener('message', handleMessage);
    return () => ws.removeEventListener('message', handleMessage);
  }, [ws]);

  // Debounce de la mise à jour des suggestions
  useEffect(() => {
    if (!message.trim()) {
      setShowSuggestions(false);
      return;
    }
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }
    debounceTimeout.current = setTimeout(() => {
      updateSuggestions(message);
    }, 300);
    return () => {
      if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
    };
  }, [message, updateSuggestions]);

  // Réinitialise l'index sélectionné à chaque changement de suggestions
  useEffect(() => {
    setSelectedSuggestionIndex(-1);
  }, [suggestions]);

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
            setShowSuggestions(false);
          }
        }}
        onKeyDown={(e) => {
          if (showSuggestions) {
            if (e.key === 'ArrowDown') {
              e.preventDefault();
              setSelectedSuggestionIndex(prev =>
                prev < suggestions.length - 1 ? prev + 1 : prev
              );
            } else if (e.key === 'ArrowUp') {
              e.preventDefault();
              setSelectedSuggestionIndex(prev =>
                prev > -1 ? prev - 1 : -1
              );
            } else if (e.key === 'Enter') {
              if (e.shiftKey) return;
              e.preventDefault();
              if (message.trim()) {
                sendMessage(message);
                setMessage('');
                setShowSuggestions(false);
              }
            } else if (e.key === 'Tab') {
              e.preventDefault();
              setMessage(suggestions[selectedSuggestionIndex]);
              setShowSuggestions(false);
            } else if (e.key === 'Escape') {
              setShowSuggestions(false);
            }
          } else if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            if (message.trim()) {
              sendMessage(message);
              setMessage('');
            }
          }
        }}
        className="w-full relative"
      >
        <div className={`flex flex-col bg-light-secondary dark:bg-dark-secondary px-5 pt-5 pb-2 w-full border-[0.5px] border-light-700 dark:border-dark-700 ${
          showSuggestions ? 'rounded-t-lg' : 'rounded-lg'
        }`}>
          <TextareaAutosize
            ref={inputRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            minRows={2}
            className="bg-transparent placeholder:text-black/50 dark:placeholder:text-white/50 text-sm sm:text-sm text-black dark:text-white resize-none focus:outline-none w-full max-h-20 sm:max-h-24 lg:max-h-36 xl:max-h-48"
            placeholder="Message à X&me..."
          />
          {showSuggestions && (
            <div className="absolute left-0 right-0 bottom-0 translate-y-full bg-light-secondary dark:bg-dark-secondary border-x border-b border-light-200 dark:border-dark-200 rounded-b-lg shadow-lg z-50 max-h-[50vh] overflow-y-auto">
              {isLoading ? (
                <div className="px-3 sm:px-4 py-2 text-xs sm:text-sm text-gray-400">
                  Chargement des suggestions...
                </div>
              ) : (
                suggestions.map((suggestion, index) => (
                  <div
                    key={suggestion}
                    className={`flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 sm:py-3 cursor-pointer transition-all duration-200 ease-in-out hover:bg-gray-700/30 ${
                      index === selectedSuggestionIndex && document.activeElement?.tagName === 'TEXTAREA' ? 'bg-gray-700/90' : ''
                    }`}
                    onClick={() => {
                      sendMessage(suggestion);
                      setMessage('');
                      setShowSuggestions(false);
                    }}
                  >
                    <Search className="text-gray-400 hidden sm:block" size={16} />
                    <span className="text-black dark:text-white text-xs sm:text-sm flex-grow line-clamp-2 sm:line-clamp-1">{suggestion}</span>
                    <div className="flex items-center gap-1 sm:gap-2 shrink-0">
                      <ArrowUpRight className="text-gray-400" size={14} />
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

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
              sendMessage("Je cherche de l&apos;aide pour rédiger mes CGV");
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