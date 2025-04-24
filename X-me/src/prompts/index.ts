import {
  academicSearchResponsePrompt,
  academicSearchRetrieverPrompt,
} from './academicSearch';
import {
  redditSearchResponsePrompt,
  redditSearchRetrieverPrompt,
} from './redditSearch';
import { webSearchResponsePrompt, webSearchRetrieverPrompt } from './webSearch';
import {
  wolframAlphaSearchResponsePrompt,
  wolframAlphaSearchRetrieverPrompt,
} from './wolframAlpha';
import { writingAssistantPrompt } from './writingAssistant';
import {
  youtubeSearchResponsePrompt,
  youtubeSearchRetrieverPrompt,
} from './youtubeSearch';

export { webSearchRetrieverPrompt, webSearchResponsePrompt } from './webSearch';
export { academicSearchRetrieverPrompt, academicSearchResponsePrompt } from './academicSearch';
export { wolframAlphaSearchRetrieverPrompt, wolframAlphaSearchResponsePrompt } from './wolframAlpha';

export default {
  webSearchRetrieverPrompt,
  webSearchResponsePrompt,
  academicSearchRetrieverPrompt,
  academicSearchResponsePrompt,
  redditSearchResponsePrompt,
  redditSearchRetrieverPrompt,
  wolframAlphaSearchRetrieverPrompt,
  wolframAlphaSearchResponsePrompt,
  youtubeSearchRetrieverPrompt,
  youtubeSearchResponsePrompt,
  writingAssistantPrompt,
};
