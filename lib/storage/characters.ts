import type { Character } from '../gemini/types';

const STORAGE_KEY = 'characters';
const MAX_CHARACTERS = 50;

export function generateCharacterId(): string {
  return `char_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function loadCharacters(): Character[] {
  if (typeof window === 'undefined') return [];
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    
    const characters = JSON.parse(stored) as Character[];
    return characters.sort((a, b) => b.updatedAt - a.updatedAt);
  } catch (error) {
    console.error('Failed to load characters:', error);
    return [];
  }
}

export function saveCharacter(character: Character): void {
  if (typeof window === 'undefined') return;
  
  try {
    const characters = loadCharacters();
    const existingIndex = characters.findIndex(c => c.id === character.id);
    
    if (existingIndex >= 0) {
      characters[existingIndex] = { ...character, updatedAt: Date.now() };
    } else {
      if (characters.length >= MAX_CHARACTERS) {
        throw new Error(`최대 ${MAX_CHARACTERS}개의 캐릭터만 저장할 수 있습니다.`);
      }
      characters.unshift(character);
    }
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(characters));
  } catch (error) {
    console.error('Failed to save character:', error);
    throw error;
  }
}

export function updateCharacter(id: string, updates: Partial<Character>): void {
  if (typeof window === 'undefined') return;
  
  try {
    const characters = loadCharacters();
    const index = characters.findIndex(c => c.id === id);
    
    if (index >= 0) {
      characters[index] = {
        ...characters[index],
        ...updates,
        updatedAt: Date.now(),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(characters));
    }
  } catch (error) {
    console.error('Failed to update character:', error);
    throw error;
  }
}

export function deleteCharacter(id: string): void {
  if (typeof window === 'undefined') return;
  
  try {
    const characters = loadCharacters();
    const filtered = characters.filter(c => c.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error('Failed to delete character:', error);
    throw error;
  }
}

export function getCharacter(id: string): Character | null {
  const characters = loadCharacters();
  return characters.find(c => c.id === id) || null;
}

export function createCharacter(data: Omit<Character, 'id' | 'createdAt' | 'updatedAt'>): Character {
  const now = Date.now();
  return {
    ...data,
    id: generateCharacterId(),
    createdAt: now,
    updatedAt: now,
  };
}

// 기본 캐릭터 시드 데이터
export const DEFAULT_CHARACTERS: Omit<Character, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    name: '루나',
    personality: '밝고 활발한 성격입니다. 항상 긍정적이고 에너지가 넘칩니다. 유머러스하고 장난기 많은 면이 있어서 대화가 재미있습니다.',
    firstPerson: '나',
    secondPerson: '너',
    style: '친근한 반말',
    relationship: '친한 친구',
    background: '어릴 때부터 함께 자란 소꿉친구입니다.',
    traits: ['밝음', '활발함', '유머러스', '긍정적'],
    safetyRules: '과도한 비속어나 폭력적인 표현은 사용하지 않습니다.',
    isDefault: true,
  },
  {
    name: '세이지',
    personality: '차분하고 지적인 성격입니다. 깊이 있는 대화를 좋아하며, 조용하고 신중하게 말합니다. 지식이 풍부하고 분석적인 사고를 합니다.',
    firstPerson: '저',
    secondPerson: '당신',
    style: '정중한 존댓말',
    relationship: '신뢰하는 멘토',
    background: '다양한 분야에 해박한 지식을 가진 현명한 조언자입니다.',
    traits: ['차분함', '지적임', '분석적', '신중함'],
    safetyRules: '근거 없는 단정적인 주장을 피하고, 모르는 것은 모른다고 솔직히 말합니다.',
    isDefault: true,
  },
  {
    name: '토비',
    personality: '장난기 많고 유머러스한 성격입니다. 농담을 좋아하고 분위기를 밝게 만듭니다. 때로는 엉뚱하지만 항상 재미있고 긍정적입니다.',
    firstPerson: '난',
    secondPerson: '넌',
    style: '활발한 반말',
    relationship: '재미있는 동료',
    background: '언제나 주변을 웃게 만드는 분위기 메이커입니다.',
    traits: ['장난기', '유머러스', '엉뚱함', '긍정적'],
    safetyRules: '농담이 과하지 않도록 선을 지키며, 상대방의 기분을 배려합니다.',
    isDefault: true,
  },
];

// 첫 실행 시 기본 캐릭터 초기화
export function initializeDefaultCharacters(): void {
  if (typeof window === 'undefined') return;
  
  const existing = loadCharacters();
  if (existing.length === 0) {
    DEFAULT_CHARACTERS.forEach(charData => {
      const character = createCharacter(charData);
      saveCharacter(character);
    });
  }
}

