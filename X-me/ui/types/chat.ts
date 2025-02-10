import { Document } from '@langchain/core/documents';
import { Expert } from '@/lib/actions';

export interface Message {
  messageId: string;
  chatId: string;
  content: string;
  role: 'user' | 'assistant' | 'system';
  createdAt: string;
  suggestions?: string[];
  suggestedExperts?: {
    name: string;
    expertise: string[];
    rating: number;
  }[];
  sources?: {
    title: string;
    url: string;
  }[];
}

export interface Chat {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messages: Message[];
  focusMode?: 'default' | 'expert' | 'research';
  status: 'active' | 'archived' | 'deleted';
  metadata?: {
    topic?: string;
    tags?: string[];
    summary?: string;
  };
}

export interface File {
  fileName: string;
  fileExtension: string;
  fileId: string;
} 