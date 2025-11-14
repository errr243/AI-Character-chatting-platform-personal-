import { GoogleGenerativeAI } from '@google/generative-ai';
import type { Character, Message } from './repository';

const modelName = process.env.GEMINI_MODEL ?? 'gemini-2.5-pro';

const getClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY 환경 변수가 설정되어 있지 않습니다.');
  }
  return new GoogleGenerativeAI(apiKey);
};

const normalizeHistory = (messages: Message[]) =>
  messages
    .filter((message) => message.role === 'user' || message.role === 'assistant')
    .map((message) => ({
      role: message.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: message.content }],
    }));

export const generateAssistantMessage = async ({
  character,
  history,
  userMessage,
}: {
  character: Character;
  history: Message[];
  userMessage: string;
}): Promise<string> => {
  const client = getClient();
  const model = client.getGenerativeModel({
    model: modelName,
    systemInstruction: character.systemPrompt
      ? { parts: [{ text: character.systemPrompt }] }
      : undefined,
  });

  const chat = model.startChat({
    history: normalizeHistory(history),
  });

  const result = await chat.sendMessage(userMessage);

  const text = result.response.text();
  if (!text) {
    throw new Error('Gemini 응답이 비어 있습니다.');
  }
  return text;
};
