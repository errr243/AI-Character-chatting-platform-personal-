// API 키 관리 스토리지

const STORAGE_KEY = 'gemini_api_keys';
const SELECTED_KEY_ID_STORAGE_KEY = 'gemini_selected_api_key_id';

export interface ApiKeyInfo {
  id: string;
  key: string;
  name: string;
  isActive: boolean;
  lastUsed?: number;
  quotaExceeded?: number; // 할당량 초과된 시간 (timestamp)
  createdAt: number;
}

export function generateApiKeyId(): string {
  return `key_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function loadApiKeys(): ApiKeyInfo[] {
  if (typeof window === 'undefined') return [];
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      // 환경 변수에서 기본 API 키 가져오기 (서버 사이드)
      return [];
    }
    
    const keys = JSON.parse(stored) as ApiKeyInfo[];
    return keys.sort((a, b) => {
      // 활성 키 우선, 그 다음 마지막 사용 시간
      if (a.isActive !== b.isActive) return a.isActive ? -1 : 1;
      return (b.lastUsed || 0) - (a.lastUsed || 0);
    });
  } catch (error) {
    console.error('Failed to load API keys:', error);
    return [];
  }
}

export function saveApiKeys(keys: ApiKeyInfo[]): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(keys));
  } catch (error) {
    console.error('Failed to save API keys:', error);
  }
}

export function addApiKey(key: string, name: string): ApiKeyInfo {
  const keys = loadApiKeys();
  const newKey: ApiKeyInfo = {
    id: generateApiKeyId(),
    key,
    name,
    isActive: true,
    createdAt: Date.now(),
  };
  keys.push(newKey);
  saveApiKeys(keys);
  return newKey;
}

export function updateApiKey(id: string, updates: Partial<ApiKeyInfo>): void {
  const keys = loadApiKeys();
  const index = keys.findIndex(k => k.id === id);
  if (index >= 0) {
    keys[index] = { ...keys[index], ...updates };
    saveApiKeys(keys);
  }
}

export function deleteApiKey(id: string): void {
  const keys = loadApiKeys();
  const filtered = keys.filter(k => k.id !== id);
  saveApiKeys(filtered);
}

export function getActiveApiKey(): string | null {
  // 서버 사이드에서는 환경 변수 사용
  if (typeof window === 'undefined') {
    return process.env.GOOGLE_GEMINI_API_KEY || null;
  }
  
  // 클라이언트 사이드에서는 localStorage에서 활성 키 찾기
  const keys = loadApiKeys();
  const activeKey = keys.find(k => k.isActive && !k.quotaExceeded);
  
  if (activeKey) {
    // 마지막 사용 시간 업데이트
    updateApiKey(activeKey.id, { lastUsed: Date.now() });
    return activeKey.key;
  }
  
  // 활성 키가 없으면 첫 번째 키 사용
  if (keys.length > 0) {
    updateApiKey(keys[0].id, { lastUsed: Date.now() });
    return keys[0].key;
  }
  
  return null;
}

export function markApiKeyQuotaExceeded(id: string): void {
  updateApiKey(id, { quotaExceeded: Date.now() });
}

export function getNextAvailableApiKey(currentKeyId?: string): string | null {
  if (typeof window === 'undefined') {
    return process.env.GOOGLE_GEMINI_API_KEY || null;
  }
  
  const keys = loadApiKeys();
  
  // 현재 키의 인덱스 찾기
  let currentIndex = -1;
  if (currentKeyId) {
    currentIndex = keys.findIndex(k => k.id === currentKeyId);
  }
  
  // 다음 사용 가능한 키 찾기 (할당량 초과되지 않은 키)
  for (let i = 0; i < keys.length; i++) {
    const index = (currentIndex + 1 + i) % keys.length;
    const key = keys[index];
    
    // 할당량 초과된 키는 1시간 후에 다시 시도
    if (key.quotaExceeded) {
      const oneHour = 60 * 60 * 1000;
      if (Date.now() - key.quotaExceeded < oneHour) {
        continue; // 아직 1시간이 지나지 않음
      } else {
        // 1시간이 지났으므로 할당량 초과 플래그 제거
        updateApiKey(key.id, { quotaExceeded: undefined });
      }
    }
    
    if (key.isActive && !key.quotaExceeded) {
      updateApiKey(key.id, { lastUsed: Date.now() });
      return key.key;
    }
  }
  
  return null;
}

// 현재 선택된 API 키 ID 저장
export function setSelectedApiKeyId(keyId: string | null): void {
  if (typeof window === 'undefined') return;
  
  try {
    if (keyId) {
      localStorage.setItem(SELECTED_KEY_ID_STORAGE_KEY, keyId);
    } else {
      localStorage.removeItem(SELECTED_KEY_ID_STORAGE_KEY);
    }
  } catch (error) {
    console.error('Failed to save selected API key ID:', error);
  }
}

// 현재 선택된 API 키 ID 로드
export function getSelectedApiKeyId(): string | null {
  if (typeof window === 'undefined') return null;
  
  try {
    return localStorage.getItem(SELECTED_KEY_ID_STORAGE_KEY);
  } catch (error) {
    console.error('Failed to load selected API key ID:', error);
    return null;
  }
}

// 선택된 키 ID로 API 키 가져오기
export function getSelectedApiKey(): string | null {
  if (typeof window === 'undefined') {
    return process.env.GOOGLE_GEMINI_API_KEY || null;
  }
  
  const selectedKeyId = getSelectedApiKeyId();
  if (!selectedKeyId) {
    // 선택된 키가 없으면 기존 로직 사용
    return getActiveApiKey();
  }
  
  const keys = loadApiKeys();
  const selectedKey = keys.find(k => k.id === selectedKeyId);
  
  if (selectedKey && selectedKey.isActive) {
    // 할당량 초과 확인
    if (selectedKey.quotaExceeded) {
      const oneHour = 60 * 60 * 1000;
      if (Date.now() - selectedKey.quotaExceeded < oneHour) {
        // 할당량 초과된 키는 사용하지 않음, 대체 키 반환
        return getActiveApiKey();
      } else {
        // 1시간이 지났으므로 할당량 초과 플래그 제거
        updateApiKey(selectedKey.id, { quotaExceeded: undefined });
      }
    }
    
    updateApiKey(selectedKey.id, { lastUsed: Date.now() });
    return selectedKey.key;
  }
  
  // 선택된 키가 없거나 비활성화된 경우 기본 로직 사용
  return getActiveApiKey();
}

