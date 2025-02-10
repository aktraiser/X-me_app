import { RunnableSequence, RunnableMap } from '@langchain/core/runnables';
import ListLineOutputParser from '../lib/outputParsers/listLineOutputParser';
import { PromptTemplate } from '@langchain/core/prompts';
import formatChatHistoryAsString from '../utils/formatHistory';
import { BaseMessage } from '@langchain/core/messages';
import { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { ChatOpenAI } from '@langchain/openai';

const suggestionGeneratorPrompt = `
Vous êtes un générateur de suggestions pour un moteur de recherche alimenté par l'IA. Une conversation vous sera présentée ci-dessous. Vous devez générer 4-5 suggestions basées sur cette conversation. Les suggestions doivent être pertinentes par rapport à la conversation et pouvoir être utilisées par l'utilisateur pour demander plus d'informations au modèle de chat.
Vous devez vous assurer que les suggestions sont pertinentes pour la conversation et utiles pour l'utilisateur. Gardez à l'esprit que l'utilisateur pourrait utiliser ces suggestions pour demander plus d'informations à un modèle de chat.
Assurez-vous que les suggestions sont de longueur moyenne et sont informatives et pertinentes par rapport à la conversation.

Fournissez ces suggestions séparées par des sauts de ligne entre les balises XML <suggestions> et </suggestions>. Par exemple:

<suggestions>
Parlez-moi plus de SpaceX et de leurs projets récents
Quelles sont les dernières nouvelles concernant SpaceX ?
Qui est le PDG de SpaceX ?
</suggestions>

Conversation:
{chat_history}
`;

type SuggestionGeneratorInput = {
  chat_history: BaseMessage[];
};

const outputParser = new ListLineOutputParser({
  key: 'suggestions',
});

const createSuggestionGeneratorChain = (llm: BaseChatModel) => {
  return RunnableSequence.from([
    RunnableMap.from({
      chat_history: (input: SuggestionGeneratorInput) =>
        formatChatHistoryAsString(input.chat_history),
    }),
    PromptTemplate.fromTemplate(suggestionGeneratorPrompt),
    llm,
    outputParser,
  ]);
};

const generateSuggestions = (
  input: SuggestionGeneratorInput,
  llm: BaseChatModel,
) => {
  (llm as unknown as ChatOpenAI).temperature = 0;
  const suggestionGeneratorChain = createSuggestionGeneratorChain(llm);
  return suggestionGeneratorChain.invoke(input);
};

export default generateSuggestions;
