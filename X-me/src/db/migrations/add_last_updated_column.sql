-- Migration simplifiée pour ajouter la colonne last_updated à la table chats
-- Crée d'abord une table temporaire avec la structure correcte, puis copie les données

-- Vérifier si la table existe
CREATE TABLE IF NOT EXISTS chats_temp (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  createdAt TEXT NOT NULL,
  focusMode TEXT NOT NULL,
  files TEXT DEFAULT '[]',
  user_id TEXT,
  last_updated TEXT
);

-- Copier les données existantes
INSERT OR IGNORE INTO chats_temp (id, title, createdAt, focusMode, files, user_id)
SELECT id, title, createdAt, focusMode, COALESCE(files, '[]'), user_id FROM chats;

-- Supprimer l'ancienne table et renommer la nouvelle
DROP TABLE IF EXISTS chats;
ALTER TABLE chats_temp RENAME TO chats;

-- Créer un index sur user_id pour améliorer les performances des requêtes
CREATE INDEX IF NOT EXISTS idx_chats_user_id ON chats(user_id); 