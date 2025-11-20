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

// 히스토리 목록만 로드 (최근 10개 메시지만 포함하여 메모리 절약)
export interface ChatHistorySummary {
  id: string;
  title: string;
  characterName: string;
  characterPersonality: string;
  model: 'gemini-flash' | 'gemini-pro';
  createdAt: number;
  updatedAt: number;
  messageCount: number; // 전체 메시지 개수
  recentMessages: Array<{ // 최근 10개 메시지만 (미리보기용)
    role: 'user' | 'assistant';
    content: string;
  }>;
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

// 히스토리 목록만 로드 (최근 10개 메시지만 포함) - 메모리 최적화
const MAX_VISIBLE_HISTORIES = 10;
const MAX_RECENT_MESSAGES = 10;

export function loadChatHistorySummaries(): ChatHistorySummary[] {
  if (typeof window === 'undefined') return [];

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];

    const histories = JSON.parse(stored) as ChatHistory[];

    // 최근 10개 히스토리만 반환 (나머지는 숨김)
    const sorted = histories.sort((a, b) => b.updatedAt - a.updatedAt);
    const totalCount = sorted.length;
    const visibleHistories = sorted.slice(0, MAX_VISIBLE_HISTORIES);

    // 디버깅: 실제로 10개만 반환하는지 확인
    if (totalCount > MAX_VISIBLE_HISTORIES) {
      console.log(`[ChatHistory] Total histories: ${totalCount}, Showing only: ${visibleHistories.length}`);
    }

    // 최근 10개 메시지만 포함하여 반환
    return visibleHistories.map(h => ({
      id: h.id,
      title: h.title,
      characterName: h.characterName,
      characterPersonality: h.characterPersonality,
      model: h.model,
      createdAt: h.createdAt,
      updatedAt: h.updatedAt,
      messageCount: h.messages.length,
      // 최근 10개 메시지만 포함 (뒤에서부터)
      recentMessages: h.messages.slice(-MAX_RECENT_MESSAGES),
    }));
  } catch (error) {
    console.error('Failed to load chat history summaries:', error);
    return [];
  }
}

// 특정 히스토리만 로드 (메시지 포함)
export function loadChatHistoryById(id: string): ChatHistory | null {
  if (typeof window === 'undefined') return null;

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      console.warn(`⚠️ No chat histories found in localStorage`);
      return null;
    }

    const histories = JSON.parse(stored) as ChatHistory[];
    const history = histories.find(h => h.id === id);

    if (!history) {
      console.warn(`⚠️ Chat history not found: ${id}`);
      return null;
    }

    console.log(`✅ Chat history loaded: ${id} (${history.messages.length} messages)`);
    return history;
  } catch (error) {
    console.error('❌ Failed to load chat history:', error);

    // 손상된 localStorage 데이터 복구 시도
    if (error instanceof SyntaxError) {
      console.error('Corrupted localStorage data detected. Attempting recovery...');
      localStorage.removeItem(STORAGE_KEY);
      alert('대화 기록 데이터가 손상되었습니다. 초기화합니다.');
    }
    return null;
  }
}

// 특정 히스토리의 메시지 범위만 로드 (페이지네이션)
export function loadChatHistoryMessages(
  id: string,
  startIndex: number = 0,
  count: number = 10
): Array<{ role: 'user' | 'assistant'; content: string }> {
  if (typeof window === 'undefined') return [];

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];

    const histories = JSON.parse(stored) as ChatHistory[];
    const history = histories.find(h => h.id === id);

    if (!history) return [];

    // startIndex부터 count개만 반환
    return history.messages.slice(startIndex, startIndex + count);
  } catch (error) {
    console.error('Failed to load chat history messages:', error);
    return [];
  }
}

export function saveChatHistory(history: ChatHistory): boolean {
  if (typeof window === 'undefined') return false;

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

    console.log(`✅ Chat history saved: ${history.id}`);
    return true;
  } catch (error) {
    console.error('❌ Failed to save chat history:', error);

    if (error instanceof DOMException && error.name === 'QuotaExceededError') {
      alert('저장 공간이 부족합니다. 이전 대화를 삭제해주세요.');
    } else {
      alert('대화 저장에 실패했습니다. 브라우저 설정을 확인해주세요.');
    }
    return false;
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

