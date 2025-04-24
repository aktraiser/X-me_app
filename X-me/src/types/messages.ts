// Définition des types pour les messages
export interface MessageType {
  content: string;
  chatId: string;
  messageId: string;
  role: 'assistant' | 'user';
  metadata?: string; // JSON stringify des métadonnées
}

export interface ChatType {
  id: string;
  title: string;
  createdAt: string;
  focusMode: string;
  files?: Array<{
    name: string;
    fileId: string;
  }>;
}

export type WSMessageType = {
  message: {
    messageId: string;
    chatId: string;
    content: string;
  };
  optimizationMode: 'speed' | 'balanced' | 'quality';
  type: 'message' | 'sources' | 'error' | 'suggestions';
  focusMode: string;
  history: Array<[string, string]>;
  files: Array<string>;
};

export type SearchHandlerType = 
  | 'webSearch'
  | 'academicSearch'
  | 'writingAssistant'
  | 'wolframAlphaSearch'
  | 'youtubeSearch'
  | 'redditSearch'
  | 'legal'
  | 'documents'
  | 'uploads'; 