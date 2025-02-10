import { ChatOpenAI, OpenAIEmbeddings } from '@langchain/openai';
import { getOpenaiApiKey } from '../../config';
import logger from '../../utils/logger';

export const loadOpenAIChatModels = async () => {
  const openAIApiKey = getOpenaiApiKey();

  if (!openAIApiKey) return {};

  try {
    const chatModels = {
      'o1-mini': {
        displayName: 'O1-Mini (65k tokens)',
        model: new ChatOpenAI({
          openAIApiKey,
          modelName: 'o1-mini',
          temperature: 0.7,
          maxTokens: 65536,
        }),
      },
      'o1-preview': {
        displayName: 'O1-Preview (32k tokens)',
        model: new ChatOpenAI({
          openAIApiKey,
          modelName: 'o1-preview',
          temperature: 0.7,
          maxTokens: 32768,
        }),
      },
      'gpt-4o-mini': {
        displayName: 'GPT-4O Mini (16k tokens)',
        model: new ChatOpenAI({
          openAIApiKey,
          modelName: 'gpt-4o-mini',
          temperature: 0.7,
          maxTokens: 16384,
        }),
      },
      'gpt-4-turbo': {
        displayName: 'GPT-4 Turbo (4k tokens)',
        model: new ChatOpenAI({
          openAIApiKey,
          modelName: 'gpt-4-turbo',
          temperature: 0.7,
          maxTokens: 4096,
        }),
      }
    };

    return chatModels;
  } catch (err) {
    logger.error(`Error loading OpenAI models: ${err}`);
    return {};
  }
};

export const loadOpenAIEmbeddingsModels = async () => {
  const openAIApiKey = getOpenaiApiKey();

  if (!openAIApiKey) return {};

  try {
    const embeddingModels = {
      'text-embedding-3-small': {
        displayName: 'Text Embedding 3 Small',
        model: new OpenAIEmbeddings({
          openAIApiKey,
          modelName: 'text-embedding-3-small',
          stripNewLines: true,
        }),
      },
      'text-embedding-3-large': {
        displayName: 'Text Embedding 3 Large',
        model: new OpenAIEmbeddings({
          openAIApiKey,
          modelName: 'text-embedding-3-large',
          stripNewLines: true,
        }),
      },
    };

    return embeddingModels;
  } catch (err) {
    logger.error(`Error loading OpenAI embeddings model: ${err}`);
    return {};
  }
};
