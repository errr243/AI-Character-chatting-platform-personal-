// 로어북 저장소 및 키워드 감지 로직

import type { ChatMessage } from '@/lib/gemini/types';

export interface LorebookEntry {
  id: string;
  keywords: string[]; // 최대 5개
  content: string; // 최대 500자
  enabled: boolean;
  createdAt: number;
  updatedAt: number;
}

const STORAGE_KEY = 'lorebooks';
const MAX_KEYWORDS = 5;
const MAX_CONTENT_LENGTH = 500;

export function generateLorebookId(): string {
  return `lorebook_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function loadLorebooks(): LorebookEntry[] {
  if (typeof window === 'undefined') return [];
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    
    const lorebooks = JSON.parse(stored) as LorebookEntry[];
    return lorebooks.sort((a, b) => b.updatedAt - a.updatedAt);
  } catch (error) {
    console.error('Failed to load lorebooks:', error);
    return [];
  }
}

export function saveLorebooks(lorebooks: LorebookEntry[]): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(lorebooks));
  } catch (error) {
    console.error('Failed to save lorebooks:', error);
    throw error;
  }
}

export function addLorebook(data: Omit<LorebookEntry, 'id' | 'createdAt' | 'updatedAt'>): LorebookEntry {
  // 유효성 검사
  if (data.keywords.length > MAX_KEYWORDS) {
    throw new Error(`최대 ${MAX_KEYWORDS}개의 키워드만 입력할 수 있습니다.`);
  }
  if (data.content.length > MAX_CONTENT_LENGTH) {
    throw new Error(`내용은 최대 ${MAX_CONTENT_LENGTH}자까지 입력할 수 있습니다.`);
  }
  
  const lorebooks = loadLorebooks();
  const now = Date.now();
  const newEntry: LorebookEntry = {
    ...data,
    id: generateLorebookId(),
    createdAt: now,
    updatedAt: now,
  };
  
  lorebooks.unshift(newEntry);
  saveLorebooks(lorebooks);
  return newEntry;
}

export function updateLorebook(id: string, updates: Partial<Omit<LorebookEntry, 'id' | 'createdAt'>>): void {
  const lorebooks = loadLorebooks();
  const index = lorebooks.findIndex(l => l.id === id);
  
  if (index < 0) {
    throw new Error('로어북을 찾을 수 없습니다.');
  }
  
  // 유효성 검사
  if (updates.keywords && updates.keywords.length > MAX_KEYWORDS) {
    throw new Error(`최대 ${MAX_KEYWORDS}개의 키워드만 입력할 수 있습니다.`);
  }
  if (updates.content && updates.content.length > MAX_CONTENT_LENGTH) {
    throw new Error(`내용은 최대 ${MAX_CONTENT_LENGTH}자까지 입력할 수 있습니다.`);
  }
  
  lorebooks[index] = {
    ...lorebooks[index],
    ...updates,
    updatedAt: Date.now(),
  };
  
  saveLorebooks(lorebooks);
}

export function deleteLorebook(id: string): void {
  const lorebooks = loadLorebooks();
  const filtered = lorebooks.filter(l => l.id !== id);
  saveLorebooks(filtered);
}

export function getLorebook(id: string): LorebookEntry | null {
  const lorebooks = loadLorebooks();
  return lorebooks.find(l => l.id === id) || null;
}

/**
 * 메시지에서 키워드를 감지하여 활성화된 로어북을 반환합니다.
 * @param messages 최근 메시지들 (사용자 + AI)
 * @param lorebooks 모든 로어북 목록
 * @param maxActive 최대 활성 로어북 수
 * @returns 감지된 로어북 목록 (최대 maxActive개)
 */
export function detectKeywords(
  messages: ChatMessage[],
  lorebooks: LorebookEntry[],
  maxActive: number = 5
): LorebookEntry[] {
  if (messages.length === 0 || lorebooks.length === 0) {
    return [];
  }
  
  // 활성화된 로어북만 필터링
  const enabledLorebooks = lorebooks.filter(l => l.enabled);
  if (enabledLorebooks.length === 0) {
    return [];
  }
  
  // 모든 메시지를 하나의 텍스트로 합침
  const combinedText = messages
    .map(m => m.content)
    .join(' ')
    .toLowerCase();
  
  // 키워드가 감지된 로어북 찾기
  const detected: LorebookEntry[] = [];
  
  for (const lorebook of enabledLorebooks) {
    // 로어북의 키워드 중 하나라도 메시지에 포함되면 선택
    const hasKeyword = lorebook.keywords.some(keyword => {
      const normalizedKeyword = keyword.trim().toLowerCase();
      if (normalizedKeyword.length === 0) return false;
      return combinedText.includes(normalizedKeyword);
    });
    
    if (hasKeyword) {
      detected.push(lorebook);
    }
  }
  
  // 최대 활성 로어북 수 제한 (최근 업데이트된 순으로 정렬)
  const sorted = detected.sort((a, b) => b.updatedAt - a.updatedAt);
  return sorted.slice(0, maxActive);
}

