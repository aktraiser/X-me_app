import { Database } from 'better-sqlite3';
import * as fs from 'fs';
import * as path from 'path';
import logger from '../utils/logger';

/**
 * Crée le fichier de migration s'il n'existe pas
 */
export const ensureMigrationFile = () => {
  try {
    // Chemin vers le dossier de migrations
    const migrationsDir = path.join(__dirname, 'migrations');
    
    // Créer le dossier migrations s'il n'existe pas
    if (!fs.existsSync(migrationsDir)) {
      fs.mkdirSync(migrationsDir, { recursive: true });
      logger.info('Dossier migrations créé');
    }
    
    // Chemin vers le fichier de migration
    const migrationPath = path.join(migrationsDir, 'add_last_updated_column.sql');
    
    // Si le fichier de migration n'existe pas, le créer avec le contenu par défaut
    if (!fs.existsSync(migrationPath)) {
      logger.info('Création du fichier de migration SQL...');
      
      const migrationSQL = `-- Migration simplifiée pour ajouter la colonne last_updated à la table chats
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
CREATE INDEX IF NOT EXISTS idx_chats_user_id ON chats(user_id);`;
      
      fs.writeFileSync(migrationPath, migrationSQL);
      logger.info('Fichier de migration SQL créé avec succès');
    }
  } catch (error) {
    logger.error('Erreur lors de la création du fichier de migration:', error);
  }
};

/**
 * Exécute le fichier de migration SQL pour corriger la structure de la table chats
 */
export const runMigration = (db: Database) => {
  try {
    logger.info('Exécution de la migration pour corriger la table chats...');
    
    // S'assurer que le fichier de migration existe
    ensureMigrationFile();
    
    // Chemin vers le fichier de migration
    const migrationPath = path.join(__dirname, 'migrations', 'add_last_updated_column.sql');
    
    // Vérifier à nouveau si le fichier existe après s'être assuré qu'il a été créé
    if (!fs.existsSync(migrationPath)) {
      logger.error('Le fichier de migration est introuvable malgré la tentative de création');
      // Appliquer directement la migration en dur comme solution de secours
      applyHardcodedMigration(db);
      return;
    }
    
    // Lire le contenu du fichier de migration
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    // Exécuter la migration dans une transaction
    db.exec('BEGIN TRANSACTION;');
    
    try {
      // Tester si la table existe déjà
      const tableExists = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='chats'").get();
      
      if (!tableExists) {
        logger.info('La table chats n\'existe pas encore, la migration va la créer');
      } else {
        logger.info('La table chats existe, vérification de la colonne last_updated...');
        
        // Vérifier si la colonne existe
        const tableInfo = db.prepare("PRAGMA table_info(chats)").all() as any[];
        const lastUpdatedColumn = tableInfo.find(col => col.name === 'last_updated');
        
        if (lastUpdatedColumn) {
          logger.info('La colonne last_updated existe déjà, migration non nécessaire');
          db.exec('COMMIT;');
          return;
        }
      }
      
      // Exécuter la migration
      logger.info('Exécution de la migration SQL...');
      db.exec(migrationSQL);
      logger.info('Migration SQL exécutée avec succès');
      
      db.exec('COMMIT;');
    } catch (error) {
      // En cas d'erreur, annuler la transaction
      db.exec('ROLLBACK;');
      logger.error('Erreur lors de l\'exécution de la migration:', error);
      
      // Essayer avec une approche différente comme solution de secours
      logger.info('Tentative avec une migration de secours...');
      applyHardcodedMigration(db);
    }
  } catch (error) {
    logger.error('Erreur lors de l\'exécution de la migration:', error);
  }
};

/**
 * Applique une migration codée en dur comme solution de secours
 */
const applyHardcodedMigration = (db: Database) => {
  try {
    logger.info('Application de la migration de secours...');
    
    // Exécuter des commandes SQL plus simples et plus robustes
    db.exec('BEGIN TRANSACTION;');
    
    try {
      // Vérifier si la table existe
      const tableExists = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='chats'").get();
      
      if (!tableExists) {
        // Créer la table complète si elle n'existe pas
        db.exec(`
          CREATE TABLE chats (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            createdAt TEXT NOT NULL,
            focusMode TEXT NOT NULL,
            files TEXT DEFAULT '[]',
            user_id TEXT,
            last_updated TEXT
          );
          CREATE INDEX idx_chats_user_id ON chats(user_id);
        `);
        logger.info('Table chats créée avec succès');
      } else {
        // Vérifier si la colonne existe
        const tableInfo = db.prepare("PRAGMA table_info(chats)").all() as any[];
        const lastUpdatedColumn = tableInfo.find(col => col.name === 'last_updated');
        
        if (!lastUpdatedColumn) {
          // Essayer d'ajouter la colonne
          try {
            db.exec("ALTER TABLE chats ADD COLUMN last_updated TEXT;");
            logger.info('Colonne last_updated ajoutée avec succès');
          } catch (alterError) {
            logger.error('Erreur lors de l\'ajout de la colonne last_updated:', alterError);
            
            // Solution radicale : créer une nouvelle table avec une structure saine
            db.exec(`
              CREATE TABLE chats_new (
                id TEXT PRIMARY KEY,
                title TEXT NOT NULL,
                createdAt TEXT NOT NULL,
                focusMode TEXT NOT NULL,
                files TEXT DEFAULT '[]',
                user_id TEXT,
                last_updated TEXT
              );
              
              INSERT OR IGNORE INTO chats_new (id, title, createdAt, focusMode, files, user_id)
              SELECT id, title, createdAt, focusMode, COALESCE(files, '[]'), user_id FROM chats;
              
              DROP TABLE chats;
              ALTER TABLE chats_new RENAME TO chats;
              CREATE INDEX idx_chats_user_id ON chats(user_id);
            `);
            logger.info('Table chats recréée avec succès');
          }
        }
      }
      
      db.exec('COMMIT;');
      logger.info('Migration de secours appliquée avec succès');
    } catch (error) {
      db.exec('ROLLBACK;');
      logger.error('Erreur lors de l\'application de la migration de secours:', error);
    }
  } catch (error) {
    logger.error('Erreur lors de l\'application de la migration de secours:', error);
  }
}; 