import { sql } from 'drizzle-orm';
import { text, integer, sqliteTable } from 'drizzle-orm/sqlite-core';

export const messages = sqliteTable('messages', {
  id: integer('id').primaryKey(),
  content: text('content').notNull(),
  chatId: text('chatId').notNull(),
  messageId: text('messageId').notNull(),
  role: text('type', { enum: ['assistant', 'user'] }),
  metadata: text('metadata', {
    mode: 'json',
  }),
  user_id: text('user_id'),
});

interface File {
  name: string;
  fileId: string;
}

export const chats = sqliteTable('chats', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  createdAt: text('createdAt').notNull(),
  focusMode: text('focusMode').notNull(),
  files: text('files', { mode: 'json' })
    .$type<File[]>()
    .default(sql`'[]'`),
  user_id: text('user_id'),
  last_updated: text('last_updated'),
});

// Types d'insertion pour les tables
export type MessageInsert = {
  content: string;
  chatId: string;
  messageId: string;
  type: 'assistant' | 'user'; // Nom de la colonne dans la base de données
  metadata?: string;
  user_id?: string;
};

export type ChatInsert = {
  id: string;
  title: string;
  createdAt: string;
  focusMode: string;
  files?: File[]; // Uniquement un tableau de File, pas de string
  user_id?: string;
  last_updated?: string; // Renommé pour correspondre à la colonne
};
