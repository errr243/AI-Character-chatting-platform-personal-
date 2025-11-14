export interface ChatHistory {
  id: string;
  title: string;
  messages: Array<{
    role: 'user' | 'assistant';
    content: string;
  }>;
  contextSummary?: string;  // 이전 대화 요약
  lastSummaryAt?: number;   // 마지막 요약 시점 (메시지 개수)
  userNote?: string;        // 사용자 노트 (직접 작성하는 세계관/상황 설정)
  characterName: string;
  characterPersonality: string;
  model: 'gemini-flash' | 'gemini-pro';
  createdAt: number;
  updatedAt: number;
}

const STORAGE_KEY = 'chat_histories';

export function generateId(): string {
  return `chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function loadChatHistories(): ChatHistory[] {
  if (typeof window === 'undefined') return [];
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    
    const histories = JSON.parse(stored) as ChatHistory[];
    return histories.sort((a, b) => b.updatedAt - a.updatedAt);
  } catch (error) {
    console.error('Failed to load chat histories:', error);
    return [];
  }
}

export function saveChatHistory(history: ChatHistory): void {
  if (typeof window === 'undefined') return;
  
  try {
    const histories = loadChatHistories();
    const existingIndex = histories.findIndex(h => h.id === history.id);
    
    if (existingIndex >= 0) {
      histories[existingIndex] = { ...history, updatedAt: Date.now() };
    } else {
      histories.unshift(history);
    }
    
    // 최대 100개까지만 저장
    const trimmed = histories.slice(0, 100);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  } catch (error) {
    console.error('Failed to save chat history:', error);
  }
}

export function updateChatHistory(id: string, updates: Partial<ChatHistory>): void {
  if (typeof window === 'undefined') return;
  
  try {
    const histories = loadChatHistories();
    const index = histories.findIndex(h => h.id === id);
    
    if (index >= 0) {
      histories[index] = {
        ...histories[index],
        ...updates,
        updatedAt: Date.now(),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(histories));
    }
  } catch (error) {
    console.error('Failed to update chat history:', error);
  }
}

export function deleteChatHistory(id: string): void {
  if (typeof window === 'undefined') return;
  
  try {
    const histories = loadChatHistories();
    const filtered = histories.filter(h => h.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error('Failed to delete chat history:', error);
  }
}

export function createNewChatHistory(
  characterName = 'AI 친구',
  characterPersonality = '친근하고 도움이 되는',
  model: 'gemini-flash' | 'gemini-pro' = 'gemini-pro'
): ChatHistory {
  return {
    id: generateId(),
    title: '새 대화',
    messages: [],
    characterName,
    characterPersonality,
    model,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

export function generateChatTitle(messages: ChatHistory['messages']): string {
  if (messages.length === 0) return '새 대화';
  
  const firstUserMessage = messages.find(m => m.role === 'user');
  if (!firstUserMessage) return '새 대화';
  
  const title = firstUserMessage.content.slice(0, 30);
  return title.length < firstUserMessage.content.length ? `${title}...` : title;
}

