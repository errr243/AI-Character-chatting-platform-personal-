export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatRequest {
  messages: ChatMessage[];
  characterName?: string;
  characterPersonality?: string;
  contextSummary?: string; // 이전 대화 요약
  userNote?: string;       // 사용자 노트 (직접 작성하는 세계관/상황 설정)
  model?: 'gemini-flash' | 'gemini-pro';
  maxOutputTokens?: number; // 최대 출력 토큰 수
  thinkingBudget?: number | -1; // Thinking budget (Pro: 128~32768, -1=동적, undefined=API 기본값)
  activeLorebooks?: Array<{ id: string; keywords: string[]; content: string }>; // 활성화된 로어북 목록
}

export interface ChatResponse {
  message: string;
  model: string;
  tokens?: number;
}

// 캐릭터 인터페이스
export interface Character {
  id: string;                    // 고유 ID
  name: string;                  // 캐릭터 이름
  avatar?: string;               // 아바타 이미지 URL (선택)
  
  // 프롬프트 구조화
  personality: string;           // 기본 성격 설명
  firstPerson: string;           // 1인칭 (예: 나, 저, 본인)
  secondPerson: string;          // 2인칭 (예: 너, 당신, 선생님)
  style: string;                 // 말투 (예: 존댓말, 반말, 친근함)
  relationship: string;          // 관계 (예: 친구, 선배, 후배)
  
  // 상세 설정
  background?: string;           // 배경 설정
  traits: string[];              // 특징 태그
  safetyRules?: string;          // 안전/금지 규칙
  
  // 메타데이터
  isDefault: boolean;            // 기본 프리셋 여부
  createdAt: number;
  updatedAt: number;
}
