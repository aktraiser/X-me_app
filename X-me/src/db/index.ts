import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as schema from './schema';
import { runMigration } from './runMigration';
import logger from '../utils/logger';
import * as fs from 'fs';
import * as path from 'path';

// Créer le dossier migrations s'il n'existe pas
const migrationsDir = path.join(__dirname, 'migrations');
if (!fs.existsSync(migrationsDir)) {
  fs.mkdirSync(migrationsDir, { recursive: true });
  logger.info('Dossier migrations créé');
}

const sqlite = new Database('data/db.sqlite');

// Exécuter la migration avant d'initialiser Drizzle
runMigration(sqlite);

const db = drizzle(sqlite, {
  schema: schema,
});

export default db;
