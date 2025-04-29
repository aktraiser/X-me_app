import fs from 'fs';
import path from 'path';
import toml from '@iarna/toml';
import dotenv from 'dotenv';

// Charger les variables d'environnement depuis .env si existant
dotenv.config();

const configFileName = 'config.toml';

// Vérifier si le fichier config.toml existe, sinon utiliser uniquement les variables d'environnement
const configFileExists = fs.existsSync(path.join(__dirname, `../${configFileName}`));

interface Config {
  GENERAL: {
    PORT: number;
    SIMILARITY_MEASURE: string;
    KEEP_ALIVE: string;
  };
  API_KEYS: {
    OPENAI: string;
    ANTHROPIC: string;
    GEMINI: string;
    SUPABASE: string;
  };
  API_ENDPOINTS: {
    SUPABASE_URL: string;
  };
}

// Ajouter la définition du type manquant
type RecursivePartial<T> = {
  [P in keyof T]?: RecursivePartial<T[P]>;
};

// Fonction pour charger la configuration (depuis le fichier ou les variables d'environnement)
const loadConfig = (): Config => {
  if (configFileExists) {
    try {
      return toml.parse(
        fs.readFileSync(path.join(__dirname, `../${configFileName}`), 'utf-8'),
      ) as any as Config;
    } catch (error) {
      console.warn(`Erreur lors de la lecture du fichier config.toml: ${error.message}`);
      console.warn('Utilisation des variables d\'environnement uniquement');
    }
  }

  // Configuration par défaut basée sur les variables d'environnement
  return {
    GENERAL: {
      PORT: parseInt(process.env.PORT || '3001'),
      SIMILARITY_MEASURE: process.env.SIMILARITY_MEASURE || 'cosine',
      KEEP_ALIVE: process.env.KEEP_ALIVE || 'true',
    },
    API_KEYS: {
      OPENAI: process.env.OPENAI_API_KEY || '',
      ANTHROPIC: process.env.ANTHROPIC_API_KEY || '',
      GEMINI: process.env.GEMINI_API_KEY || '',
      SUPABASE: process.env.SUPABASE_KEY || '',
    },
    API_ENDPOINTS: {
      SUPABASE_URL: process.env.SUPABASE_URL || '',
    },
  };
};

export const getPort = () => loadConfig().GENERAL.PORT;

export const getSimilarityMeasure = () => loadConfig().GENERAL.SIMILARITY_MEASURE;

export const getKeepAlive = () => loadConfig().GENERAL.KEEP_ALIVE;

export const getOpenaiApiKey = () => process.env.OPENAI_API_KEY || loadConfig().API_KEYS.OPENAI;

export const getAnthropicApiKey = () => process.env.ANTHROPIC_API_KEY || loadConfig().API_KEYS.ANTHROPIC;

export const getGeminiApiKey = () => process.env.GEMINI_API_KEY || loadConfig().API_KEYS.GEMINI;

export const getSupabaseKey = () => process.env.SUPABASE_KEY || loadConfig().API_KEYS.SUPABASE;

export const getSupabaseUrl = () => process.env.SUPABASE_URL || loadConfig().API_ENDPOINTS.SUPABASE_URL;

export const getOpenAIBaseURL = () => {
  return process.env.OPENAI_API_BASE_URL || 'https://api.openai.com/v1';
};

export const isOpenAISearchEnabled = () => {
  const apiKey = getOpenaiApiKey();
  return !!apiKey && apiKey.length > 0;
};

export const isGeminiEnabled = () => {
  const apiKey = process.env.GEMINI_API_KEY || loadConfig().API_KEYS.GEMINI;
  return !!apiKey && apiKey.length > 0;
};

// Clé API Firecrawl par défaut
const DEFAULT_FIRECRAWL_API_KEY = 'fc-12aa7e5b001e40d28ce76781635ab389';

export const getFirecrawlApiKey = () => 
  process.env.FIRECRAWL_API_KEY || DEFAULT_FIRECRAWL_API_KEY;

export const isFirecrawlEnabled = () => {
  const apiKey = getFirecrawlApiKey();
  return !!apiKey && apiKey.length > 0;
};

export const updateConfig = (config: RecursivePartial<Config>) => {
  if (!configFileExists) {
    console.warn('Le fichier config.toml n\'existe pas, impossible de mettre à jour la configuration');
    return;
  }
  
  const currentConfig = loadConfig();

  for (const key in currentConfig) {
    if (!config[key]) config[key] = {};

    if (typeof currentConfig[key] === 'object' && currentConfig[key] !== null) {
      for (const nestedKey in currentConfig[key]) {
        if (
          !config[key][nestedKey] &&
          currentConfig[key][nestedKey] &&
          config[key][nestedKey] !== ''
        ) {
          config[key][nestedKey] = currentConfig[key][nestedKey];
        }
      }
    } else if (currentConfig[key] && config[key] !== '') {
      config[key] = currentConfig[key];
    }
  }

  fs.writeFileSync(
    path.join(__dirname, `../${configFileName}`),
    toml.stringify(config),
  );
};

export function getRedisUrl(): string {
  return process.env.REDIS_URL || 'redis://redis-p0r3.onrender.com:6379';
}
