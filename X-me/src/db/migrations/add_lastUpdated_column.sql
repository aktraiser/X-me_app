-- Migration pour corriger le problème de colonne lastUpdated

-- Créer une table temporaire avec la structure correcte
CREATE TABLE chats_temp (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  createdAt TEXT NOT NULL,
  focusMode TEXT NOT NULL,
  files TEXT DEFAULT '[]',
  user_id TEXT,
  "lastUpdated" TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Copier les données existantes
INSERT INTO chats_temp (id, title, createdAt, focusMode, files, user_id)
SELECT id, title, createdAt, focusMode, files, user_id FROM chats;

-- Supprimer l'ancienne table
DROP TABLE chats;

-- Renommer la table temporaire
ALTER TABLE chats_temp RENAME TO chats;

-- Créer des index nécessaires
CREATE INDEX idx_chats_user_id ON chats(user_id); 