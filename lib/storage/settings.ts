export type OutputSpeed = 'instant' | 'fast' | 'medium' | 'slow';

export type MaxOutputTokens = 256 | 512 | 1024 | 2048 | 4096 | 6144 | 8192; // 토큰 수 (최소 256)
export type ThinkingBudget = 128 | 512 | 1024 | 2048 | 32768 | -1 | undefined; // 토큰 수 (Pro: 128~32768, -1=동적), undefined는 API 기본값
export type MaxActiveLorebooks = 3 | 5 | 8 | 10;
export type UIStyle = 'modern' | 'classic';

export interface ChatSettings {
  outputSpeed: OutputSpeed;
  maxOutputTokens: MaxOutputTokens;
  thinkingBudget: ThinkingBudget;
  maxActiveLorebooks: MaxActiveLorebooks;
  autoScroll: boolean; // 자동 스크롤 활성화 여부
  uiStyle: UIStyle; // UI 스타일 (modern: 신형, classic: 구형)
}

const STORAGE_KEY = 'chat_settings';
const DEFAULT_SETTINGS: ChatSettings = {
  outputSpeed: 'instant',
  maxOutputTokens: 8192, // 제한 없음
  thinkingBudget: 1024, // 기본값: 중간 정도의 사고 품질
  maxActiveLorebooks: 5, // 기본값: 5개
  autoScroll: true, // 기본값: 자동 스크롤 활성화
  uiStyle: 'modern', // 기본값: 신형 UI
};

export function loadSettings(): ChatSettings {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS;
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return DEFAULT_SETTINGS;
    
    const settings = JSON.parse(stored) as any;
    
    // 기존 maxOutputTokens 값을 새 값으로 마이그레이션
    if (settings.maxOutputTokens !== undefined) {
      const oldValue = settings.maxOutputTokens;
      if (oldValue === 100) settings.maxOutputTokens = 256;
      else if (oldValue === 500) settings.maxOutputTokens = 512;
      else if (oldValue === 1000) settings.maxOutputTokens = 1024;
      else if (![256, 512, 1024, 2048, 4096, 6144, 8192].includes(oldValue)) {
        // 유효하지 않은 값이면 기본값 사용
        settings.maxOutputTokens = 8192;
      }
    }
    
    // thinkingBudget 마이그레이션
    if (settings.thinkingBudget !== undefined) {
      const validValues = [128, 512, 1024, 2048, 32768, -1];
      // undefined는 1024로 변경 (새 기본값)
      if (settings.thinkingBudget === undefined) {
        settings.thinkingBudget = 1024;
      }
      // 유효하지 않은 값이면 1024로 설정
      else if (!validValues.includes(settings.thinkingBudget)) {
        settings.thinkingBudget = 1024;
      }
    } else {
      // thinkingBudget이 없으면 기본값 설정
      settings.thinkingBudget = 1024;
    }
    
    // maxActiveLorebooks 마이그레이션
    if (settings.maxActiveLorebooks === undefined) {
      settings.maxActiveLorebooks = 5;
    } else {
      const validValues = [3, 5, 8, 10];
      if (!validValues.includes(settings.maxActiveLorebooks)) {
        settings.maxActiveLorebooks = 5;
      }
    }
    
    // autoScroll 마이그레이션
    if (settings.autoScroll === undefined) {
      settings.autoScroll = true;
    }

    // uiStyle 마이그레이션
    if (settings.uiStyle === undefined || !['modern', 'classic'].includes(settings.uiStyle)) {
      settings.uiStyle = 'modern';
    }
    
    return { ...DEFAULT_SETTINGS, ...settings };
  } catch (error) {
    console.error('Failed to load settings:', error);
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: ChatSettings): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch (error) {
    console.error('Failed to save settings:', error);
  }
}

export function updateSettings(updates: Partial<ChatSettings>): void {
  const current = loadSettings();
  saveSettings({ ...current, ...updates });
}
